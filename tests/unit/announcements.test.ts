import { describe, it, expect } from "vitest";
import { announcementSchema } from "@/lib/validations/announcements";

describe("Announcement Schemas & Audience Scoping", () => {
  it("validates an urgent P1 campus-wide broadcast", () => {
    const valid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      campusId: "00000000-0000-0000-0000-000000000011",
      title: "Urgent Campus Advisory: Power Maintenance",
      content: "Main campus will experience scheduled power interruptions between 10 AM and 2 PM.",
      priority: "P1",
      targetScope: "campus",
    };
    const result = announcementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("validates a faculty-scoped academic announcement", () => {
    const valid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "Final Year Project Defense Schedules",
      content: "Project presentations will commence next Monday in ICT Lab 2. Bring printed reports.",
      priority: "P2",
      targetScope: "faculty",
      targetFaculty: "School of Computing & Informatics",
      targetYear: 4,
    };
    const result = announcementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid priority codes", () => {
    const invalid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "General Campus Announcement",
      content: "Detailed content goes here for general notices.",
      priority: "URGENT_NOW", // invalid priority
      targetScope: "all",
    };
    const result = announcementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects announcements with too short title or content", () => {
    const invalid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "Hi",
      content: "Short",
      priority: "P4",
      targetScope: "all",
    };
    const result = announcementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
