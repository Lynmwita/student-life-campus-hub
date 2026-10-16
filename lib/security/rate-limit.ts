import { headers } from "next/headers";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (typeof interval === "object" && "unref" in interval && typeof interval.unref === "function") {
    interval.unref();
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
}

/**
 * Checks and increments rate limit for a given key.
 * @param key Unique key for the rate limit (e.g., `login:192.168.1.1` or `sync:user-id`)
 * @param limit Maximum allowed attempts within window
 * @param windowMs Duration of sliding window in milliseconds (default: 60,000ms / 1 min)
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: newRecord.resetTime,
    };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((record.resetTime - now) / 1000)
    );
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Resets the rate limit for a specific key (e.g. upon successful authentication).
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clears the entire rate limit store. Useful for testing environments.
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Extracts client IP address safely from a Headers instance.
 */
export function getClientIpFromHeaders(headersList: Headers): string {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = headersList.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}

/**
 * Resolves client IP in Server Actions using next/headers.
 */
export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    return getClientIpFromHeaders(headersList);
  } catch {
    return "127.0.0.1";
  }
}
