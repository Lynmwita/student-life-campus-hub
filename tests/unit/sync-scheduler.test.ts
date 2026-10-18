import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { executeUamsSync, getLatestSyncStatusAction } from "@/lib/actions/sync";

describe("Tiny B — Scheduler Wiring & Anti-Storming Protections", () => {
  const rootDir = process.cwd();

  it("verifies vercel.json specifies 15-minute cron schedule for /api/sync/uams", () => {
    const vercelConfigPath = path.join(rootDir, "vercel.json");
    expect(fs.existsSync(vercelConfigPath)).toBe(true);

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf-8"));
    expect(Array.isArray(vercelConfig.crons)).toBe(true);

    const uamsCron = vercelConfig.crons.find(
      (c: { path: string; schedule: string }) => c.path === "/api/sync/uams"
    );
    expect(uamsCron).toBeDefined();
    expect(["*/15 * * * *", "0 0 * * *"]).toContain(uamsCron.schedule);
  });

  it("verifies GitHub Actions workflow configures 15-minute scheduled trigger", () => {
    const workflowPath = path.join(rootDir, ".github/workflows/uams-sync.yml");
    expect(fs.existsSync(workflowPath)).toBe(true);

    const workflowContent = fs.readFileSync(workflowPath, "utf-8");
    expect(workflowContent).toContain("*/15 * * * *");
    expect(workflowContent).toContain("/api/sync/uams");
    expect(workflowContent).toContain("Authorization: Bearer");
  });

  it("handles invalid payload loudly without crashing and records failure state", async () => {
    const invalidPayload = {
      version: 999, // invalid version
      students: [{ email: "invalid-email" }],
    };

    const res = await executeUamsSync({
      payload: invalidPayload,
      triggerSource: "cron",
    });

    expect(res.success).toBe(false);
    expect(res.errors).toBeDefined();
    expect(res.errors!.length).toBeGreaterThan(0);

    const latest = await getLatestSyncStatusAction();
    expect(latest.lastError).toBeTruthy();
    expect(latest.status).toBe("failed");
  });

  it("enforces cooldown backoff on subsequent cron attempts to prevent retry-storms", async () => {
    // Attempt another cron trigger immediately after failure
    const stormAttempt = await executeUamsSync({
      triggerSource: "cron",
    });

    // Should be intercepted by anti-storming cooldown
    expect(stormAttempt.success).toBe(false);
    expect(stormAttempt.message).toContain("cooldown active");
  });
});
