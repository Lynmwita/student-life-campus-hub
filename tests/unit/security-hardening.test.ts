import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { SECURITY_HEADERS, applySecurityHeaders } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import { syncUamsDataAction } from "@/lib/actions/sync";

describe("Security Hardening & Rate Limiting (Tiny 9b)", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe("In-Memory Sliding Window Rate Limiter", () => {
    it("allows requests under the specified threshold", () => {
      const res1 = checkRateLimit("test-key-1", 3, 60000);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit("test-key-1", 3, 60000);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit("test-key-1", 3, 60000);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it("rejects requests exceeding the maximum limit and provides retryAfterSeconds", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-limit-key", 5, 60000);
      }

      const blockedRes = checkRateLimit("test-limit-key", 5, 60000);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
      expect(blockedRes.retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it("resets rate limit for key when explicitly requested", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-reset-key", 5, 60000);
      }
      expect(checkRateLimit("test-reset-key", 5, 60000).success).toBe(false);

      resetRateLimit("test-reset-key");
      const postReset = checkRateLimit("test-reset-key", 5, 60000);
      expect(postReset.success).toBe(true);
      expect(postReset.remaining).toBe(4);
    });

    it("extracts client IP address correctly from headers", () => {
      const h1 = new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18" });
      expect(getClientIpFromHeaders(h1)).toBe("203.0.113.195");

      const h2 = new Headers({ "x-real-ip": "198.51.100.42" });
      expect(getClientIpFromHeaders(h2)).toBe("198.51.100.42");

      const h3 = new Headers({ "cf-connecting-ip": "192.0.2.1" });
      expect(getClientIpFromHeaders(h3)).toBe("192.0.2.1");

      const hEmpty = new Headers();
      expect(getClientIpFromHeaders(hEmpty)).toBe("127.0.0.1");
    });
  });

  describe("HTTP Security Headers Enforcement", () => {
    it("defines mandatory Content-Security-Policy header", () => {
      expect(SECURITY_HEADERS["Content-Security-Policy"]).toBeDefined();
      expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain("default-src 'self'");
      expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain("media-src 'self' data: blob:");
      expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    });

    it("defines Strict-Transport-Security with max-age and preload", () => {
      expect(SECURITY_HEADERS["Strict-Transport-Security"]).toBe(
        "max-age=63072000; includeSubDomains; preload"
      );
    });

    it("enforces X-Frame-Options DENY to prevent clickjacking", () => {
      expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    });

    it("enforces X-Content-Type-Options nosniff to prevent MIME sniffing", () => {
      expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    });

    it("enforces strict Referrer-Policy", () => {
      expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    });

    it("applies all security headers onto NextResponse instances", () => {
      const res = NextResponse.next();
      const securedRes = applySecurityHeaders(res);

      expect(securedRes.headers.get("Content-Security-Policy")).toBeTruthy();
      expect(securedRes.headers.get("Strict-Transport-Security")).toBe(
        "max-age=63072000; includeSubDomains; preload"
      );
      expect(securedRes.headers.get("X-Frame-Options")).toBe("DENY");
      expect(securedRes.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(securedRes.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(securedRes.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
    });
  });

  describe("UAMS Sync Trigger Throttling & Protection", () => {
    it("rejects unauthenticated sync attempts immediately before processing", async () => {
      const result = await syncUamsDataAction({
        version: 1,
        dry_run: false,
        students: [],
        course_units: [],
        timetables: [],
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("Unauthenticated request");
    });

    it("enforces rate-limit throttling when sync is repeatedly triggered", () => {
      const testSyncKey = "sync:test-actor-1";
      for (let i = 0; i < 5; i++) {
        const allowed = checkRateLimit(testSyncKey, 5, 60000);
        expect(allowed.success).toBe(true);
      }

      // 6th attempt within window must be throttled
      const throttled = checkRateLimit(testSyncKey, 5, 60000);
      expect(throttled.success).toBe(false);
      expect(throttled.remaining).toBe(0);
      expect(throttled.retryAfterSeconds).toBeGreaterThan(0);
    });
  });
});
