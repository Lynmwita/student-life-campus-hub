import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const HELPDESK_CATEGORIES = [
  "academic",
  "fees",
  "accommodation",
  "technical",
  "complaint",
  "other",
  "facilities",
  "welfare",
  "finance_aid",
  "hostel",
  "it_support",
  "lecturer_conduct",
  "sensitive_complaint",
  "general",
] as const;

export const HELPDESK_PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

export const HELPDESK_STATUSES = [
  "submitted",
  "in_review",
  "under_review",
  "in_progress",
  "resolved",
  "closed",
] as const;

export const ticketSubmissionSchema = z.object({
  category: z.enum(HELPDESK_CATEGORIES, {
    message: "Please select a valid help request category",
  }),
  priority: z.enum(HELPDESK_PRIORITIES, {
    message: "Priority must be P1 (Urgent), P2 (High), P3 (Medium), or P4 (General)",
  }).default("P3"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(150, "Subject cannot exceed 150 characters"),
  description: z
    .string()
    .min(10, "Please provide at least 10 characters describing the issue")
    .max(5000, "Description cannot exceed 5000 characters"),
  campusId: z
    .string()
    .regex(uuidRegex, "Invalid campus ID")
    .optional()
    .or(z.literal("")),
  isSensitive: z.boolean().default(false),
  sensitiveType: z
    .enum(["lecturer_conduct", "harassment", "grade_dispute", "victimization", "other"])
    .optional()
    .or(z.literal("")),
}).transform((data) => {
  // Automatically force isSensitive = true for sensitive complaint categories
  if (data.category === "lecturer_conduct" || data.category === "sensitive_complaint") {
    return {
      ...data,
      isSensitive: true,
      sensitiveType: data.sensitiveType || (data.category as "lecturer_conduct" | "sensitive_complaint"),
    };
  }
  return data;
});

export const ticketStatusUpdateSchema = z.object({
  ticketId: z.string().regex(uuidRegex, "Invalid ticket ID"),
  status: z.enum(HELPDESK_STATUSES, {
    message: "Please select a valid ticket status",
  }),
  message: z
    .string()
    .min(2, "Status change note must be at least 2 characters")
    .max(2000, "Note cannot exceed 2000 characters"),
  isInternal: z.boolean().default(false),
  resolutionNotes: z.string().max(2000).optional().or(z.literal("")),
});

export const ticketAssignStaffSchema = z.object({
  ticketId: z.string().regex(uuidRegex, "Invalid ticket ID"),
  staffId: z.string().regex(uuidRegex, "Invalid staff user ID"),
  note: z.string().max(1000).optional().or(z.literal("")),
});

export const ticketMessageReplySchema = z.object({
  ticketId: z.string().regex(uuidRegex, "Invalid ticket ID"),
  message: z
    .string()
    .min(2, "Reply message must be at least 2 characters")
    .max(2000, "Reply cannot exceed 2000 characters"),
  isInternal: z.boolean().default(false),
});
