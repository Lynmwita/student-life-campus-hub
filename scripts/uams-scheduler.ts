/**
 * Standalone background worker to execute UAMS auto-sync on a 15-minute interval.
 * Used for containerized (Docker) deployments or long-running Node.js worker instances.
 * Prevents retry-storms and logs failures loudly.
 */

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "staging-cron-secret-2026";

async function triggerSync(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SCHEDULER] Triggering scheduled UAMS synchronization...`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const res = await fetch(`${APP_URL}/api/sync/uams`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const body = await res.json();

    if (!res.ok || !body.success) {
      console.error(
        `[${timestamp}] [SCHEDULER ERROR] UAMS sync returned status ${res.status}:`,
        body.errors || body.message || body
      );
      return;
    }

    console.log(
      `[${timestamp}] [SCHEDULER SUCCESS] UAMS sync completed. Records changed: ${body.records_changed ?? 0}.`,
      body.counts
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${timestamp}] [SCHEDULER NETWORK ERROR] Failed to connect to /api/sync/uams:`, message);
  }
}

// Immediate initial run
triggerSync();

// Schedule recurring 15-minute runs
setInterval(triggerSync, SYNC_INTERVAL_MS);

console.log(`[SCHEDULER] UAMS auto-sync daemon started (cadence: 15 minutes, target: ${APP_URL}/api/sync/uams).`);
