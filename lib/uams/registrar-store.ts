import { UamsSyncPayload } from "@/lib/validations/sync";

export interface RegistrarStudent {
  email: string;
  full_name: string;
  registration_number: string;
  faculty: string;
  department: string;
  year_of_study: number;
  campus_code?: string;
  initial_password?: string;
}

export interface RegistrarCourseUnit {
  code: string;
  name: string;
  faculty: string;
  department: string;
  year_of_study: number;
  semester: number;
  credit_hours?: number;
}

export interface RegistrarTimetable {
  course_code: string;
  campus_code?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  venue: string;
  lecturer_name: string;
  semester: number;
  academic_year: string;
}

const DEFAULT_STUDENTS: RegistrarStudent[] = [
  {
    email: "alex.mutua@summit.ac.ke",
    full_name: "Alex Mutua",
    registration_number: "BIT/2023/8849",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    year_of_study: 2,
    campus_code: "SMU-MAIN",
  },
  {
    email: "faith.chepkemoi@summit.ac.ke",
    full_name: "Faith Chepkemoi",
    registration_number: "SMU/BCS/2024/0089",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    year_of_study: 2,
    campus_code: "SMU-MAIN",
  },
];

const DEFAULT_COURSE_UNITS: RegistrarCourseUnit[] = [
  {
    code: "COMP 211",
    name: "Object-Oriented Analysis & Design",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    year_of_study: 2,
    semester: 1,
    credit_hours: 3,
  },
  {
    code: "COMP 214",
    name: "Database Systems & Architecture",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    year_of_study: 2,
    semester: 1,
    credit_hours: 3,
  },
];

const DEFAULT_TIMETABLES: RegistrarTimetable[] = [
  {
    course_code: "COMP 211",
    campus_code: "SMU-MAIN",
    day_of_week: 1,
    start_time: "08:30",
    end_time: "11:30",
    venue: "Computing Lab 3 (Westlands)",
    lecturer_name: "Dr. Evans Ochieng",
    semester: 1,
    academic_year: "2026/2027",
  },
];

// In-memory mutable registrar store for simulation, testing freshness, and fallback
let liveStudents: RegistrarStudent[] = JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
let liveCourseUnits: RegistrarCourseUnit[] = JSON.parse(JSON.stringify(DEFAULT_COURSE_UNITS));
let liveTimetables: RegistrarTimetable[] = JSON.parse(JSON.stringify(DEFAULT_TIMETABLES));

/**
 * Retrieves the current registrar payload from UAMS.
 * If UAMS_UPSTREAM_URL is set, queries the external registrar API with timeout.
 * Otherwise returns the institutional registrar store.
 */
export async function getUamsRegistrarData(): Promise<UamsSyncPayload> {
  const upstreamUrl = process.env.UAMS_UPSTREAM_URL;

  if (upstreamUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(process.env.UAMS_API_KEY ? { "X-API-Key": process.env.UAMS_API_KEY } : {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return data as UamsSyncPayload;
      }
    } catch (err) {
      console.warn("Failed to fetch upstream UAMS registrar feed, falling back to local store:", err);
    }
  }

  return {
    version: 1,
    dry_run: false,
    students: JSON.parse(JSON.stringify(liveStudents)),
    course_units: JSON.parse(JSON.stringify(liveCourseUnits)),
    timetables: JSON.parse(JSON.stringify(liveTimetables)),
  };
}

/**
 * Updates or adds a student record in the registrar store (used to prove freshness).
 */
export function updateUamsStudentRecord(updated: Partial<RegistrarStudent> & { email: string }): void {
  const index = liveStudents.findIndex((s) => s.email.toLowerCase() === updated.email.toLowerCase());
  if (index >= 0) {
    liveStudents[index] = { ...liveStudents[index], ...updated };
  } else {
    liveStudents.push({
      email: updated.email,
      full_name: updated.full_name || "New Student",
      registration_number: updated.registration_number || `REG/${Date.now().toString().slice(-4)}`,
      faculty: updated.faculty || "School of Computing & Informatics",
      department: updated.department || "Computer Science",
      year_of_study: updated.year_of_study || 1,
      campus_code: updated.campus_code || "SMU-MAIN",
      initial_password: updated.initial_password,
    });
  }
}

/**
 * Resets the registrar store back to default values.
 */
export function resetUamsRegistrarData(): void {
  liveStudents = JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
  liveCourseUnits = JSON.parse(JSON.stringify(DEFAULT_COURSE_UNITS));
  liveTimetables = JSON.parse(JSON.stringify(DEFAULT_TIMETABLES));
}
