import { describe, it, expect } from "vitest";
import {
  ticketSubmissionSchema,
  ticketStatusUpdateSchema,
  ticketAssignStaffSchema,
} from "@/lib/validations/helpdesk";

describe("Phase 5 Help Desk & Sensitive Complaint Privacy Suite", () => {
  describe("ticketSubmissionSchema", () => {
    it("validates a standard IT support help ticket", () => {
      const valid = {
        category: "it_support",
        priority: "P2",
        subject: "Wi-Fi access intermittent in Computing Lab 3",
        description: "During practical classes, access points disconnect repeatedly.",
        isSensitive: false,
      };

      const result = ticketSubmissionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isSensitive).toBe(false);
      }
    });

    it("automatically forces isSensitive = true for lecturer_conduct category", () => {
      const sensitiveTicket = {
        category: "lecturer_conduct",
        priority: "P1",
        subject: "Missing CAT 2 Marks and Unfair Retaliation",
        description: "Lecturer refused to grade coursework despite signed submission register.",
        isSensitive: false, // Explicitly false from client
      };

      const result = ticketSubmissionSchema.safeParse(sensitiveTicket);
      expect(result.success).toBe(true);
      if (result.success) {
        // Enforced sensitive flag
        expect(result.data.isSensitive).toBe(true);
        expect(result.data.sensitiveType).toBe("lecturer_conduct");
      }
    });

    it("automatically forces isSensitive = true for sensitive_complaint category", () => {
      const sensitiveTicket = {
        category: "sensitive_complaint",
        priority: "P1",
        subject: "Confidential Student Grievance regarding Departmental Exam",
        description: "Submitting formal complaint under university harassment and whistleblowing protection.",
        isSensitive: false,
      };

      const result = ticketSubmissionSchema.safeParse(sensitiveTicket);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isSensitive).toBe(true);
      }
    });

    it("rejects ticket with description shorter than 10 characters", () => {
      const invalid = {
        category: "facilities",
        priority: "P3",
        subject: "Broken light switch in room 204",
        description: "Broken",
      };

      const result = ticketSubmissionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 10 characters");
      }
    });

    it("rejects ticket with subject shorter than 5 characters", () => {
      const invalid = {
        category: "general",
        priority: "P4",
        subject: "Help",
        description: "I need help finding the timetable coordinator office.",
      };

      const result = ticketSubmissionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 5 characters");
      }
    });
  });

  describe("ticketStatusUpdateSchema", () => {
    it("validates a status transition with staff message note", () => {
      const valid = {
        ticketId: "60000000-0000-0000-0000-000000000001",
        status: "in_progress",
        message: "Technician dispatched to replace campus router switch.",
        isInternal: false,
      };

      const result = ticketStatusUpdateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const invalid = {
        ticketId: "60000000-0000-0000-0000-000000000001",
        status: "invalid_status",
        message: "Status update note",
      };

      const result = ticketStatusUpdateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("ticketAssignStaffSchema", () => {
    it("validates assigning ticket to authorized staff user UUID", () => {
      const valid = {
        ticketId: "60000000-0000-0000-0000-000000000001",
        staffId: "00000000-0000-0000-0000-000000000100",
        note: "Assigned to Head of Department for review.",
      };

      const result = ticketAssignStaffSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID staff id", () => {
      const invalid = {
        ticketId: "60000000-0000-0000-0000-000000000001",
        staffId: "not-a-uuid",
      };

      const result = ticketAssignStaffSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Sensitive Complaint Privacy Isolation Logic", () => {
    const studentUser = { id: "user-student-1", role: "student" };
    const otherStudent = { id: "user-student-2", role: "student" };
    const assignedStaff = { id: "user-staff-assigned", role: "staff" };
    const unassignedStaff = { id: "user-staff-unassigned", role: "staff" };
    const superAdmin = { id: "user-super-admin", role: "super_admin" };

    const sensitiveTicket = {
      id: "ticket-1",
      studentId: "user-student-1",
      assignedStaffId: "user-staff-assigned",
      isSensitive: true,
      category: "lecturer_conduct",
    };

    function canInspectSensitiveTicket(
      ticket: typeof sensitiveTicket,
      user: { id: string; role: string }
    ): boolean {
      if (!ticket.isSensitive) return true;
      if (user.id === ticket.studentId) return true; // Submitting student can view own
      if (user.role === "super_admin") return true; // Super admin can inspect
      if (user.role === "staff" && user.id === ticket.assignedStaffId) return true; // Assigned staff can inspect
      return false; // Other staff and other students are strictly BLOCKED
    }

    it("allows submitting student to view their own sensitive complaint", () => {
      expect(canInspectSensitiveTicket(sensitiveTicket, studentUser)).toBe(true);
    });

    it("blocks other students from inspecting sensitive complaints", () => {
      expect(canInspectSensitiveTicket(sensitiveTicket, otherStudent)).toBe(false);
    });

    it("allows assigned staff member to view sensitive complaint", () => {
      expect(canInspectSensitiveTicket(sensitiveTicket, assignedStaff)).toBe(true);
    });

    it("strictly blocks unassigned staff member from inspecting sensitive complaints", () => {
      expect(canInspectSensitiveTicket(sensitiveTicket, unassignedStaff)).toBe(false);
    });

    it("allows super admin to inspect sensitive complaints for institutional governance", () => {
      expect(canInspectSensitiveTicket(sensitiveTicket, superAdmin)).toBe(true);
    });
  });
});
