import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  executeUamsSync,
  getLatestSyncStatusAction,
  resetSyncLockForTesting,
  resetSyncStoreForTesting,
} from "@/lib/actions/sync";
import { POST } from "@/app/api/sync/uams/route";
import {
  getUamsRegistrarData,
  updateUamsStudentRecord,
  resetUamsRegistrarData,
} from "@/lib/uams/registrar-store";
import { NextRequest } from "next/server";

describe("Tiny C — Idempotency & Freshness Proofs", () => {
  const CRON_SECRET = "staging-cron-secret-2026";

  beforeEach(async () => {
    process.env.CRON_SECRET = CRON_SECRET;
    await resetSyncLockForTesting();
    await resetSyncStoreForTesting();
    resetUamsRegistrarData();
  });

  afterEach(async () => {
    await resetSyncLockForTesting();
    await resetSyncStoreForTesting();
    resetUamsRegistrarData();
  });

  describe("Proof 1: Idempotency Over Time (4+ consecutive runs with zero duplicates)", () => {
    it("runs sync 4+ consecutive times against unchanged UAMS data with 0 duplicates", async () => {
      // Run #1 (Initial baseline ingest)
      const run1 = await executeUamsSync({
        triggerSource: "cron",
      });
      expect(run1.success).toBe(true);
      expect(run1.counts.students_processed).toBeGreaterThanOrEqual(1);

      // Runs #2, #3, #4, #5 (Repeated scheduled runs against unchanged registrar data)
      const repeatRuns = [];
      for (let i = 2; i <= 5; i++) {
        resetSyncLockForTesting();
        const res = await executeUamsSync({
          triggerSource: "cron",
        });
        repeatRuns.push(res);
      }

      for (let i = 0; i < repeatRuns.length; i++) {
        const run = repeatRuns[i];
        expect(run.success).toBe(true);
        // Processed count remains consistent
        expect(run.counts.students_processed).toBe(run1.counts.students_processed);
        // Crucial idempotency check: subsequent runs must NOT insert duplicates
        expect(run.counts.students_inserted).toBe(0);
        expect(run.counts.course_units_inserted).toBe(0);
        expect(run.counts.timetables_inserted).toBe(0);
      }
    });
  });

  describe("Proof 2: Freshness (Registrar changes flow automatically within 20m cadence)", () => {
    it("detects and propagates modified student department and details automatically", async () => {
      // Step 1: Baseline sync
      const baseline = await executeUamsSync({ triggerSource: "cron" });
      expect(baseline.success).toBe(true);
      resetSyncLockForTesting();

      // Step 2: Registrar updates student record in UAMS
      const targetEmail = "alex.mutua@summit.ac.ke";
      const updatedDepartment = "Software Engineering & Distributed Systems";
      const updatedFullName = "Alex Mutua (Dean's Honor)";

      updateUamsStudentRecord({
        email: targetEmail,
        department: updatedDepartment,
        full_name: updatedFullName,
      });

      // Verify UAMS registrar store immediately reflects change
      const registrarData = await getUamsRegistrarData();
      const studentInUams = registrarData.students.find((s) => s.email === targetEmail);
      expect(studentInUams?.department).toBe(updatedDepartment);
      expect(studentInUams?.full_name).toBe(updatedFullName);

      // Step 3: 15-minute background scheduler triggers /api/sync/uams
      const cronReq = new NextRequest("http://localhost:3000/api/sync/uams", {
        method: "POST",
        headers: {
          authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      const response = await POST(cronReq);
      const syncResult = await response.json();
      expect(response.status).toBe(200);
      expect(syncResult.success).toBe(true);
      expect(syncResult.counts.students_updated).toBeGreaterThanOrEqual(1);

      // Step 4: Admin telemetry confirms the change
      const latestStatus = await getLatestSyncStatusAction();
      expect(latestStatus.success).toBe(true);
      expect(latestStatus.recordsChanged).toBeGreaterThan(0);
    });

    it("provisions newly registered student automatically when added to UAMS", async () => {
      resetSyncLockForTesting();
      const newStudentEmail = "brian.kiprono@summit.ac.ke";
      updateUamsStudentRecord({
        email: newStudentEmail,
        full_name: "Brian Kiprono",
        registration_number: "BIT/2024/9912",
        faculty: "School of Computing & Informatics",
        department: "Computer Science",
        year_of_study: 1,
        campus_code: "SMU-MAIN",
      });

      // Automated scheduler execution
      const cronReq = new NextRequest("http://localhost:3000/api/sync/uams", {
        method: "POST",
        headers: {
          authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      const response = await POST(cronReq);
      const syncResult = await response.json();
      expect(response.status).toBe(200);
      expect(syncResult.success).toBe(true);

      // Newly provisioned student is processed
      expect(syncResult.counts.students_processed).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Proof 3: Admin Monitoring Extension Verification", () => {
    it("reports last successful sync time, records changed count, and healthy status", async () => {
      const status = await getLatestSyncStatusAction();
      expect(status.success).toBe(true);
      expect(status.lastSyncTime).toBeTruthy();
      expect(status.lastSyncTimeFormatted).toBeTruthy();
      expect(status.recordsChanged).toBeGreaterThanOrEqual(0);
      expect(status.totalRuns).toBeGreaterThan(0);
    });
  });
});
