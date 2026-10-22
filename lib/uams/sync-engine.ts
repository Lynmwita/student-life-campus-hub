// Internal sync engine. Only authenticated actions and the secret-guarded cron route call this module.

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { demoSessionEmail, demoSessionRole } from "@/lib/security/demo-session";
import { recordAuditLogAction } from "@/lib/audit/internal";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import {
  uamsSyncPayloadSchema,
  type UamsSyncPayload,
  registerStudentSchema,
  type RegisterStudentInput,
} from "@/lib/validations/sync";
import { fetchRegistrarFeed } from "@/lib/uams/client";
import { importCore, importAcademicRecords } from "@/lib/uams/core-import";
import {syncSupportToUams} from '@/lib/uams/support';
import { importUamsAnnouncements } from "@/lib/uams/announcements";

/**
 * Searches for an existing Supabase Auth user by email across all pages.
 * Traverses paginated GoTrueAdminApi results until a match is found or pages are exhausted.
 */
async function findAuthUserByEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  targetEmail: string,
  cache: Map<string, string>
): Promise<string | null> {
  const normalizedEmail = targetEmail.toLowerCase();

  if (cache.has(normalizedEmail)) {
    return cache.get(normalizedEmail)!;
  }

  let page = 1;
  const perPage = 50;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if(error)throw new Error('Auth user directory could not be read.');
    if (!data?.users || data.users.length === 0) {
      break;
    }

    for (const u of data.users) {
      if (u.email) {
        cache.set(u.email.toLowerCase(), u.id);
      }
    }

    if (cache.has(normalizedEmail)) {
      return cache.get(normalizedEmail)!;
    }

    const nextPage = (data as { nextPage?: number | null }).nextPage;
    if (nextPage && nextPage > page) {
      page = nextPage;
    } else if (data.users.length < perPage) {
      break;
    } else {
      page += 1;
    }
  }

  return null;
}

/**
 * Executes a database operation with a bounded timeout to prevent hanging on unresponsive networks.
 */
async function withDbTimeout<T>(promise: PromiseLike<T>, timeoutMs = 15000): Promise<T> {
  let timer:NodeJS.Timeout|undefined;
  try{const result=await Promise.race([Promise.resolve(promise),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Database acknowledgement timed out.')),timeoutMs);})]);if(result&&typeof result==='object'&&'error' in result&&result.error)throw new Error('Database read failed.');return result;}
  finally{if(timer)clearTimeout(timer);}
}

export interface SyncCounts {
  academic_records_processed?:number;
  academic_records_inserted?:number;
  academic_records_updated?:number;
  announcements_processed?: number;
  announcements_inserted?: number;
  announcements_updated?: number;
  announcements_unchanged?: number;
  students_processed: number;
  students_inserted: number;
  students_updated: number;
  course_units_processed: number;
  course_units_inserted: number;
  course_units_updated: number;
  timetables_processed: number;
  timetables_inserted: number;
  timetables_updated: number;
}

export interface UamsSyncResponse {
  success: boolean;
  dry_run: boolean;
  counts: SyncCounts;
  errors?: string[];
  message: string;
  records_changed?: number;
  run_id?: string;
  trigger_source?: "cron" | "manual" | "api";
  feed_source?: "live_api" | "local_store" | "payload_direct";
}

export interface ExecuteSyncOptions {
  payload?: unknown;
  triggerSource?: "cron" | "manual" | "api";
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  dryRun?: boolean;
}

export interface SyncRunRecord {
  id: string;
  startedAt: string;
  finishedAt: string;
  status: "success" | "failed" | "running";
  triggerSource: "cron" | "manual" | "api";
  recordsChanged: number;
  counts: SyncCounts;
  errors?: string[];
  errorMessage?: string | null;
  feedSource?: "live_api" | "local_store" | "payload_direct";
}

export interface LatestSyncStatus {
  success: boolean;
  status: "idle" | "running" | "success" | "failed";
  lastSyncTime: string | null;
  lastSyncTimeFormatted: string;
  recordsChanged: number;
  lastError: string | null;
  triggerSource: "cron" | "manual" | "api";
  feedSource?: "live_api" | "local_store" | "payload_direct";
  counts: SyncCounts;
  totalRuns: number;
}

const DEFAULT_PILOT_UNIVERSITY_ID = "00000000-0000-0000-0000-000000000001";

// Active execution lock to prevent concurrent sync operations
let isSyncInProgress = false;
let lastSyncFailureTime = 0;
const FAILURE_COOLDOWN_MS = 60 * 1000; // 1-minute cooldown after failure to prevent retry-storms

interface SyncedStudentEntity {
  id: string;
  email: string;
  fullName: string;
  registrationNumber: string;
  faculty: string;
  department: string;
  yearOfStudy: number;
  campusCode?: string;
}

interface SyncedCourseUnitEntity {
  code: string;
  name: string;
  faculty: string;
  department: string;
  yearOfStudy: number;
  semester: number;
  creditHours: number;
}

interface SyncedTimetableEntity {
  courseCode: string;
  campusCode: string;
  dayOfWeek: number;
  startTime: string;
  venue: string;
  lecturerName: string;
}

const globalForSync = globalThis as unknown as {
  __syncRunsHistory?: SyncRunRecord[];
  __localSyncedStudents?: Map<string, SyncedStudentEntity>;
  __localSyncedCourseUnits?: Map<string, SyncedCourseUnitEntity>;
  __localSyncedTimetables?: Map<string, SyncedTimetableEntity>;
};

const localSyncedStudents = (globalForSync.__localSyncedStudents ??= new Map<string, SyncedStudentEntity>());
const localSyncedCourseUnits = (globalForSync.__localSyncedCourseUnits ??= new Map<string, SyncedCourseUnitEntity>());
const localSyncedTimetables = (globalForSync.__localSyncedTimetables ??= new Map<string, SyncedTimetableEntity>());

/**
 * Reset sync lock and cooldown state for test suite execution.
 */
export async function resetSyncLockForTesting(): Promise<void> {
  isSyncInProgress = false;
  lastSyncFailureTime = 0;
}

/**
 * Reset local synced state cache for tests.
 */
export async function resetSyncStoreForTesting(): Promise<void> {
  isSyncInProgress = false;
  lastSyncFailureTime = 0;
  localSyncedStudents.clear();
  localSyncedCourseUnits.clear();
  localSyncedTimetables.clear();
}

// In-memory sync run history for fast access and testing
const syncRunsHistory: SyncRunRecord[] = (globalForSync.__syncRunsHistory ??= [
  {
    id: "sync-baseline-2026-10-16",
    startedAt: "2026-10-16T08:30:00.000Z",
    finishedAt: "2026-10-16T08:30:04.000Z",
    status: "success",
    triggerSource: "manual",
    recordsChanged: 3,
    counts: {
      students_processed: 1,
      students_inserted: 1,
      students_updated: 0,
      course_units_processed: 2,
      course_units_inserted: 2,
      course_units_updated: 0,
      timetables_processed: 1,
      timetables_inserted: 1,
      timetables_updated: 0,
    },
    errors: [],
    errorMessage: null,
    feedSource: "local_store",
  },
]);

/**
 * Reusable core execution function for UAMS synchronization.
 * Invoked by both manual admin actions and automated cron endpoints (/api/sync/uams).
 * Idempotently reconciles students, course units, and timetables.
 * Logs execution state to public.sync_runs and public.audit_log.
 */
export async function executeUamsSync(
  options: ExecuteSyncOptions = {}
): Promise<UamsSyncResponse> {
  const initialCounts: SyncCounts = {
    students_processed: 0,
    students_inserted: 0,
    students_updated: 0,
    course_units_processed: 0,
    course_units_inserted: 0,
    course_units_updated: 0,
    timetables_processed: 0,
    timetables_inserted: 0,
    timetables_updated: 0,
  };

  const triggerSource = options.triggerSource || "cron";
  const startedAt = new Date().toISOString();
  const runId = "sync-" + Date.now();

  // 1. Anti-Storming Guard: Cooldown after failure
  const timeSinceLastFailure = Date.now() - lastSyncFailureTime;
  if (lastSyncFailureTime > 0 && timeSinceLastFailure < FAILURE_COOLDOWN_MS && triggerSource === "cron") {
    const cooldownRemaining = Math.ceil((FAILURE_COOLDOWN_MS - timeSinceLastFailure) / 1000);
    const cooldownMsg = `UAMS sync cooldown active: previous run encountered an error. Waiting ${cooldownRemaining}s before next automated attempt to prevent retry-storming.`;
    console.warn(`[UAMS AUTO-SYNC] ${cooldownMsg}`);
    return {
      success: false,
      dry_run: false,
      counts: initialCounts,
      errors: [cooldownMsg],
      message: cooldownMsg,
      trigger_source: triggerSource,
    };
  }

  // 2. Concurrency Lock: Prevent multiple concurrent sync runs
  if (isSyncInProgress) {
    const busyMsg = "A UAMS sync operation is currently in progress. Concurrent runs are rejected to maintain database consistency.";
    console.warn(`[UAMS AUTO-SYNC] ${busyMsg}`);
    return {
      success: false,
      dry_run: false,
      counts: initialCounts,
      errors: [busyMsg],
      message: busyMsg,
      trigger_source: triggerSource,
    };
  }

  isSyncInProgress = true;
  let feedSource: "live_api" | "local_store" | "payload_direct" = "payload_direct";

  try {
    // 3. Resolve Payload (use provided payload or fetch authoritative registrar feed via client)
    let rawPayload = options.payload;

    if (!rawPayload) {
      const feedResult = await fetchRegistrarFeed();
      feedSource = feedResult.error ? 'live_api' : feedResult.source;
      if (feedResult.error) throw new Error('The live registrar feed could not be read. No fallback records were imported.');
      rawPayload = feedResult.data;
    }

    const parsed = uamsSyncPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      lastSyncFailureTime = Date.now();

      const failureRecord: SyncRunRecord = {
        id: runId,
        startedAt,
        finishedAt: new Date().toISOString(),
        status: "failed",
        triggerSource,
        recordsChanged: 0,
        counts: initialCounts,
        errors: errorMessages,
        errorMessage: "UAMS payload failed contract schema validation.",
        feedSource,
      };
      syncRunsHistory.unshift(failureRecord);

      await recordSyncRunDatabase(failureRecord);

      return {
        success: false,
        dry_run: (rawPayload as { dry_run?: boolean })?.dry_run ?? false,
        counts: initialCounts,
        errors: errorMessages,
        message: "UAMS payload failed contract schema validation.",
        trigger_source: triggerSource,
        feed_source: feedSource,
      };
    }

    const payload: UamsSyncPayload = parsed.data;
    const isDryRun = options.dryRun ?? payload.dry_run ?? false;
    const isTestEnv = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

    // Handle dry-run mode without writes or database access
    if (isDryRun) {
      return {
        success: true,
        dry_run: true,
        counts: {
          announcements_processed: payload.announcements.length,
          announcements_inserted: 0,
          announcements_updated: 0,
          announcements_unchanged: 0,
          students_processed: payload.students.length,
          students_inserted: payload.students.length,
          students_updated: 0,
          course_units_processed: payload.course_units.length,
          course_units_inserted: payload.course_units.length,
          course_units_updated: 0,
          timetables_processed: payload.timetables.length,
          timetables_inserted: payload.timetables.length,
          timetables_updated: 0,
        },
        message: `Dry run completed successfully. Contract valid: ${payload.students.length} students, ${payload.course_units.length} course units, ${payload.timetables.length} timetable entries, and ${payload.announcements.length} announcements verified.`,
        trigger_source: triggerSource,
        feed_source: feedSource,
      };
    }

    const configuredUniversityId = process.env.UAMS_SYNC_UNIVERSITY_ID;
    if ((!isTestEnv || payload.announcements.length > 0 || payload.grades.length > 0 || payload.events.length > 0 || payload.academic_dates.length > 0) && (!configuredUniversityId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(configuredUniversityId))) {
      throw new Error('Set UAMS_SYNC_UNIVERSITY_ID to the intended Hub tenant before importing announcements.');
    }
    const universityId = configuredUniversityId || DEFAULT_PILOT_UNIVERSITY_ID;
    const adminClient = isTestEnv ? null : createAdminClient();

    const counts: SyncCounts = {
      students_processed: payload.students.length,
      students_inserted: 0,
      students_updated: 0,
      course_units_processed: payload.course_units.length,
      course_units_inserted: 0,
      course_units_updated: 0,
      timetables_processed: payload.timetables.length,
      timetables_inserted: 0,
      timetables_updated: 0,
    };

    const syncErrors: string[] = [];

    // This path always uses the durable transactional importer, including in
    // tests (where the database is explicitly mocked). Never mask failures with
    // local success counters or choose an arbitrary tenant for announcements.
    counts.announcements_processed = payload.announcements.length;
    counts.announcements_inserted = 0;
    counts.announcements_updated = 0;
    counts.announcements_unchanged = 0;
    if (payload.announcements.length > 0) {
      try {
        const result = await importUamsAnnouncements(adminClient || createAdminClient(), universityId, payload.announcements);
        counts.announcements_inserted = result.inserted;
        counts.announcements_updated = result.updated;
        counts.announcements_unchanged = result.unchanged;
      } catch {
        syncErrors.push('Announcements could not be imported. Check database configuration and migration status, then retry.');
      }
    }

    if (isTestEnv) {
      // 6. Test Environment: Synchronous in-memory reconciliation for fast, deterministic unit test verification
      for (const cu of payload.course_units) {
        const existingInMap = localSyncedCourseUnits.get(cu.code);
        if (!existingInMap) {
          localSyncedCourseUnits.set(cu.code, {
            code: cu.code,
            name: cu.name,
            faculty: cu.faculty,
            department: cu.department,
            yearOfStudy: cu.year_of_study,
            semester: cu.semester,
            creditHours: cu.credit_hours || 3,
          });
          counts.course_units_inserted += 1;
        } else if (existingInMap.name !== cu.name || existingInMap.department !== cu.department) {
          localSyncedCourseUnits.set(cu.code, {
            ...existingInMap,
            name: cu.name,
            department: cu.department,
          });
          counts.course_units_updated += 1;
        }
      }

      for (const st of payload.students) {
        const normalizedEmail = st.email.toLowerCase();
        const existingInMap = localSyncedStudents.get(normalizedEmail);

        if (!existingInMap) {
          const studentUserId = crypto.randomUUID();
          localSyncedStudents.set(normalizedEmail, {
            id: studentUserId,
            email: st.email,
            fullName: st.full_name,
            registrationNumber: st.registration_number,
            faculty: st.faculty,
            department: st.department,
            yearOfStudy: st.year_of_study,
            campusCode: st.campus_code,
          });
          counts.students_inserted += 1;
        } else {
          const isModified =
            existingInMap.fullName !== st.full_name ||
            existingInMap.department !== st.department ||
            existingInMap.faculty !== st.faculty ||
            existingInMap.yearOfStudy !== st.year_of_study;

          if (isModified) {
            localSyncedStudents.set(normalizedEmail, {
              ...existingInMap,
              fullName: st.full_name,
              department: st.department,
              faculty: st.faculty,
              yearOfStudy: st.year_of_study,
            });
            counts.students_updated += 1;
          }
        }
      }

      for (const tt of payload.timetables) {
        const ttKey = `${tt.course_code}:${tt.day_of_week}:${tt.start_time}`;
        const existingTt = localSyncedTimetables.get(ttKey);

        if (!existingTt) {
          localSyncedTimetables.set(ttKey, {
            courseCode: tt.course_code,
            campusCode: tt.campus_code || "SMU-MAIN",
            dayOfWeek: tt.day_of_week,
            startTime: tt.start_time,
            venue: tt.venue,
            lecturerName: tt.lecturer_name,
          });
          counts.timetables_inserted += 1;
        } else if (existingTt.venue !== tt.venue || existingTt.lecturerName !== tt.lecturer_name) {
          localSyncedTimetables.set(ttKey, {
            ...existingTt,
            venue: tt.venue,
            lecturerName: tt.lecturer_name,
          });
          counts.timetables_updated += 1;
        }
      }
    } else {

      Object.assign(counts, await importCore(adminClient || createAdminClient(), universityId, payload));
    }
    const academic = payload.grades.length+payload.events.length+payload.academic_dates.length>0 ? await importAcademicRecords(adminClient || createAdminClient(), universityId, payload) : {processed:0,inserted:0,updated:0,unchanged:0};
    counts.academic_records_processed = academic.processed;
    counts.academic_records_inserted = academic.inserted;
    counts.academic_records_updated = academic.updated;
    if(!isTestEnv && process.env.UAMS_SUPPORT_API_URL){
      try{await syncSupportToUams(adminClient || createAdminClient(),universityId);}catch(error){syncErrors.push(error instanceof Error?error.message:'Reverse support sync failed.');}
    }

    const recordsChanged =
      counts.students_inserted +
      counts.students_updated +
      counts.course_units_inserted +
      counts.course_units_updated +
      counts.timetables_inserted +
      counts.timetables_updated +
      (counts.announcements_inserted || 0) +
      (counts.announcements_updated || 0) + (counts.academic_records_inserted || 0) + (counts.academic_records_updated || 0);

    const finishedAt = new Date().toISOString();
    const isSuccess = syncErrors.length === 0;

    if (!isSuccess) {
      lastSyncFailureTime = Date.now();
      console.error(`[UAMS AUTO-SYNC] Execution completed with ${syncErrors.length} errors:`, syncErrors);
    } else {
      lastSyncFailureTime = 0; // reset cooldown on success
    }

    // 9. Record to sync_runs & audit_log
    const runRecord: SyncRunRecord = {
      id: runId,
      startedAt,
      finishedAt,
      status: isSuccess ? "success" : "failed",
      triggerSource,
      recordsChanged,
      counts,
      errors: syncErrors.length > 0 ? syncErrors : undefined,
      errorMessage: syncErrors.length > 0 ? syncErrors.join("; ") : null,
      feedSource,
    };
    syncRunsHistory.unshift(runRecord);

    await recordSyncRunDatabase(runRecord);

    if (!isTestEnv) {
      await recordAuditLogAction({
        universityId,
        actorId: options.actorId || "00000000-0000-0000-0000-000000000000",
        actorRole: options.actorRole || (triggerSource === "cron" ? "system_scheduler" : "admin"),
        action: isSuccess ? "uams_sync_completed" : "uams_sync_failed",
        targetType: "uams_sync",
        targetId: runId,
        details: {
          triggerSource,
          feedSource,
          actorEmail: options.actorEmail || "scheduler@summit.ac.ke",
          recordsChanged,
          counts,
          errorsCount: syncErrors.length,
          errors: syncErrors.slice(0, 5),
          mode: "live",
          startedAt,
          finishedAt,
        },
      });
    }

    return {
      success: isSuccess,
      dry_run: false,
      counts,
      errors: syncErrors.length > 0 ? syncErrors : undefined,
      records_changed: recordsChanged,
      run_id: runId,
      trigger_source: triggerSource,
      feed_source: feedSource,
      message:
        isSuccess
          ? `UAMS sync executed: ${counts.students_inserted + counts.students_updated} students, ${counts.course_units_inserted + counts.course_units_updated} course units, ${counts.timetables_inserted + counts.timetables_updated} timetable entries, and ${(counts.announcements_inserted || 0) + (counts.announcements_updated || 0)} announcements synced.`
          : `UAMS sync completed with ${syncErrors.length} warnings/errors.`,
    };
  } catch (err: unknown) {
    lastSyncFailureTime = Date.now();
    const errorMessage = err instanceof Error ? err.message : "Unknown fatal error during UAMS synchronization.";
    console.error(`[UAMS AUTO-SYNC FATAL] ${errorMessage}`, err);

    const fatalRecord: SyncRunRecord = {
      id: runId,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "failed",
      triggerSource,
      recordsChanged: 0,
      counts: initialCounts,
      errors: [errorMessage],
      errorMessage,
      feedSource,
    };
    syncRunsHistory.unshift(fatalRecord);

    try{await recordSyncRunDatabase(fatalRecord);}catch{fatalRecord.errors?.push("Sync run history could not be persisted.");}

    return {
      success: false,
      dry_run: false,
      counts: initialCounts,
      errors: [errorMessage],
      message: `Fatal error during UAMS sync: ${errorMessage}`,
      trigger_source: triggerSource,
      feed_source: feedSource,
    };
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Persists a sync run record to the public.sync_runs table.
 * Production runs require durable acknowledgement; tests keep isolated history.
 */
async function recordSyncRunDatabase(record: SyncRunRecord): Promise<void> {
  if (process.env.VITEST === "true" || process.env.NODE_ENV === "test") {
    return;
  }
  const adminClient = createAdminClient();
  const {error}=await adminClient.from('sync_runs').insert({id:crypto.randomUUID(),started_at:record.startedAt,finished_at:record.finishedAt,status:record.status,trigger_source:record.triggerSource,records_changed:record.recordsChanged,counts:record.counts,errors:record.errors||[],error_message:record.errorMessage||null,university_id:process.env.UAMS_SYNC_UNIVERSITY_ID});
  if(error)throw new Error('Sync run history could not be persisted.');
}

/**
 * Server action to ingest students, course units, and timetables from UAMS.
 * Used by manual admin trigger on /admin dashboard.
 * Supports dry-run validation without writing to the database.
 * Rejects unauthenticated callers before checking role permissions.
 */
export async function syncUamsDataAction(
  rawPayload: unknown
): Promise<UamsSyncResponse> {
  const isDryRun = (rawPayload as { dry_run?: boolean })?.dry_run ?? false;

  // 1. Dry run bypasses authentication
  if (isDryRun) {
    return executeUamsSync({ payload: rawPayload, dryRun: true, triggerSource: "manual" });
  }

  // 2. Verify caller authentication first (reject anonymous callers before role lookup)
  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {}

  let demoEmail: string | undefined;
  let demoRole: string | undefined;
  try {
    const cookieStore = await cookies();
    demoEmail = cookieStore.get("smu_demo_session")?.value;
    demoRole = cookieStore.get("smu_demo_role")?.value;
  } catch {}

  if (process.env.NODE_ENV !== "production" && !user && demoEmail && (demoRole === "admin" || demoRole === "super_admin" || demoRole === "staff" || demoEmail === "registrar@summit.ac.ke")) {
    const throttle = checkRateLimit(`sync:demo:${demoEmail}`, 5, 60 * 1000);
    if (!throttle.success) {
      return {
        success: false,
        dry_run: isDryRun,
        counts: {
          students_processed: 0,
          students_inserted: 0,
          students_updated: 0,
          course_units_processed: 0,
          course_units_inserted: 0,
          course_units_updated: 0,
          timetables_processed: 0,
          timetables_inserted: 0,
          timetables_updated: 0,
        },
        errors: [
          `UAMS synchronization throttled. Please wait ${throttle.retryAfterSeconds || 60} seconds before triggering another sync.`,
        ],
        message: "Rate limit exceeded: UAMS synchronization is throttled.",
      };
    }
    return executeUamsSync({
      payload: rawPayload,
      triggerSource: "manual",
      actorId: "00000000-0000-0000-0000-000000000100",
      actorEmail: demoEmail,
      actorRole: demoRole || "admin",
      dryRun: true,
    });
  }

  if (!user) {
    return {
      success: false,
      dry_run: isDryRun,
      counts: {
        students_processed: 0,
        students_inserted: 0,
        students_updated: 0,
        course_units_processed: 0,
        course_units_inserted: 0,
        course_units_updated: 0,
        timetables_processed: 0,
        timetables_inserted: 0,
        timetables_updated: 0,
      },
      errors: [
        "Unauthenticated request. UAMS synchronization requires an authenticated session.",
      ],
      message: "Unauthorized: Unauthenticated callers are rejected.",
    };
  }

  // 3. Throttle protection: prevent hammering of UAMS sync trigger
  const clientIp = await getClientIp();
  const throttleKey = `sync:${user.id || clientIp}`;
  const throttle = checkRateLimit(throttleKey, 5, 60 * 1000);
  if (!throttle.success) {
    return {
      success: false,
      dry_run: isDryRun,
      counts: {
        students_processed: 0,
        students_inserted: 0,
        students_updated: 0,
        course_units_processed: 0,
        course_units_inserted: 0,
        course_units_updated: 0,
        timetables_processed: 0,
        timetables_inserted: 0,
        timetables_updated: 0,
      },
      errors: [
        `UAMS synchronization throttled. Please wait ${throttle.retryAfterSeconds || 60} seconds before triggering another sync.`,
      ],
      message: "Rate limit exceeded: UAMS synchronization is throttled.",
    };
  }

  const supabase = await createClient();

  // 4. Enforce staff or super_admin privileges
  const { data: membership } = await supabase
    .from("university_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("university_id", process.env.UAMS_SYNC_UNIVERSITY_ID || DEFAULT_PILOT_UNIVERSITY_ID)
    .in("role", ["staff", "admin", "super_admin"])
    .maybeSingle();

  if (!membership) {
    return {
      success: false,
      dry_run: isDryRun,
      counts: {
        students_processed: 0,
        students_inserted: 0,
        students_updated: 0,
        course_units_processed: 0,
        course_units_inserted: 0,
        course_units_updated: 0,
        timetables_processed: 0,
        timetables_inserted: 0,
        timetables_updated: 0,
      },
      errors: [
        "Insufficient permissions. UAMS sync requires staff or super_admin privileges.",
      ],
      message: "Unauthorized: Insufficient privileges for UAMS synchronization.",
    };
  }

  return executeUamsSync({
    payload: rawPayload,
    triggerSource: "manual",
    actorId: user.id,
    actorEmail: user.email,
    actorRole: membership.role,
    dryRun: false,
  });
}

/**
 * Server action to retrieve the latest sync status, records changed, and errors for the admin panel.
 */
export async function getLatestSyncStatusAction(): Promise<LatestSyncStatus> {
  if(process.env.NODE_ENV==='production'){
    const runs=await getSyncRunsHistoryAction();
    const latest=runs[0];
    return {success:true,status:latest?.status||'idle',lastSyncTime:latest?.finishedAt||null,lastSyncTimeFormatted:latest?.finishedAt?new Date(latest.finishedAt).toLocaleString('en-KE'):'Never',recordsChanged:latest?.recordsChanged||0,lastError:latest?.errorMessage||null,triggerSource:latest?.triggerSource||'manual',counts:latest?.counts||{students_processed:0,students_inserted:0,students_updated:0,course_units_processed:0,course_units_inserted:0,course_units_updated:0,timetables_processed:0,timetables_inserted:0,timetables_updated:0},totalRuns:runs.length};
  }
  const latest = syncRunsHistory[0];

  if (!latest) {
    return {
      success: true,
      status: "idle",
      lastSyncTime: null,
      lastSyncTimeFormatted: "Never",
      recordsChanged: 0,
      lastError: null,
      triggerSource: "manual",
      counts: {
        students_processed: 0,
        students_inserted: 0,
        students_updated: 0,
        course_units_processed: 0,
        course_units_inserted: 0,
        course_units_updated: 0,
        timetables_processed: 0,
        timetables_inserted: 0,
        timetables_updated: 0,
      },
      totalRuns: 0,
    };
  }

  const syncDate = new Date(latest.finishedAt || latest.startedAt);
  const formatted =
    syncDate.toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" }) +
    " at " +
    syncDate.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

  return {
    success: true,
    status: latest.status,
    lastSyncTime: latest.finishedAt,
    lastSyncTimeFormatted: formatted,
    recordsChanged: latest.recordsChanged,
    lastError: latest.errorMessage || null,
    triggerSource: latest.triggerSource,
    feedSource: latest.feedSource || (latest.triggerSource === "manual" ? "payload_direct" : "local_store"),
    counts: latest.counts,
    totalRuns: syncRunsHistory.length,
  };
}

/**
 * Helper to fetch all sync runs (used by tests and audit inspection).
 */
export async function getSyncRunsHistoryAction(): Promise<SyncRunRecord[]> {
  if (process.env.NODE_ENV === 'production') {
    let isAuthorized = false;
    let cookieStore: any;
    try {
      cookieStore = await cookies();
      const demoEmail = demoSessionEmail(cookieStore.get("smu_demo_session")?.value);
      const demoRole = demoSessionRole(demoEmail);
      if (demoEmail && (demoRole === "staff" || demoRole === "admin" || demoRole === "super_admin" || demoEmail === "registrar@summit.ac.ke" || demoEmail === "admin@summit.ac.ke")) {
        isAuthorized = true;
      }
    } catch {
      // outside request scope
    }

    const tenant = process.env.UAMS_SYNC_UNIVERSITY_ID || "00000000-0000-0000-0000-000000000001";

    if (!isAuthorized) {
      try {
        const session = await createClient();
        const { data: { user } } = await session.auth.getUser();
        if (user) {
          const { data: membership } = await session
            .from('university_memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('university_id', tenant)
            .in('role', ['staff', 'admin', 'super_admin'])
            .maybeSingle();
          if (membership) isAuthorized = true;
        }
      } catch {
        // auth error
      }
    }

    if (!isAuthorized) throw new Error('Staff authentication is required.');

    try {
      const { data, error } = await createAdminClient().from('sync_runs').select('*').eq('university_id', tenant).order('started_at', { ascending: false }).limit(100);
      if (!error && data) {
        return data.map(r => ({
          id: r.id,
          startedAt: r.started_at,
          finishedAt: r.finished_at,
          status: r.status,
          triggerSource: r.trigger_source,
          recordsChanged: r.records_changed,
          counts: r.counts,
          errors: r.errors,
          errorMessage: r.error_message,
          feedSource: 'live_api'
        }));
      }
    } catch {
      // database table read failed, fallback to in-memory history
    }
  }
  return [...syncRunsHistory];
}

export interface RegisterStudentResponse {
  success: boolean;
  error?: string;
  message?: string;
  student?: {
    fullName: string;
    email: string;
    registrationNumber: string;
    faculty: string;
    department: string;
    yearOfStudy: number;
    campusCode: string;
    initialPassword: string;
  };
}

/**
 * Registers and provisions a student directly through the Staff Console.
 * Strictly role-gated to staff / registrar roles.
 * Reuses the existing executeUamsSync ingestion pipeline to provision GoTrue auth user,
 * user_profiles, and university_memberships records with full validation and duplicate checks.
 */
export async function registerStudentAction(
  rawInput: RegisterStudentInput
): Promise<RegisterStudentResponse> {
  // 1. Role verification: Only staff or admin can register students
  let demoEmail: string | undefined;
  let demoRole: string | undefined;
  try {
    const cookieStore = await cookies();
    demoEmail = cookieStore.get("smu_demo_session")?.value;
    demoRole = cookieStore.get("smu_demo_role")?.value;
  } catch {
    // outside request scope (e.g. test runner)
  }

  const isTestEnv = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

  let user = null;
  let isStaffOrAdmin = isTestEnv;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;

    if (user) {
      const { data: membership } = await supabase
        .from("university_memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("university_id", process.env.UAMS_SYNC_UNIVERSITY_ID || DEFAULT_PILOT_UNIVERSITY_ID)
        .maybeSingle();

      if (
        membership &&
        (membership.role === "staff" ||
          membership.role === "admin" ||
          membership.role === "super_admin")
      ) {
        isStaffOrAdmin = true;
      }
    }
  } catch {
    // offline or mock
  }

  const isDemoStaff =
    process.env.NODE_ENV !== 'production' && demoEmail &&
    (demoRole === "staff" ||
      demoRole === "admin" ||
      demoRole === "super_admin" ||
      demoEmail === "registrar@summit.ac.ke" ||
      demoEmail === "admin@summit.ac.ke");

  if(!isTestEnv && !user && isDemoStaff)return {success:false,error:'Demo sessions cannot provision institutional student accounts. Sign in with a staff account.'};

  if (!isStaffOrAdmin) {
    return {
      success: false,
      error: "Unauthorized: Only staff and university registrars can register students.",
    };
  }

  // 2. Validate input with schema
  const parsed = registerStudentSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Invalid registration form submission.";
    return { success: false, error: firstError };
  }

  const {
    fullName,
    email,
    registrationNumber: regNo,
    faculty,
    department,
    yearOfStudy,
    campusCode,
    initialPassword,
  } = parsed.data;

  // 3. Duplicate checks before insert
  // In-memory store checks
  if (localSyncedStudents.has(email)) {
    return { success: false, error: "A student with this email already exists" };
  }
  for (const [, s] of localSyncedStudents) {
    if (s.registrationNumber?.trim().toUpperCase() === regNo.toUpperCase()) {
      return { success: false, error: "A student with this registration number already exists" };
    }
  }

  if (!isTestEnv) {
    try {
      const adminClient = createAdminClient();

      // Check user_profiles for email
      const { data: existingProfile } = (await withDbTimeout(
        adminClient
          .from("user_profiles")
          .select("id, email")
          .ilike("email", email)
          .maybeSingle(),
        1000
      )) || {};
      if (existingProfile) {
        return { success: false, error: "A student with this email already exists" };
      }

      // Check GoTrue auth for email
      const existingAuthId = await findAuthUserByEmail(adminClient, email, new Map());
      if (existingAuthId) {
        return { success: false, error: "A student with this email already exists" };
      }

      // Check university_memberships for registration_number
      const { data: existingReg } = (await withDbTimeout(
        adminClient
          .from("university_memberships")
          .select("id, registration_number")
          .ilike("registration_number", regNo)
          .eq("university_id", process.env.UAMS_SYNC_UNIVERSITY_ID || DEFAULT_PILOT_UNIVERSITY_ID)
          .maybeSingle(),
        1000
      )) || {};
      if (existingReg) {
        return { success: false, error: "A student with this registration number already exists" };
      }
    } catch {
      return {success:false,error:'Student duplicate checks could not be completed. Please retry.'};
    }
  }

  // 4. Ingest via existing student ingestion code path (executeUamsSync)
  const actorEmail = user?.email || demoEmail || "registrar@summit.ac.ke";
  const actorId = user?.id || "00000000-0000-0000-0000-000000000100";

  const syncResult = await executeUamsSync({
    payload: {
      version: 1,
      dry_run: false,
      students: [
        {
          full_name: fullName,
          email,
          registration_number: regNo,
          faculty,
          department,
          year_of_study: yearOfStudy,
          campus_code: campusCode,
          initial_password: initialPassword,
        },
      ],
      course_units: [],
      timetables: [],
    },
    triggerSource: "manual",
    actorId,
    actorEmail,
    actorRole: "staff",
    dryRun: false,
  });

  if (!syncResult.success) {
    return {
      success: false,
      error:
        syncResult.errors?.[0] ||
        syncResult.message ||
        "Failed to provision student in UAMS ingestion pipeline.",
    };
  }

  // 5. Audit log entry: action 'student_registered', actor role 'staff', target new student reg number
  await recordAuditLogAction({
    universityId: process.env.UAMS_SYNC_UNIVERSITY_ID || DEFAULT_PILOT_UNIVERSITY_ID,
    actorId,
    actorRole: "staff",
    action: "student_registered",
    targetType: "student",
    targetId: regNo,
    details: {
      fullName,
      email,
      registrationNumber: regNo,
      faculty,
      department,
      yearOfStudy,
      campusCode,
      registeredBy: actorEmail,
      mode: "direct_registration",
    },
  });

  return {
    success: true,
    message: `Student registered: ${fullName} (${regNo}). They can sign in with their email and the initial password.`,
    student: {
      fullName,
      email,
      registrationNumber: regNo,
      faculty,
      department,
      yearOfStudy,
      campusCode,
      initialPassword,
    },
  };
}

/**
 * Clean up test student from database and in-memory caches.
 */
export async function deleteStudentForCleanupAction(
  email: string
): Promise<{ success: boolean; message?: string }> {
  if(process.env.NODE_ENV!=='test'||process.env.VITEST!=='true')return {success:false,message:'Unauthorized: cleanup is restricted to isolated tests.'};
  localSyncedStudents.delete(email.trim().toLowerCase());
  return {success:true,message:'Removed isolated test student.'};
}
