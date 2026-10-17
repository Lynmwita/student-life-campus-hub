import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchRegistrarFeed } from "@/lib/uams/client";
import { getUamsRegistrarData } from "@/lib/uams/registrar-store";

describe("Phase 11 — Live Registrar Client & Adapter", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns local_store data immediately when no UAMS_API_URL is configured", async () => {
    const result = await fetchRegistrarFeed({ apiUrl: undefined });
    expect(result.source).toBe("local_store");
    expect(result.data.students.length).toBeGreaterThan(0);
    expect(result.data.course_units.length).toBeGreaterThan(0);
    expect(result.data.timetables.length).toBeGreaterThan(0);
    expect(result.error).toBeUndefined();
  });

  it("fetches and parses live UAMS payload when live endpoint returns valid contract", async () => {
    const mockPayload = {
      version: 1,
      students: [
        {
          email: "live.student@summit.ac.ke",
          full_name: "Live Student",
          registration_number: "SMU/LIV/2026/01",
          faculty: "School of Computing & Informatics",
          department: "Computer Science",
          year_of_study: 1,
          campus_code: "SMU-MAIN",
        },
      ],
      course_units: [
        {
          code: "COMP 101",
          name: "Introduction to Computer Systems",
          faculty: "School of Computing & Informatics",
          department: "Computer Science",
          year_of_study: 1,
          semester: 1,
          credit_hours: 3,
        },
      ],
      timetables: [
        {
          course_code: "COMP 101",
          day_of_week: 1,
          start_time: "09:00",
          end_time: "12:00",
          venue: "Lab A",
          lecturer_name: "Dr. Kamau",
          semester: 1,
          academic_year: "2026/2027",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as unknown as Response);

    const result = await fetchRegistrarFeed({
      apiUrl: "https://sis.summit.ac.ke/api/v1/feed",
      apiKey: "secret-sis-api-token",
    });

    expect(result.source).toBe("live_api");
    expect(result.data.students[0].email).toBe("live.student@summit.ac.ke");
    expect(result.data.course_units[0].code).toBe("COMP 101");
    expect(result.error).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://sis.summit.ac.ke/api/v1/feed",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-sis-api-token",
          "X-API-Key": "secret-sis-api-token",
        }),
      })
    );
  });

  it("automatically adapts upstream payload when formatted with nested envelopes and legacy field keys", async () => {
    const rawSisResponse = {
      status: "success",
      data: {
        studentList: [
          {
            student_email: "  SAMUEL.K@SUMMIT.AC.KE  ",
            name: "Samuel Kariuki",
            student_id: "smu/bit/2026/012",
            school: "School of Computing & Informatics",
            programme: "Information Technology",
            academic_year_level: "Year 3",
          },
        ],
        units: [
          {
            unit_code: "bit 301",
            title: "Network Security & Cryptography",
            faculty: "School of Computing & Informatics",
            department: "Information Technology",
            year: "3",
            term: "SEM_1",
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => rawSisResponse,
    } as unknown as Response);

    const result = await fetchRegistrarFeed({
      apiUrl: "https://sis.summit.ac.ke/api/v1/feed",
    });

    expect(result.source).toBe("live_api");
    expect(result.data.students[0].email).toBe("samuel.k@summit.ac.ke");
    expect(result.data.students[0].registration_number).toBe("SMU/BIT/2026/012");
    expect(result.data.course_units[0].code).toBe("BIT 301");
    expect(result.data.course_units[0].semester).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it("gracefully falls back to local_store when live endpoint returns HTTP 500 error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Upstream database connection failure",
    } as unknown as Response);

    const result = await fetchRegistrarFeed({
      apiUrl: "https://sis.summit.ac.ke/api/v1/feed",
    });

    expect(result.source).toBe("local_store");
    expect(result.data).toBeDefined();
    expect(result.error).toContain("HTTP 500");
  });

  it("gracefully falls back to local_store when live endpoint returns invalid schema", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        version: "invalid-version-string", // schema expects number
        students: "not-an-array",
      }),
    } as unknown as Response);

    const result = await fetchRegistrarFeed({
      apiUrl: "https://sis.summit.ac.ke/api/v1/feed",
    });

    expect(result.source).toBe("local_store");
    expect(result.error).toContain("failed contract validation");
  });

  it("handles request abort / timeout by falling back to local_store", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    });

    const result = await fetchRegistrarFeed({
      apiUrl: "https://sis.summit.ac.ke/api/v1/feed",
      timeoutMs: 100,
    });

    expect(result.source).toBe("local_store");
    expect(result.error).toContain("timed out");
  });
});
