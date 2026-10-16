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

  it("rejects campus-scoped announcement if campusId is missing", () => {
    const invalid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "Campus Shuttle Maintenance Notice",
      content: "Westlands gate shuttle schedule is temporarily amended.",
      priority: "P2",
      targetScope: "campus",
      campusId: "", // missing campusId
    };
    const result = announcementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Please select a campus when scoping announcements to a specific campus"
      );
    }
  });

  it("rejects faculty-scoped announcement if targetFaculty is missing", () => {
    const invalid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "Faculty Moderation Results",
      content: "Moderation committee report has been submitted to the dean.",
      priority: "P3",
      targetScope: "faculty",
      targetFaculty: "",
    };
    const result = announcementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Please select a school or faculty when scoping to a specific faculty"
      );
    }
  });

  it("validates a department-scoped announcement", () => {
    const valid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "Software Engineering Lab Practical Session",
      content: "All Software Engineering students report to Lab 4 on Wednesday morning.",
      priority: "P2",
      targetScope: "department",
      targetDepartment: "Department of Software Engineering",
    };
    const result = announcementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects department-scoped announcement if targetDepartment is missing", () => {
    const invalid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "Department Meeting",
      content: "All department students must attend.",
      priority: "P3",
      targetScope: "department",
      targetDepartment: "",
    };
    const result = announcementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Please enter a department when scoping to a specific department"
      );
    }
  });

  it("rejects invalid date string in expiresAt", () => {
    const invalid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "Library Weekend Book Return",
      content: "Please return all reserve section textbooks by Friday afternoon.",
      priority: "P4",
      targetScope: "all",
      expiresAt: "invalid-date-string",
    };
    const result = announcementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Expiration date must be a valid ISO date string"
      );
    }
  });

  it("accepts valid date string in expiresAt and supports draft mode", () => {
    const valid = {
      universityId: "00000000-0000-0000-0000-000000000001",
      title: "Library Weekend Book Return",
      content: "Please return all reserve section textbooks by Friday afternoon.",
      priority: "P4",
      targetScope: "all",
      expiresAt: "2026-10-25T18:00:00Z",
      isPublished: false, // draft mode
    };
    const result = announcementSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });

  describe("Admin Announcements Operations", () => {
    it("exports getAdminAnnouncementsAction and fetches draft and published notices", async () => {
      const { getAdminAnnouncementsAction } = await import("@/lib/actions/announcements");
      const res = await getAdminAnnouncementsAction();
      expect(res.success).toBe(true);
      expect(Array.isArray(res.announcements)).toBe(true);
      expect(res.announcements.length).toBeGreaterThan(0);
      const hasDraft = res.announcements.some((n) => n.isPublished === false);
      const hasPublished = res.announcements.some((n) => n.isPublished === true);
      expect(hasDraft).toBe(true);
      expect(hasPublished).toBe(true);
    });

    it("toggles announcement publication state between published and draft", async () => {
      const { toggleAnnouncementPublishAction } = await import("@/lib/actions/announcements");
      const res = await toggleAnnouncementPublishAction(
        "00000000-0000-0000-0000-000000000201",
        false
      );
      expect(res.success).toBe(true);
      expect(res.message).toContain("unpublished");

      const republish = await toggleAnnouncementPublishAction(
        "00000000-0000-0000-0000-000000000201",
        true
      );
      expect(republish.success).toBe(true);
      expect(republish.message).toContain("published");
    }, 15000);

    it("updates draft announcement details and rejects empty content", async () => {
      const { updateAnnouncementDraftAction } = await import("@/lib/actions/announcements");
      const emptyForm = new FormData();
      emptyForm.set("title", "");
      emptyForm.set("content", "");
      const rejectRes = await updateAnnouncementDraftAction("test-id", emptyForm);
      expect(rejectRes.success).toBe(false);
      expect(rejectRes.message).toContain("required");

      const validForm = new FormData();
      validForm.set("title", "Updated Draft Bursary Window");
      validForm.set("content", "Updated comprehensive bursary guidelines for semester.");
      validForm.set("priority", "P2");
      validForm.set("targetScope", "All Students");
      const successRes = await updateAnnouncementDraftAction(
        "00000000-0000-0000-0000-000000000205",
        validForm
      );
      expect(successRes.success).toBe(true);
      expect(successRes.message).toContain("Draft updated successfully");
    });
  });
});
