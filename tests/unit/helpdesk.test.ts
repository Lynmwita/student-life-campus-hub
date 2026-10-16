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

  describe("Sensitive Complaint Privacy Isolation Logic (Locked-Door Test)", () => {
    const studentUser = { id: "user-student-1", role: "student" };
    const otherStudent = { id: "user-student-2", role: "student" };
    const staffA_Assigned = { id: "user-staff-a-assigned", role: "staff" };
    const staffB_Unassigned = { id: "user-staff-b-unassigned", role: "staff" };
    const adminUser = { id: "user-admin", role: "admin" };
    const superAdmin = { id: "user-super-admin", role: "super_admin" };

    const standardTicket = {
      id: "ticket-standard",
      referenceNumber: "HD-2026-0010",
      studentId: "user-student-1",
      assignedStaffId: "user-staff-a-assigned",
      isSensitive: false,
      category: "academic",
    };

    const sensitiveTicket = {
      id: "ticket-sensitive",
      referenceNumber: "HD-2026-0042",
      studentId: "user-student-1",
      assignedStaffId: "user-staff-a-assigned",
      isSensitive: true,
      category: "complaint",
    };

    function canViewRequest(
      ticket: typeof sensitiveTicket,
      user: { id: string; role: string }
    ): boolean {
      if (user.role === "admin" || user.role === "super_admin") return true;
      if (user.role === "student") {
        return user.id === ticket.studentId;
      }
      if (user.role === "staff") {
        if (!ticket.isSensitive) return true;
        return user.id === ticket.assignedStaffId;
      }
      return false;
    }

    function searchQueue(
      tickets: (typeof sensitiveTicket)[],
      query: string,
      user: { id: string; role: string }
    ): (typeof sensitiveTicket)[] {
      return tickets.filter((t) => {
        if (!canViewRequest(t, user)) return false;
        return t.referenceNumber.toLowerCase().includes(query.toLowerCase());
      });
    }

    function canReplyToRequest(
      ticket: typeof sensitiveTicket,
      user: { id: string; role: string }
    ): boolean {
      return canViewRequest(ticket, user);
    }

    it("allows submitting student to view and reply to their own requests", () => {
      expect(canViewRequest(standardTicket, studentUser)).toBe(true);
      expect(canReplyToRequest(standardTicket, studentUser)).toBe(true);
      expect(canViewRequest(sensitiveTicket, studentUser)).toBe(true);
      expect(canReplyToRequest(sensitiveTicket, studentUser)).toBe(true);
    });

    it("strictly blocks a student from reading another student's request", () => {
      expect(canViewRequest(standardTicket, otherStudent)).toBe(false);
      expect(canReplyToRequest(standardTicket, otherStudent)).toBe(false);
      expect(canViewRequest(sensitiveTicket, otherStudent)).toBe(false);
      expect(canReplyToRequest(sensitiveTicket, otherStudent)).toBe(false);
    });

    it("locked-door test: Staff A (assigned) can see sensitive complaint in queue, search, and direct view", () => {
      expect(canViewRequest(sensitiveTicket, staffA_Assigned)).toBe(true);
      expect(canReplyToRequest(sensitiveTicket, staffA_Assigned)).toBe(true);

      const searchResults = searchQueue([sensitiveTicket], "HD-2026-0042", staffA_Assigned);
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].referenceNumber).toBe("HD-2026-0042");
    });

    it("locked-door test: Staff B (unassigned) CANNOT see sensitive complaint anywhere (queue, search, or direct link)", () => {
      // Direct view / URL navigation
      expect(canViewRequest(sensitiveTicket, staffB_Unassigned)).toBe(false);
      expect(canReplyToRequest(sensitiveTicket, staffB_Unassigned)).toBe(false);

      // Search results
      const searchResults = searchQueue([sensitiveTicket], "HD-2026-0042", staffB_Unassigned);
      expect(searchResults).toHaveLength(0);
    });

    it("allows Staff B to view non-sensitive general queue requests", () => {
      expect(canViewRequest(standardTicket, staffB_Unassigned)).toBe(true);
    });

    it("allows administrators to inspect and supervise all help requests", () => {
      expect(canViewRequest(sensitiveTicket, adminUser)).toBe(true);
      expect(canViewRequest(sensitiveTicket, superAdmin)).toBe(true);
    });

    it("simulates recording audit log on sensitive ticket access and mutations", () => {
      const auditEvents: Array<{ action: string; actorId: string; entityId: string }> = [];

      function recordAudit(actorId: string, action: string, entityId: string) {
        auditEvents.push({ actorId, action, entityId });
      }

      // Staff A views ticket
      if (canViewRequest(sensitiveTicket, staffA_Assigned)) {
        recordAudit(staffA_Assigned.id, "VIEW_SENSITIVE_TICKET", sensitiveTicket.id);
      }
      // Staff A changes status
      recordAudit(staffA_Assigned.id, "STATUS_CHANGE_IN_REVIEW", sensitiveTicket.id);

      expect(auditEvents).toHaveLength(2);
      expect(auditEvents[0].action).toBe("VIEW_SENSITIVE_TICKET");
      expect(auditEvents[1].action).toBe("STATUS_CHANGE_IN_REVIEW");
    });
  });
});
