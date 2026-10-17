import { describe, it, expect, beforeEach } from "vitest";
import { POST, GET, PUT, DELETE } from "@/app/api/sync/uams/route";
import { getLatestSyncStatusAction, getSyncRunsHistoryAction } from "@/lib/actions/sync";
import { NextRequest } from "next/server";

describe("Tiny A — Secure UAMS Sync Endpoint & Logging (/api/sync/uams)", () => {
  const TEST_SECRET = "staging-cron-secret-2026";

  beforeEach(() => {
    process.env.CRON_SECRET = TEST_SECRET;
  });

  it("rejects non-POST HTTP methods with HTTP 405 Method Not Allowed", async () => {
    const getRes = await GET();
    expect(getRes.status).toBe(405);
    const getData = await getRes.json();
    expect(getData.error).toContain("Method Not Allowed");

    const putRes = await PUT();
    expect(putRes.status).toBe(405);

    const delRes = await DELETE();
    expect(delRes.status).toBe(405);
  });

  it("rejects requests missing the Authorization header with HTTP 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/sync/uams", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("rejects requests with an invalid Bearer token with HTTP 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/sync/uams", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-token-12345",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("rejects requests with malformed JSON bodies with HTTP 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/sync/uams", {
      method: "POST",
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
      },
      body: "{ invalid_json: ",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Malformed JSON");
  });

  it("authenticates and executes auto-sync with valid Bearer token", async () => {
    const dryRunPayload = {
      version: 1,
      dry_run: true,
      students: [
        {
          email: "cron.student@summit.ac.ke",
          full_name: "Cron Test Student",
          registration_number: "CRON/2026/001",
          faculty: "School of Computing",
          department: "Computer Science",
          year_of_study: 1,
          campus_code: "SMU-MAIN",
        },
      ],
      course_units: [],
      timetables: [],
    };

    const req = new NextRequest("http://localhost:3000/api/sync/uams", {
      method: "POST",
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(dryRunPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.dry_run).toBe(true);
    expect(data.counts.students_processed).toBe(1);
    expect(data.counts.students_inserted).toBe(1);
  });

  it("records result rows (started/finished, counts, status) in sync runs history", async () => {
    const status = await getLatestSyncStatusAction();
    expect(status.success).toBe(true);
    expect(status.lastSyncTime).toBeTruthy();
    expect(status.lastSyncTimeFormatted).not.toBe("Never");
    expect(status.counts).toBeDefined();

    const runs = await getSyncRunsHistoryAction();
    expect(runs.length).toBeGreaterThan(0);
    const latestRun = runs[0];
    expect(latestRun.startedAt).toBeTruthy();
    expect(latestRun.finishedAt).toBeTruthy();
    expect(latestRun.status).toMatch(/success|failed/);
    expect(latestRun.counts).toBeDefined();
  });
});
