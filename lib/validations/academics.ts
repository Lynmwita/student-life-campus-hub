import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const courseUnitSchema = z.object({
  universityId: z.string().regex(uuidRegex, "Valid university ID required"),
  code: z.string().min(2, "Unit code is required").max(20),
  name: z.string().min(3, "Unit title is required").max(150),
  faculty: z.string().min(2, "Faculty is required"),
  department: z.string().min(2, "Department is required"),
  yearOfStudy: z.coerce.number().int().min(1).max(7),
  semester: z.coerce.number().int().min(1).max(3),
  creditHours: z.coerce.number().int().min(1).max(10).default(3),
});

export type CourseUnitInput = z.infer<typeof courseUnitSchema>;

export const timetableSchema = z
  .object({
    universityId: z.string().regex(uuidRegex, "Valid university ID required"),
    campusId: z.string().regex(uuidRegex, "Valid campus ID required").optional().or(z.literal("")),
    courseUnitId: z.string().regex(uuidRegex, "Valid course unit ID required"),
    dayOfWeek: z.coerce.number().int().min(1, "Day must be Monday through Sunday (1-7)").max(7),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid start time (HH:MM)"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid end time (HH:MM)"),
    venue: z.string().min(2, "Lecture hall or venue is required"),
    lecturerName: z.string().min(2, "Lecturer name is required"),
    semester: z.coerce.number().int().min(1).max(3),
    academicYear: z.string().min(4, "Academic year is required (e.g., 2026/2027)"),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type TimetableInput = z.infer<typeof timetableSchema>;

export const clubSchema = z.object({
  universityId: z.string().regex(uuidRegex, "Valid university ID required"),
  campusId: z.string().regex(uuidRegex).optional().or(z.literal("")),
  name: z.string().min(2, "Club name is required").max(100),
  slug: z.string().min(2, "Club slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "technology",
    "academic",
    "arts",
    "sports",
    "faith",
    "leadership",
    "community_service",
  ]),
  patronName: z.string().optional().or(z.literal("")),
});

export type ClubInput = z.infer<typeof clubSchema>;

export const eventSchema = z.object({
  universityId: z.string().regex(uuidRegex, "Valid university ID required"),
  campusId: z.string().regex(uuidRegex).optional().or(z.literal("")),
  clubId: z.string().regex(uuidRegex).optional().or(z.literal("")),
  title: z.string().min(3, "Event title is required").max(150),
  description: z.string().min(10, "Event description must be at least 10 characters"),
  venue: z.string().min(2, "Event venue is required"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Start time must be HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "End time must be HH:MM").optional().or(z.literal("")),
  category: z.enum(["academic", "career", "social", "sports", "hackathon", "workshop"]),
  isPublished: z.boolean().default(true),
});

export type EventInput = z.infer<typeof eventSchema>;
