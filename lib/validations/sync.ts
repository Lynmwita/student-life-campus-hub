import { z } from "zod";

export const uamsStudentSchema = z.object({
  email: z.string().email("Valid institutional email address required"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  registration_number: z.string().min(3, "Registration number is required"),
  faculty: z.string().min(2, "Faculty is required"),
  department: z.string().min(2, "Department is required"),
  year_of_study: z.coerce.number().int().min(1).max(7),
  campus_code: z.string().optional().default("SMU-MAIN"),
  initial_password: z.string().min(8).optional(),
});

export type UamsStudentInput = z.infer<typeof uamsStudentSchema>;

export const uamsCourseUnitSchema = z.object({
  code: z.string().min(2, "Unit code is required"),
  name: z.string().min(2, "Unit name is required"),
  faculty: z.string().min(2, "Faculty is required"),
  department: z.string().min(2, "Department is required"),
  year_of_study: z.coerce.number().int().min(1).max(7),
  semester: z.coerce.number().int().min(1).max(3),
  credit_hours: z.coerce.number().int().min(1).max(10).default(3),
});

export type UamsCourseUnitInput = z.infer<typeof uamsCourseUnitSchema>;

export const uamsTimetableSchema = z
  .object({
    course_code: z.string().min(2, "Course code is required"),
    campus_code: z.string().optional().default("SMU-MAIN"),
    day_of_week: z.coerce.number().int().min(1).max(7), // 1=Mon ... 7=Sun
    start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Start time must be HH:MM"),
    end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "End time must be HH:MM"),
    venue: z.string().min(2, "Venue is required"),
    lecturer_name: z.string().min(2, "Lecturer name is required"),
    semester: z.coerce.number().int().min(1).max(3),
    academic_year: z.string().min(4, "Academic year is required (e.g. 2026/2027)"),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export type UamsTimetableInput = z.infer<typeof uamsTimetableSchema>;

export const uamsSyncPayloadSchema = z.object({
  version: z.literal(1),
  dry_run: z.boolean().optional().default(false),
  students: z.array(uamsStudentSchema).optional().default([]),
  course_units: z.array(uamsCourseUnitSchema).optional().default([]),
  timetables: z.array(uamsTimetableSchema).optional().default([]),
});

export type UamsSyncPayload = z.infer<typeof uamsSyncPayloadSchema>;

export const registerStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Valid institutional email address required"),
  registrationNumber: z.string().trim().min(3, "Registration number is required"),
  faculty: z.string().trim().min(2, "Faculty is required"),
  department: z.string().trim().min(2, "Department is required"),
  yearOfStudy: z.coerce.number().int().min(1).max(6).default(1),
  campusCode: z.string().trim().optional().default("SMU-MAIN"),
  initialPassword: z.string().min(8, "Initial password must be at least 8 characters"),
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;


