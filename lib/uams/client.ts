import { uamsSyncPayloadSchema, type UamsSyncPayload } from "@/lib/validations/sync";
import { getUamsRegistrarData } from "./registrar-store";
import { normalizeRegistrarPayload } from "./adapter";

export interface RegistrarFeedResult {
  source: "live_api" | "local_store";
  data: UamsSyncPayload;
  apiUrl?: string;
  latencyMs: number;
  error?: string;
}

export interface RegistrarClientOptions {
  apiUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

/**
 * Fetches student, course unit, and timetable data from the university SIS / UAMS feed.
 * Connects over TLS to live university endpoints when configured, with strict timeout
 * handling and automatic graceful fallback to the verified local store if offline.
 */
export async function fetchRegistrarFeed(
  options: RegistrarClientOptions = {}
): Promise<RegistrarFeedResult> {
  const startTime = Date.now();
  const apiUrl = options.apiUrl || process.env.UAMS_API_URL;
  const apiKey = options.apiKey || process.env.UAMS_API_KEY;
  const timeoutMs = options.timeoutMs || parseInt(process.env.UAMS_API_TIMEOUT_MS || "5000", 10);

  // If no external URL is configured, immediately return the local registrar store
  if (!apiUrl) {
    return {
      source: "local_store",
      data: await getUamsRegistrarData(),
      latencyMs: Date.now() - startTime,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "SMU-Campus-Hub-Sync-Engine/1.0",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      const errorMsg = `Upstream UAMS returned HTTP ${response.status}: ${errText.slice(0, 200) || response.statusText}`;
      console.warn(`[UAMS CLIENT] ${errorMsg}. Falling back to local registrar store.`);
      return {
        source: "local_store",
        data: await getUamsRegistrarData(),
        apiUrl,
        latencyMs: Date.now() - startTime,
        error: errorMsg,
      };
    }

    const json = await response.json();
    let parsed = uamsSyncPayloadSchema.safeParse(json);

    // If direct parse fails, attempt normalization through the SIS adapter
    if (!parsed.success) {
      if (!json || typeof json !== "object" || typeof (json as any).students === "string") {
        const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        const errorMsg = `Upstream UAMS payload failed contract validation: ${issues}`;
        console.warn(`[UAMS CLIENT] ${errorMsg}. Falling back to local registrar store.`);
        return {
          source: "local_store",
          data: await getUamsRegistrarData(),
          apiUrl,
          latencyMs: Date.now() - startTime,
          error: errorMsg,
        };
      }

      const normalized = normalizeRegistrarPayload(json);
      parsed = uamsSyncPayloadSchema.safeParse(normalized);
    }

    if (!parsed.success || (parsed.data.students.length === 0 && parsed.data.course_units.length === 0)) {
      const issues = parsed.success
        ? "Normalized payload contains 0 student and course records"
        : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      const errorMsg = `Upstream UAMS payload failed contract validation: ${issues}`;
      console.warn(`[UAMS CLIENT] ${errorMsg}. Falling back to local registrar store.`);
      return {
        source: "local_store",
        data: await getUamsRegistrarData(),
        apiUrl,
        latencyMs: Date.now() - startTime,
        error: errorMsg,
      };
    }

    return {
      source: "live_api",
      data: parsed.data,
      apiUrl,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && (err.name === "AbortError" || err.message.includes("abort"));
    const errorMsg = isTimeout
      ? `Upstream UAMS request timed out after ${timeoutMs}ms`
      : `Network error connecting to upstream UAMS: ${err instanceof Error ? err.message : String(err)}`;

    console.warn(`[UAMS CLIENT] ${errorMsg}. Gracefully falling back to local registrar store.`);

    return {
      source: "local_store",
      data: await getUamsRegistrarData(),
      apiUrl,
      latencyMs: Date.now() - startTime,
      error: errorMsg,
    };
  }
}
