import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const announcementSchema = z
  .object({
    universityId: z.string().regex(uuidRegex, "Please select a valid university"),
    campusId: z
      .string()
      .regex(uuidRegex, "Invalid campus ID")
      .optional()
      .or(z.literal("")),
    title: z
      .string()
      .min(5, "Announcement title must be at least 5 characters")
      .max(150, "Announcement title cannot exceed 150 characters"),
    content: z
      .string()
      .min(10, "Announcement content must be at least 10 characters")
      .max(5000, "Announcement content is too long"),
    priority: z.enum(["P1", "P2", "P3", "P4"], {
      message: "Priority must be P1 (Urgent), P2 (High), P3 (Medium), or P4 (General)",
    }),
    targetScope: z.enum(["all", "campus", "faculty", "department", "year"], {
      message: "Target scope must be all, campus, faculty, department, or year",
    }),
    targetFaculty: z.string().optional().or(z.literal("")),
    targetDepartment: z.string().optional().or(z.literal("")),
    targetYear: z.coerce
      .number()
      .int()
      .min(1)
      .max(7)
      .optional()
      .or(z.literal(0)),
    expiresAt: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Expiration date must be a valid ISO date string",
      })
      .optional()
      .or(z.literal("")),
    isPublished: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.targetScope === "campus" && (!data.campusId || data.campusId === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["campusId"],
        message: "Please select a campus when scoping announcements to a specific campus",
      });
    }

    if (data.targetScope === "faculty" && (!data.targetFaculty || data.targetFaculty.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetFaculty"],
        message: "Please select a school or faculty when scoping to a specific faculty",
      });
    }

    if (data.targetScope === "year" && (!data.targetYear || data.targetYear < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetYear"],
        message: "Please select a year of study when scoping to a specific year",
      });
    }
  });

export type AnnouncementInput = z.infer<typeof announcementSchema>;
