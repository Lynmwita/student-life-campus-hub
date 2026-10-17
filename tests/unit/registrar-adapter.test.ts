import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  normalizeRegNumber,
  normalizeSemester,
  normalizeYearOfStudy,
  normalizeDayOfWeek,
  normalizeTime,
  normalizeAcademicYear,
  normalizeStudent,
  normalizeCourseUnit,
  normalizeTimetable,
  normalizeRegistrarPayload,
} from "@/lib/uams/adapter";
import { uamsSyncPayloadSchema } from "@/lib/validations/sync";

describe("Phase 11 — Registrar Data Normalization & Adapter (Step 11.2)", () => {
  describe("Field level normalizers", () => {
    it("normalizes student emails (trims and converts to lowercase)", () => {
      expect(normalizeEmail("  STUDENT.ONE@SUMMIT.AC.KE  ")).toBe("student.one@summit.ac.ke");
      expect(normalizeEmail("Jane.Doe@Summit.AC.KE")).toBe("jane.doe@summit.ac.ke");
      expect(normalizeEmail(null)).toBe("");
      expect(normalizeEmail(undefined)).toBe("");
    });

    it("normalizes registration numbers (trims and converts to uppercase)", () => {
      expect(normalizeRegNumber("  smu/2026/001  ")).toBe("SMU/2026/001");
      expect(normalizeRegNumber("zu/ict/2026/99")).toBe("ZU/ICT/2026/99");
      expect(normalizeRegNumber(null)).toBe("");
    });

    it("normalizes semester inputs across multiple legacy SIS representations", () => {
      expect(normalizeSemester(1)).toBe(1);
      expect(normalizeSemester(2)).toBe(2);
      expect(normalizeSemester(3)).toBe(3);
      expect(normalizeSemester("1")).toBe(1);
      expect(normalizeSemester("SEM_1")).toBe(1);
      expect(normalizeSemester("SEM-2")).toBe(2);
      expect(normalizeSemester("Semester 2")).toBe(2);
      expect(normalizeSemester("Term 3")).toBe(3);
      expect(normalizeSemester("S1")).toBe(1);
      expect(normalizeSemester("Invalid")).toBe(1); // graceful default
    });

    it("normalizes year of study representations", () => {
      expect(normalizeYearOfStudy(2)).toBe(2);
      expect(normalizeYearOfStudy("3")).toBe(3);
      expect(normalizeYearOfStudy("Year 4")).toBe(4);
      expect(normalizeYearOfStudy("Y1")).toBe(1);
      expect(normalizeYearOfStudy("Yr 2")).toBe(2);
      expect(normalizeYearOfStudy("Unknown")).toBe(1);
    });

    it("normalizes day of week names and integers", () => {
      expect(normalizeDayOfWeek(1)).toBe(1);
      expect(normalizeDayOfWeek("1")).toBe(1);
      expect(normalizeDayOfWeek("Monday")).toBe(1);
      expect(normalizeDayOfWeek("mon")).toBe(1);
      expect(normalizeDayOfWeek("Tuesday")).toBe(2);
      expect(normalizeDayOfWeek("Wed")).toBe(3);
      expect(normalizeDayOfWeek("Thursday")).toBe(4);
      expect(normalizeDayOfWeek("Friday")).toBe(5);
      expect(normalizeDayOfWeek("Saturday")).toBe(6);
      expect(normalizeDayOfWeek("Sunday")).toBe(7);
      expect(normalizeDayOfWeek("InvalidDay")).toBe(1);
    });

    it("normalizes varying time string formats to standard HH:MM", () => {
      expect(normalizeTime("9:00")).toBe("09:00");
      expect(normalizeTime("09:00")).toBe("09:00");
      expect(normalizeTime("09:00:00")).toBe("09:00");
      expect(normalizeTime("14:30:00")).toBe("14:30");
      expect(normalizeTime("2:30 PM")).toBe("14:30");
      expect(normalizeTime("9:15 AM")).toBe("09:15");
      expect(normalizeTime("12:00 PM")).toBe("12:00");
      expect(normalizeTime("12:00 AM")).toBe("00:00");
    });

    it("normalizes academic year formats", () => {
      expect(normalizeAcademicYear("2026/2027")).toBe("2026/2027");
      expect(normalizeAcademicYear("2026-2027")).toBe("2026/2027");
      expect(normalizeAcademicYear("2026/27")).toBe("2026/2027");
      expect(normalizeAcademicYear("2026")).toBe("2026/2027");
    });
  });

  describe("Entity-level normalizers", () => {
    it("normalizes student records with alternative field keys and formatting", () => {
      const raw = {
        student_email: "  ALICE.W@SUMMIT.AC.KE  ",
        name: "Alice Wanjiru",
        reg_no: "smu/cs/2026/101",
        school: "School of Computing",
        programme: "Computer Science",
        academic_year_level: "Year 2",
        campus: "smu-main",
      };

      const normalized = normalizeStudent(raw);
      expect(normalized).not.toBeNull();
      expect(normalized?.email).toBe("alice.w@summit.ac.ke");
      expect(normalized?.full_name).toBe("Alice Wanjiru");
      expect(normalized?.registration_number).toBe("SMU/CS/2026/101");
      expect(normalized?.faculty).toBe("School of Computing");
      expect(normalized?.department).toBe("Computer Science");
      expect(normalized?.year_of_study).toBe(2);
      expect(normalized?.campus_code).toBe("SMU-MAIN");
    });

    it("normalizes course units with aliases and legacy semester codes", () => {
      const raw = {
        unit_code: "cs 201",
        title: "Data Structures & Algorithms",
        faculty: "School of Computing",
        department: "Computer Science",
        year: "2",
        term: "SEM_1",
        credits: "4",
      };

      const normalized = normalizeCourseUnit(raw);
      expect(normalized).not.toBeNull();
      expect(normalized?.code).toBe("CS 201");
      expect(normalized?.name).toBe("Data Structures & Algorithms");
      expect(normalized?.year_of_study).toBe(2);
      expect(normalized?.semester).toBe(1);
      expect(normalized?.credit_hours).toBe(4);
    });

    it("normalizes timetable slots and repairs inverted/missing end times", () => {
      const raw = {
        courseCode: "cs 201",
        day: "Monday",
        from: "9:00 AM",
        to: "8:00 AM", // inverted/corrupt end time
        room: "Lab 3B",
        instructor: "Dr. Omondi",
        sem: "Semester 1",
        academicYear: "2026-2027",
      };

      const normalized = normalizeTimetable(raw);
      expect(normalized).not.toBeNull();
      expect(normalized?.course_code).toBe("CS 201");
      expect(normalized?.day_of_week).toBe(1);
      expect(normalized?.start_time).toBe("09:00");
      expect(normalized?.end_time).toBe("11:00"); // auto-corrected 2-hr slot
      expect(normalized?.venue).toBe("Lab 3B");
      expect(normalized?.lecturer_name).toBe("Dr. Omondi");
      expect(normalized?.semester).toBe(1);
      expect(normalized?.academic_year).toBe("2026/2027");
    });
  });

  describe("Envelope unwrapping & full payload normalization", () => {
    it("unwraps nested { data: { ... } } responses and parses all entities into canonical schema", () => {
      const upstreamRawPayload = {
        status: "success",
        data: {
          dryRun: false,
          studentList: [
            {
              email: "BRIAN.O@SUMMIT.AC.KE",
              student_name: "Brian Otieno",
              student_id: "smu/2026/045",
              faculty: "School of Engineering",
              department: "Electrical Engineering",
              year_of_study: "Y1",
            },
          ],
          courseUnits: [
            {
              code: "ENG 101",
              name: "Engineering Mathematics I",
              faculty: "School of Engineering",
              department: "Electrical Engineering",
              year_of_study: 1,
              semester: "SEM_1",
            },
          ],
          schedules: [
            {
              unit_code: "ENG 101",
              day: "Tuesday",
              start_time: "10:00",
              end_time: "12:00",
              hall: "Lecture Theatre 1",
              professor: "Prof. Kimani",
              semester: 1,
              session: "2026/2027",
            },
          ],
        },
      };

      const normalized = normalizeRegistrarPayload(upstreamRawPayload);

      // Verify strict Zod contract compliance
      const validated = uamsSyncPayloadSchema.parse(normalized);
      expect(validated.version).toBe(1);
      expect(validated.dry_run).toBe(false);
      expect(validated.students.length).toBe(1);
      expect(validated.students[0].email).toBe("brian.o@summit.ac.ke");
      expect(validated.course_units.length).toBe(1);
      expect(validated.course_units[0].code).toBe("ENG 101");
      expect(validated.timetables.length).toBe(1);
      expect(validated.timetables[0].day_of_week).toBe(2);
      expect(validated.timetables[0].venue).toBe("Lecture Theatre 1");
    });

    it("gracefully ignores corrupt or missing items while retaining valid records", () => {
      const mixedPayload = {
        students: [
          {
            email: "valid@summit.ac.ke",
            name: "Valid Student",
            registration_number: "SMU/VAL/01",
            faculty: "Computing",
            department: "CS",
            year_of_study: 1,
          },
          {
            email: "not-an-email", // corrupt, should be filtered
            name: "Invalid Student",
          },
        ],
        course_units: [
          {
            code: "CS 101",
            name: "CS Intro",
            faculty: "Computing",
            department: "CS",
            year_of_study: 1,
            semester: 1,
          },
          {
            code: "", // invalid code
          },
        ],
      };

      const normalized = normalizeRegistrarPayload(mixedPayload);
      expect(normalized.students.length).toBe(1);
      expect(normalized.students[0].email).toBe("valid@summit.ac.ke");
      expect(normalized.course_units.length).toBe(1);
      expect(normalized.course_units[0].code).toBe("CS 101");
    });
  });
});
