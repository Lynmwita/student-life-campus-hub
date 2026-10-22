import { NextRequest, NextResponse } from "next/server";
import { executeUamsSync } from "@/lib/uams/sync-engine";

/**
 * POST /api/sync/uams
 * Automated endpoint for UAMS synchronization.
 * Guarded strictly with Bearer token authentication matching process.env.CRON_SECRET.
 * Unreachable without the correct secret token.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // 1. Secret Token Verification
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    console.error("[UAMS SYNC API] CRON_SECRET is not configured in server environment.");
    return NextResponse.json(
      {
        error: "Server configuration error: CRON_SECRET is not set.",
      },
      { status: 500 }
    );
  }

  const expectedAuthHeader = `Bearer ${cronSecret}`;
  if (!authHeader || authHeader !== expectedAuthHeader) {
    return NextResponse.json(
      {
        error: "Unauthorized: Invalid or missing authorization token. Expected Bearer <CRON_SECRET>.",
      },
      { status: 401 }
    );
  }

  // 2. Extract Optional Payload or Fallback to Registrar Feed
  let payload: unknown = undefined;
  try {
    const text = await request.text();
    if (text && text.trim().length > 0) {
      payload = JSON.parse(text);
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: "Malformed JSON payload in request body.",
      },
      { status: 400 }
    );
  }

  // 3. Execute Sync via Reusable Function
  try {
    const result = await executeUamsSync({
      payload,
      triggerSource: "cron",
      actorRole: "system_scheduler",
      actorEmail: "scheduler@summit.ac.ke",
    });

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.errors?.length ? 422 : 500,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error during UAMS sync.";
    console.error("[UAMS SYNC API FATAL]", err);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * Disallow GET and other HTTP methods on /api/sync/uams.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed. UAMS synchronization must be triggered via POST." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method Not Allowed. UAMS synchronization must be triggered via POST." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method Not Allowed. UAMS synchronization must be triggered via POST." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
