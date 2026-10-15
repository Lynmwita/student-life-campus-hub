"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  uamsSyncPayloadSchema,
  type UamsSyncPayload,
} from "@/lib/validations/sync";

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

    if (error || !data?.users || data.users.length === 0) {
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

export interface SyncCounts {
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
}

const DEFAULT_PILOT_UNIVERSITY_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Server action to ingest students, course units, and timetables from the University Academic Management System (UAMS).
 * Supports dry-run validation without writing to the database.
 * Rejects unauthenticated callers before checking role permissions.
 * Bridges student auth by provisioning auth.users accounts via Supabase service role.
 */
export async function syncUamsDataAction(
  rawPayload: unknown
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

  const parsed = uamsSyncPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return {
      success: false,
      dry_run: (rawPayload as { dry_run?: boolean })?.dry_run ?? false,
      counts: initialCounts,
      errors: errorMessages,
      message: "UAMS payload failed contract schema validation.",
    };
  }

  const payload: UamsSyncPayload = parsed.data;
  const isDryRun = payload.dry_run ?? false;

  // Handle dry-run mode without writes or database access
  if (isDryRun) {
    return {
      success: true,
      dry_run: true,
      counts: {
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
      message: `Dry run completed successfully. Contract valid: ${payload.students.length} students, ${payload.course_units.length} course units, and ${payload.timetables.length} timetable entries verified.`,
    };
  }

  // 1. Verify caller authentication first (reject anonymous callers before role lookup)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      dry_run: isDryRun,
      counts: initialCounts,
      errors: [
        "Unauthenticated request. UAMS synchronization requires an authenticated session.",
      ],
      message: "Unauthorized: Unauthenticated callers are rejected.",
    };
  }

  // 2. Enforce staff or super_admin privileges
  const { data: membership } = await supabase
    .from("university_memberships")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["staff", "admin", "super_admin"])
    .maybeSingle();

  if (!membership) {
    return {
      success: false,
      dry_run: isDryRun,
      counts: initialCounts,
      errors: [
        "Insufficient permissions. UAMS sync requires staff or super_admin privileges.",
      ],
      message: "Unauthorized: Insufficient privileges for UAMS synchronization.",
    };
  }

  const adminClient = createAdminClient();

  // 3. Resolve Pilot University
  const { data: univData } = await adminClient
    .from("universities")
    .select("id")
    .limit(1)
    .maybeSingle();

  const universityId = univData?.id || DEFAULT_PILOT_UNIVERSITY_ID;

  // 4. Fetch active campuses for code lookups
  const { data: campusesData } = await adminClient
    .from("campuses")
    .select("id, code")
    .eq("university_id", universityId);

  const campusMap = new Map<string, string>();
  campusesData?.forEach((c) => {
    if (c.code) campusMap.set(c.code.toUpperCase(), c.id);
  });

  const defaultCampusId =
    campusesData && campusesData.length > 0 ? campusesData[0].id : null;

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

  // 5. Upsert Course Units
  for (const cu of payload.course_units) {
    const { data: existingUnit } = await adminClient
      .from("course_units")
      .select("id")
      .eq("university_id", universityId)
      .eq("code", cu.code)
      .maybeSingle();

    const { error: cuError } = await adminClient.from("course_units").upsert(
      {
        university_id: universityId,
        code: cu.code,
        name: cu.name,
        faculty: cu.faculty,
        department: cu.department,
        year_of_study: cu.year_of_study,
        semester: cu.semester,
        credit_hours: cu.credit_hours,
      },
      { onConflict: "university_id, code" }
    );

    if (cuError) {
      syncErrors.push(`Course unit ${cu.code}: ${cuError.message}`);
    } else if (existingUnit) {
      counts.course_units_updated += 1;
    } else {
      counts.course_units_inserted += 1;
    }
  }

  // 6. Ingest Students & Bridge Auth via Service Role Provisioning
  const authUserEmailCache = new Map<string, string>();

  for (const st of payload.students) {
    const campusId =
      campusMap.get(st.campus_code?.toUpperCase() || "") || defaultCampusId;

    let studentUserId: string | null = null;

    // Check if user profile already exists by email
    const { data: existingProfile } = await adminClient
      .from("user_profiles")
      .select("id")
      .eq("email", st.email)
      .maybeSingle();

    if (existingProfile) {
      studentUserId = existingProfile.id;
    } else {
      // Provision Supabase Auth account using service role with a unique random temporary password
      const initialPassword = st.initial_password || crypto.randomUUID();
      const { data: authData, error: authError } =
        await adminClient.auth.admin.createUser({
          email: st.email,
          password: initialPassword,
          email_confirm: true,
          user_metadata: {
            full_name: st.full_name,
            registration_number: st.registration_number,
            must_reset_password: true,
          },
        });

      if (authError) {
        // If already registered in auth.users, search paginated user list for existing auth user
        const foundUserId = await findAuthUserByEmail(
          adminClient,
          st.email,
          authUserEmailCache
        );

        if (foundUserId) {
          studentUserId = foundUserId;
        } else {
          syncErrors.push(
            `Student auth creation ${st.email}: ${authError.message}`
          );
          continue;
        }
      } else if (authData?.user) {
        studentUserId = authData.user.id;
        authUserEmailCache.set(st.email.toLowerCase(), authData.user.id);
      }
    }

    if (!studentUserId) {
      syncErrors.push(
        `Student profile ${st.email}: Failed to resolve or provision auth user identity.`
      );
      continue;
    }

    // Upsert public.user_profiles using the resolved auth user UUID
    const { error: profError } = await adminClient.from("user_profiles").upsert(
      {
        id: studentUserId,
        email: st.email,
        full_name: st.full_name,
      },
      { onConflict: "id" }
    );

    if (profError) {
      syncErrors.push(`Student profile ${st.email}: ${profError.message}`);
      continue;
    }

    // Upsert membership with verified status
    const { data: existingMem } = await adminClient
      .from("university_memberships")
      .select("id")
      .eq("user_id", studentUserId)
      .eq("university_id", universityId)
      .maybeSingle();

    const { error: memError } = await adminClient
      .from("university_memberships")
      .upsert(
        {
          user_id: studentUserId,
          university_id: universityId,
          campus_id: campusId,
          role: "student",
          registration_number: st.registration_number,
          faculty: st.faculty,
          department: st.department,
          year_of_study: st.year_of_study,
          verification_status: "verified",
        },
        { onConflict: "user_id, university_id" }
      );

    if (memError) {
      syncErrors.push(`Student membership ${st.email}: ${memError.message}`);
    } else if (existingMem) {
      counts.students_updated += 1;
    } else {
      counts.students_inserted += 1;
    }
  }

  // 7. Upsert Timetables
  for (const tt of payload.timetables) {
    const campusId =
      campusMap.get(tt.campus_code?.toUpperCase() || "") || defaultCampusId;

    // Lookup course unit id
    const { data: unitRecord } = await adminClient
      .from("course_units")
      .select("id")
      .eq("university_id", universityId)
      .eq("code", tt.course_code)
      .maybeSingle();

    if (!unitRecord) {
      syncErrors.push(
        `Timetable unit ${tt.course_code}: Course unit not found in database.`
      );
      continue;
    }

    let existingQuery = adminClient
      .from("timetables")
      .select("id")
      .eq("university_id", universityId)
      .eq("course_unit_id", unitRecord.id)
      .eq("day_of_week", tt.day_of_week)
      .eq("start_time", tt.start_time)
      .eq("academic_year", tt.academic_year)
      .eq("semester", tt.semester);

    if (campusId) {
      existingQuery = existingQuery.eq("campus_id", campusId);
    } else {
      existingQuery = existingQuery.is("campus_id", null);
    }

    const { data: existingTimetable } = await existingQuery.maybeSingle();

    const { error: ttError } = await adminClient.from("timetables").upsert(
      {
        university_id: universityId,
        campus_id: campusId,
        course_unit_id: unitRecord.id,
        day_of_week: tt.day_of_week,
        start_time: tt.start_time,
        end_time: tt.end_time,
        venue: tt.venue,
        lecturer_name: tt.lecturer_name,
        semester: tt.semester,
        academic_year: tt.academic_year,
        is_active: true,
      },
      {
        onConflict:
          "university_id,course_unit_id,campus_id,day_of_week,start_time,academic_year,semester",
      }
    );

    if (ttError) {
      syncErrors.push(
        `Timetable ${tt.course_code} (Day ${tt.day_of_week}): ${ttError.message}`
      );
    } else if (existingTimetable) {
      counts.timetables_updated += 1;
    } else {
      counts.timetables_inserted += 1;
    }
  }

  return {
    success: syncErrors.length === 0,
    dry_run: false,
    counts,
    errors: syncErrors.length > 0 ? syncErrors : undefined,
    message:
      syncErrors.length === 0
        ? `UAMS sync executed: ${counts.students_inserted + counts.students_updated} students, ${counts.course_units_inserted + counts.course_units_updated} course units, and ${counts.timetables_inserted + counts.timetables_updated} timetable entries synced.`
        : `UAMS sync completed with ${syncErrors.length} warnings/errors.`,
  };
}
