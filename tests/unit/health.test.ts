import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Health Check API Route", () => {
  it("returns HTTP 200 with healthy or degraded operational status", async () => {
    const response = await GET();
    expect([200, 503]).toContain(response.status);

    const data = await response.json();
    expect(data.service).toBe("student-life-campus-hub");
    expect(data.institution).toBe("Summit Metropolitan University");
    expect(data.timestamp).toBeTruthy();
    expect(data.checks).toBeDefined();
    expect(data.checks.api).toBe("healthy");
    expect(typeof data.uptimeSeconds).toBe("number");
  });
});
