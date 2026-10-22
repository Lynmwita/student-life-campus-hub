import {
  uamsSyncPayloadSchema,
  uamsStudentSchema,
  uamsCourseUnitSchema,
  uamsTimetableSchema,
  uamsAnnouncementSchema,
  type UamsSyncPayload,
  type UamsStudentInput,
  type UamsCourseUnitInput,
  type UamsTimetableInput,
} from "@/lib/validations/sync";

/**
 * Normalizes email by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: unknown): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * Normalizes registration numbers (e.g., "smu/2026/001" -> "SMU/2026/001").
 */
export function normalizeRegNumber(regNo: unknown): string {
  if (typeof regNo !== "string") return "";
  return regNo.trim().toUpperCase();
}

/**
 * Normalizes semester representation:
 * Handles: 1, 2, 3, "1", "2", "3", "SEM_1", "SEM-2", "Semester 1", "S1", "Term 2", etc.
 */
export function normalizeSemester(sem: unknown): number {
  if (typeof sem === "number" && sem >= 1 && sem <= 3) {
    return Math.floor(sem);
  }
  if (typeof sem === "string") {
    const trimmed = sem.trim().toUpperCase();
    const match = trimmed.match(/(?:SEM(?:ESTER)?|TERM|S)[_\s-]*([1-3])/i) || trimmed.match(/^[0-9]+/);
    if (match) {
      const val = parseInt(match[1] || match[0], 10);
      if (val >= 1 && val <= 3) return val;
    }
  }
  return 1; // Default to semester 1 if undetermined
}

/**
 * Normalizes year of study (1 to 7).
 * Handles: 2, "2", "Year 2", "Y2", "Yr 3", etc.
 */
export function normalizeYearOfStudy(year: unknown): number {
  if (typeof year === "number" && year >= 1 && year <= 7) {
    return Math.floor(year);
  }
  if (typeof year === "string") {
    const trimmed = year.trim();
    const match = trimmed.match(/(?:YEAR|YR|Y)[_\s-]*([1-7])/i) || trimmed.match(/^[0-9]+/);
    if (match) {
      const val = parseInt(match[1] || match[0], 10);
      if (val >= 1 && val <= 7) return val;
    }
  }
  return 1;
}

/**
 * Normalizes day of week to integer 1-7 (1=Monday ... 7=Sunday).
 * Handles integers, number strings, and name strings ("Monday", "Mon", "Tuesday", etc.)
 */
export function normalizeDayOfWeek(day: unknown): number {
  if (typeof day === "number" && day >= 1 && day <= 7) {
    return Math.floor(day);
  }
  if (typeof day === "string") {
    const trimmed = day.trim().toLowerCase();
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= 7) return num;

    if (trimmed.startsWith("mon")) return 1;
    if (trimmed.startsWith("tue")) return 2;
    if (trimmed.startsWith("wed")) return 3;
    if (trimmed.startsWith("thu")) return 4;
    if (trimmed.startsWith("fri")) return 5;
    if (trimmed.startsWith("sat")) return 6;
    if (trimmed.startsWith("sun")) return 7;
  }
  return 1;
}

/**
 * Normalizes time string to "HH:MM" 24-hour format.
 * Handles "9:00", "09:00", "09:00:00", "2:30 PM", "9:00 AM", "14:15".
 */
export function normalizeTime(time: unknown): string {
  if (typeof time !== "string") return "08:00";
  const trimmed = time.trim();

  // Handle 12-hour AM/PM formats e.g. "2:30 PM" or "9:00 AM"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const isPm = ampmMatch[3].toUpperCase() === "PM";
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  // Handle standard 24-hour formats e.g. "9:00" or "09:00:00"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = match[2];
    if (hours >= 0 && hours <= 23 && parseInt(minutes, 10) >= 0 && parseInt(minutes, 10) <= 59) {
      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    }
  }

  return "08:00";
}

/**
 * Normalizes academic year (e.g., "2026-2027", "2026/27", "2026" -> "2026/2027").
 */
export function normalizeAcademicYear(ay: unknown): string {
  if (typeof ay !== "string") return "2026/2027";
  const trimmed = ay.trim();
  const rangeMatch = trimmed.match(/^(\d{4})[/-](\d{2,4})$/);
  if (rangeMatch) {
    const start = rangeMatch[1];
    let end = rangeMatch[2];
    if (end.length === 2) {
      end = `${start.slice(0, 2)}${end}`;
    }
    return `${start}/${end}`;
  }
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    const start = parseInt(yearMatch[1], 10);
    return `${start}/${start + 1}`;
  }
  return trimmed || "2026/2027";
}

/**
 * Normalizes a student record from varying SIS representations.
 */
export function normalizeStudent(raw: Record<string, unknown>): UamsStudentInput | null {
  if (!raw || typeof raw !== "object") return null;

  const email = normalizeEmail(raw.email || raw.student_email || raw.user_email);
  const fullName = String(raw.full_name || raw.name || raw.student_name || raw.displayName || "").trim();
  const regNo = normalizeRegNumber(
    raw.registration_number || raw.reg_no || raw.student_id || raw.registrationNumber || raw.admission_number
  );
  const faculty = String(raw.faculty || raw.school || raw.college || "General Studies").trim();
  const department = String(raw.department || raw.dept || raw.programme || "General").trim();
  const yearOfStudy = normalizeYearOfStudy(raw.year_of_study ?? raw.year ?? raw.academic_year_level);
  const campusCode = String(raw.campus_code || raw.campus || "SMU-MAIN").trim().toUpperCase();
  const initialPassword = typeof raw.initial_password === "string" ? raw.initial_password : undefined;

  const candidate = {
    email,
    full_name: fullName,
    registration_number: regNo,
    faculty,
    department,
    year_of_study: yearOfStudy,
    campus_code: campusCode,
    enrollment_status:raw.enrollment_status,
    enrollment_updated_at:raw.enrollment_updated_at,
    ...(initialPassword ? { initial_password: initialPassword } : {}),
  };

  const parsed = uamsStudentSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Normalizes a course unit record from varying SIS representations.
 */
export function normalizeCourseUnit(raw: Record<string, unknown>): UamsCourseUnitInput | null {
  if (!raw || typeof raw !== "object") return null;

  const code = String(raw.code || raw.unit_code || raw.course_code || raw.courseCode || "").trim().toUpperCase();
  const name = String(raw.name || raw.unit_name || raw.course_name || raw.title || "").trim();
  const faculty = String(raw.faculty || raw.school || raw.college || "General Studies").trim();
  const department = String(raw.department || raw.dept || raw.programme || "General").trim();
  const yearOfStudy = normalizeYearOfStudy(raw.year_of_study ?? raw.year);
  const semester = normalizeSemester(raw.semester ?? raw.sem ?? raw.term);
  const creditHours = raw.credit_hours !== undefined ? Number(raw.credit_hours) : (raw.credits !== undefined ? Number(raw.credits) : 3);

  const candidate = {
    code,
    name,
    faculty,
    department,
    year_of_study: yearOfStudy,
    semester,
    credit_hours: isNaN(creditHours) || creditHours < 1 || creditHours > 10 ? 3 : Math.floor(creditHours),
  };

  const parsed = uamsCourseUnitSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Normalizes a timetable record from varying SIS representations.
 */
export function normalizeTimetable(raw: Record<string, unknown>): UamsTimetableInput | null {
  if (!raw || typeof raw !== "object") return null;

  const courseCode = String(
    raw.course_code || raw.unit_code || raw.code || raw.courseCode || ""
  ).trim().toUpperCase();
  const campusCode = String(raw.campus_code || raw.campus || "SMU-MAIN").trim().toUpperCase();
  const dayOfWeek = normalizeDayOfWeek(raw.day_of_week ?? raw.day ?? raw.dayOfWeek);
  const startTime = normalizeTime(raw.start_time ?? raw.startTime ?? raw.start ?? raw.from);
  let endTime = normalizeTime(raw.end_time ?? raw.endTime ?? raw.end ?? raw.to);

  // If end_time is not strictly after start_time, synthesize a 2-hour duration
  if (endTime <= startTime) {
    const [startH, startM] = startTime.split(":").map(Number);
    const endH = Math.min(startH + 2, 22);
    endTime = `${endH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;
    if (endTime <= startTime) {
      return null;
    }
  }

  const venue = String(raw.venue || raw.room || raw.hall || raw.location || "TBA").trim();
  const lecturerName = String(
    raw.lecturer_name || raw.lecturer || raw.instructor || raw.professor || "Staff"
  ).trim();
  const semester = normalizeSemester(raw.semester ?? raw.sem ?? raw.term);
  const academicYear = normalizeAcademicYear(raw.academic_year ?? raw.academicYear ?? raw.session);

  const candidate = {
    course_code: courseCode,
    source_id:raw.source_id,updated_at:raw.updated_at,is_active:raw.is_active,
    campus_code: campusCode,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    venue,
    lecturer_name: lecturerName,
    semester,
    academic_year: academicYear,
  };

  const parsed = uamsTimetableSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Unwraps and normalizes any SIS payload (nested envelopes, raw arrays, camelCase keys)
 * into a canonical, schema-valid UamsSyncPayload.
 */
export function normalizeRegistrarPayload(payload: unknown): UamsSyncPayload {
  if (!payload || typeof payload !== "object") {
    return uamsSyncPayloadSchema.parse({version:1});
  }

  const obj = payload as Record<string, unknown>;

  // Unwrap common envelopes e.g. { data: { ... } }, { result: { ... } }, { payload: { ... } }
  let target = obj;
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    target = obj.data as Record<string, unknown>;
  } else if (obj.result && typeof obj.result === "object" && !Array.isArray(obj.result)) {
    target = obj.result as Record<string, unknown>;
  } else if (obj.payload && typeof obj.payload === "object" && !Array.isArray(obj.payload)) {
    target = obj.payload as Record<string, unknown>;
  }

  const rawStudents = Array.isArray(target.students)
    ? target.students
    : Array.isArray(target.studentList)
    ? target.studentList
    : [];

  const rawCourseUnits = Array.isArray(target.course_units)
    ? target.course_units
    : Array.isArray(target.courseUnits)
    ? target.courseUnits
    : Array.isArray(target.units)
    ? target.units
    : Array.isArray(target.courses)
    ? target.courses
    : [];

  const rawTimetables = Array.isArray(target.timetables)
    ? target.timetables
    : Array.isArray(target.timetable)
    ? target.timetable
    : Array.isArray(target.schedules)
    ? target.schedules
    : [];

  const dryRun = Boolean(target.dry_run ?? target.dryRun ?? obj.dry_run ?? false);

  // Announcement identity, scope and timestamps must be explicit. Never silently
  // discard or widen an invalid notice while normalizing unrelated SIS records.
  const announcements = target.announcements === undefined ? [] :
    uamsAnnouncementSchema.array().max(1000).parse(target.announcements);

  const students: UamsStudentInput[] = [];
  for (const item of rawStudents) {
    const normalized = normalizeStudent(item as Record<string, unknown>);
    if (normalized) {
      students.push(normalized);
    }
  }

  const courseUnits: UamsCourseUnitInput[] = [];
  for (const item of rawCourseUnits) {
    const normalized = normalizeCourseUnit(item as Record<string, unknown>);
    if (normalized) {
      courseUnits.push(normalized);
    }
  }

  const timetables: UamsTimetableInput[] = [];
  for (const item of rawTimetables) {
    const normalized = normalizeTimetable(item as Record<string, unknown>);
    if (normalized) {
      timetables.push(normalized);
    }
  }

  return uamsSyncPayloadSchema.parse({
    version: 1,
    dry_run: dryRun,
    students,
    course_units: courseUnits,
    timetables,
    announcements,
    grades:target.grades,events:target.events,academic_dates:target.academic_dates,
  });
}
