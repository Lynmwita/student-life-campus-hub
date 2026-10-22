import { z } from "zod";

export const uamsStudentSchema = z.object({
  email: z.string().email("Valid institutional email address required"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  registration_number: z.string().min(3, "Registration number is required"),
  faculty: z.string().min(2, "Faculty is required"),
  department: z.string().min(2, "Department is required"),
  program_name: z.string().optional(),
  program_of_study: z.string().optional(),
  year_of_study: z.coerce.number().int().min(1).max(7),
  campus_code: z.string().optional().default("ZU-TECH"),
  initial_password: z.string().min(8).optional(),
  enrollment_status: z.enum(['active','suspended','withdrawn','graduated','pending']).optional(),
  enrollment_updated_at: z.string().datetime({offset:true}).optional(),
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
    source_id:z.string().trim().min(1).max(200).optional(),
    updated_at:z.string().datetime({offset:true}).optional(),
    is_active:z.boolean().default(true),
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
  }).refine(data=>Boolean(data.source_id)===Boolean(data.updated_at),{message:'Timetable source ID and timestamp must be provided together',path:['source_id']});

export type UamsTimetableInput = z.infer<typeof uamsTimetableSchema>;

export const uamsAnnouncementSchema = z.object({
  source_id: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(10000),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']),
  target_scope: z.enum(['all', 'campus', 'faculty', 'department', 'year']),
  campus_code: z.string().trim().min(1).max(100).optional(),
  target_faculty: z.string().trim().min(1).max(200).optional(),
  target_department: z.string().trim().min(1).max(200).optional(),
  target_year: z.number().int().min(1).max(7).optional(),
  is_published: z.boolean().default(true),
  published_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }).nullable().optional().default(null),
}).superRefine((notice, context) => {
  const required = { campus: 'campus_code', faculty: 'target_faculty', department: 'target_department', year: 'target_year' } as const;
  if (notice.target_scope !== 'all') {
    const key = required[notice.target_scope];
    if (!notice[key]) context.addIssue({ code: 'custom', path: [key], message: `${key} is required for this target scope` });
  }
});
export type UamsAnnouncementInput = z.infer<typeof uamsAnnouncementSchema>;

const sourceRecord = z.object({source_id:z.string().trim().min(1).max(200),updated_at:z.string().datetime({offset:true}),is_published:z.boolean()});
export const uamsGradeSchema = sourceRecord.extend({student_email:z.string().email(),course_code:z.string().min(1),course_name:z.string().min(1),grade:z.string().max(20),score:z.number().min(0).max(100).optional(),semester:z.number().int().min(1).max(3),academic_year:z.string().min(4)});
export const uamsEventSchema = sourceRecord.extend({title:z.string().min(1).max(200),description:z.string().max(10000),venue:z.string().min(1),starts_at:z.string().datetime({offset:true}),ends_at:z.string().datetime({offset:true}),campus_code:z.string().optional()}).refine(r=>Date.parse(r.ends_at)>Date.parse(r.starts_at),'Event must end after it starts');
export const uamsAcademicDateSchema = sourceRecord.extend({title:z.string().min(1).max(200),description:z.string().max(10000),starts_at:z.string().datetime({offset:true}),ends_at:z.string().datetime({offset:true}),kind:z.enum(['exam','term','deadline'])}).refine(r=>Date.parse(r.ends_at)>=Date.parse(r.starts_at),'Date range is invalid');

export const uamsSyncPayloadSchema = z.object({
  version: z.literal(1),
  dry_run: z.boolean().optional().default(false),
  students: z.array(uamsStudentSchema).optional().default([]),
  course_units: z.array(uamsCourseUnitSchema).optional().default([]),
  timetables: z.array(uamsTimetableSchema).optional().default([]),
  announcements: z.array(uamsAnnouncementSchema).max(1000).optional().default([]),
  grades:z.array(uamsGradeSchema).max(100000).default([]),
  events:z.array(uamsEventSchema).max(10000).default([]),
  academic_dates:z.array(uamsAcademicDateSchema).max(10000).default([]),
}).superRefine((payload, context) => {
  for(const key of ['grades','events','academic_dates'] as const){const ids=new Set<string>();for(const [i,row] of payload[key].entries()){if(ids.has(row.source_id))context.addIssue({code:'custom',path:[key,i,'source_id'],message:'Duplicate source ID'});ids.add(row.source_id);}}
  for(const [i,student] of payload.students.entries())if(Boolean(student.enrollment_status)!==Boolean(student.enrollment_updated_at))context.addIssue({code:'custom',path:['students',i,'enrollment_status'],message:'Enrollment status and authoritative timestamp must be supplied together'});
  const seen = new Set<string>();
  for (const [index, notice] of payload.announcements.entries()) {
    if (seen.has(notice.source_id)) context.addIssue({ code: 'custom', path: ['announcements', index, 'source_id'], message: 'Duplicate announcement source ID' });
    seen.add(notice.source_id);
  }
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


