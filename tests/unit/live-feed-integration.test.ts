import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/sync/uams/route";
import {
  executeUamsSync,
  getLatestSyncStatusAction,
  resetSyncLockForTesting,
  resetSyncStoreForTesting,
} from "@/lib/uams/sync-engine";
import { NextRequest } from "next/server";

describe("Phase 11 — Live Registrar Feed Connection & Dynamic Simulation (Step 11.4)", () => {
  const TEST_SECRET = "staging-cron-secret-2026";
  const LIVE_API_URL = "https://sis.summit.ac.ke/api/v1/feed";
  const LIVE_API_KEY = "live-pilot-token-xyz";
  const originalFetch = global.fetch;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await resetSyncLockForTesting();
    await resetSyncStoreForTesting();
    process.env.CRON_SECRET = TEST_SECRET;
    process.env.UAMS_API_URL = LIVE_API_URL;
    process.env.UAMS_API_KEY = LIVE_API_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.UAMS_API_URL;
    delete process.env.UAMS_API_KEY;
  });

  it("1. Synchronizes live student and academic records end-to-end from live SIS endpoint via cron trigger", async () => {
    const mockSisPayload = {
      version: 1,
      students: [
        {
          email: "chepngetich.k@summit.ac.ke",
          full_name: "Faith Chepngetich",
          registration_number: "SMU/MED/2026/042",
          faculty: "School of Medicine & Health Sciences",
          department: "Nursing",
          year_of_study: 2,
          campus_code: "SMU-MAIN",
        },
      ],
      course_units: [
        {
          code: "NURS 201",
          name: "Clinical Anatomy & Physiology",
          faculty: "School of Medicine & Health Sciences",
          department: "Nursing",
          year_of_study: 2,
          semester: 1,
          credit_hours: 4,
        },
      ],
      timetables: [
        {
          course_code: "NURS 201",
          day_of_week: 1,
          start_time: "08:00",
          end_time: "11:00",
          venue: "Anatomy Lab 2",
          lecturer_name: "Dr. Oduor",
          semester: 1,
          academic_year: "2026/2027",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSisPayload,
    } as unknown as Response);

    // Call /api/sync/uams with Bearer token and NO request body (simulates automated Vercel/GitHub cron)
    const req = new NextRequest("http://localhost:3000/api/sync/uams", {
      method: "POST",
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.feed_source).toBe("live_api");
    expect(data.counts.students_inserted).toBe(1);
    expect(data.counts.course_units_inserted).toBe(1);
    expect(data.counts.timetables_inserted).toBe(1);

    // Verify upstream authorization headers were forwarded
    expect(global.fetch).toHaveBeenCalledWith(
      LIVE_API_URL,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${LIVE_API_KEY}`,
          "X-API-Key": LIVE_API_KEY,
        }),
      })
    );

    // Verify Admin telemetry shows live feed source
    const status = await getLatestSyncStatusAction();
    expect(status.feedSource).toBe("live_api");
    expect(status.triggerSource).toBe("cron");
    expect(status.recordsChanged).toBe(3);
  });

  it("2. Automatically normalizes legacy SIS schema variations and unwraps nested envelopes", async () => {
    const rawLegacyEnvelope = {
      status: "OK",
      code: 200,
      data: {
        studentList: [
          {
            student_email: "  MWANGI.P@SUMMIT.AC.KE  ",
            name: "Peter Mwangi",
            student_id: "smu/agr/2026/015",
            school: "School of Agriculture & Environmental Sciences",
            programme: "Agribusiness",
            academic_year_level: "Year 3",
          },
        ],
        units: [
          {
            unit_code: "agr 301",
            title: "Agricultural Economics & Marketing",
            faculty: "School of Agriculture",
            department: "Agribusiness",
            year: "3",
            term: "SEM_1",
            credits: "3",
          },
        ],
        timetable: [
          {
            courseCode: "agr 301",
            day: "Wednesday",
            from: "2:00 PM",
            to: "4:00 PM",
            room: "Greenhouse Hall",
            instructor: "Dr. Mutua",
            sem: "Semester 1",
            session: "2026/2027",
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => rawLegacyEnvelope,
    } as unknown as Response);

    const result = await executeUamsSync({ triggerSource: "cron" });
    expect(result.success).toBe(true);
    expect(result.feed_source).toBe("live_api");
    expect(result.counts.students_inserted).toBe(1);
    expect(result.counts.course_units_inserted).toBe(1);
    expect(result.counts.timetables_inserted).toBe(1);

    const status = await getLatestSyncStatusAction();
    expect(status.feedSource).toBe("live_api");
  });

  it("3. Reports upstream HTTP errors without importing fallback fixtures", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Oracle SIS backend pool exhausted",
    } as unknown as Response);

    const result = await executeUamsSync({ triggerSource: "cron" });
    expect(result.success).toBe(false);
    expect(result.feed_source).toBe("live_api");
    expect(result.counts.students_inserted).toBe(0);
    expect(result.counts.course_units_inserted).toBe(0);
    expect(result.counts.timetables_inserted).toBe(0);

    const status = await getLatestSyncStatusAction();
    expect(status.feedSource).toBe("live_api");
    expect(status.status).toBe("failed");
  });

  it("4. Reports upstream timeouts without importing fallback fixtures", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted due to timeout");
      err.name = "AbortError";
      return Promise.reject(err);
    });

    const result = await executeUamsSync({ triggerSource: "cron" });
    expect(result.success).toBe(false);
    expect(result.feed_source).toBe("live_api");
    expect(result.counts.students_inserted).toBe(0);

    const status = await getLatestSyncStatusAction();
    expect(status.feedSource).toBe("live_api");
  });

  it("5. Guarantees zero duplicate insertions across consecutive live API sync runs (Idempotency Proof)", async () => {
    const liveRecord = {
      version: 1,
      students: [
        {
          email: "idempotent.student@summit.ac.ke",
          full_name: "Grace Idempotent",
          registration_number: "SMU/IDEM/2026/01",
          faculty: "School of Computing",
          department: "Computer Science",
          year_of_study: 1,
          campus_code: "SMU-MAIN",
        },
      ],
      course_units: [
        {
          code: "IDEM 101",
          name: "Idempotency Principles",
          faculty: "School of Computing",
          department: "Computer Science",
          year_of_study: 1,
          semester: 1,
          credit_hours: 3,
        },
      ],
      timetables: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => liveRecord,
    } as unknown as Response);

    // Run 1: Inserts new student and course
    const run1 = await executeUamsSync({ triggerSource: "cron" });
    expect(run1.success).toBe(true);
    expect(run1.counts.students_inserted).toBe(1);
    expect(run1.counts.students_updated).toBe(0);
    expect(run1.counts.course_units_inserted).toBe(1);

    // Run 2: Exact same feed data from upstream SIS
    const run2 = await executeUamsSync({ triggerSource: "cron" });
    expect(run2.success).toBe(true);
    expect(run2.counts.students_inserted).toBe(0);
    expect(run2.counts.students_updated).toBe(0);
    expect(run2.counts.course_units_inserted).toBe(0);
    expect(run2.counts.course_units_updated).toBe(0);
    expect(run2.records_changed).toBe(0);
  });

  it("6. Dynamic Freshness: Propagates student department change from live upstream SIS without manual DB intervention", async () => {
    // Initial feed
    const initialFeed = {
      version: 1,
      students: [
        {
          email: "dynamic.student@summit.ac.ke",
          full_name: "Victor Kiprono",
          registration_number: "SMU/ENG/2026/088",
          faculty: "School of Engineering",
          department: "Civil Engineering",
          year_of_study: 1,
          campus_code: "SMU-MAIN",
        },
      ],
      course_units: [],
      timetables: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => initialFeed,
    } as unknown as Response);

    const initialRun = await executeUamsSync({ triggerSource: "cron" });
    expect(initialRun.counts.students_inserted).toBe(1);

    // Upstream Registrar changes department to Electrical Engineering
    const updatedFeed = {
      version: 1,
      students: [
        {
          email: "dynamic.student@summit.ac.ke",
          full_name: "Victor Kiprono",
          registration_number: "SMU/ENG/2026/088",
          faculty: "School of Engineering",
          department: "Electrical Engineering", // modified
          year_of_study: 1,
          campus_code: "SMU-MAIN",
        },
      ],
      course_units: [],
      timetables: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updatedFeed,
    } as unknown as Response);

    const updateRun = await executeUamsSync({ triggerSource: "cron" });
    expect(updateRun.success).toBe(true);
    expect(updateRun.counts.students_inserted).toBe(0);
    expect(updateRun.counts.students_updated).toBe(1);
    expect(updateRun.records_changed).toBe(1);
  });
});
