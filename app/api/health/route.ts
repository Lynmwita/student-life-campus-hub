import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function GET() {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`api:health:${ip}`, 60, 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Health endpoint is rate-limited." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds || 60),
        },
      }
    );
  }

  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatencyMs = 0;

  try {
    const dbPromise = (async () => {
      const supabase = await createClient();
      const dbStart = Date.now();
      const res = await supabase.from("universities").select("id").limit(1);
      return { latency: Date.now() - dbStart, error: res.error };
    })();

    const timeoutPromise = new Promise<{ latency: number; error: unknown }>((_, reject) =>
      setTimeout(() => reject(new Error("DB check timed out")), 1000)
    );

    const result = await Promise.race([dbPromise, timeoutPromise]);
    dbLatencyMs = result.latency;
    dbStatus = result.error ? "degraded" : "healthy";
  } catch {
    dbStatus = "unavailable";
  }

  const responsePayload = {
    status: dbStatus === "unavailable" ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    service: "student-life-campus-hub",
    institution: "Summit Metropolitan University",
    environment: process.env.NODE_ENV || "development",
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      api: "healthy",
      database: dbStatus,
      databaseLatencyMs: dbLatencyMs,
    },
    totalLatencyMs: Date.now() - startTime,
  };

  return NextResponse.json(responsePayload, {
    status: dbStatus === "unavailable" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
