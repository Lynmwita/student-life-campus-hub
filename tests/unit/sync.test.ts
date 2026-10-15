import { describe, it, expect } from "vitest";
import {
  uamsSyncPayloadSchema,
  uamsStudentSchema,
  uamsCourseUnitSchema,
  uamsTimetableSchema,
} from "@/lib/validations/sync";
import { syncUamsDataAction } from "@/lib/actions/sync";

describe("UAMS Synchronization Contract & Validation", () => {
  describe("uamsSyncPayloadSchema", () => {
    it("validates a compliant UAMS payload with version 1", () => {
      const valid = {
        version: 1,
        dry_run: true,
        students: [
          {
            email: "student1@summit.ac.ke",
            full_name: "Kelvin Mutua",
            registration_number: "SMU/BCS/2024/001",
            faculty: "School of Computing",
            department: "Computer Science",
            year_of_study: 2,
            campus_code: "SMU-MAIN",
          },
        ],
        course_units: [
          {
            code: "COMP 211",
            name: "Object-Oriented Analysis and Design",
            faculty: "School of Computing",
            department: "Computer Science",
            year_of_study: 2,
            semester: 1,
            credit_hours: 3,
          },
        ],
        timetables: [
          {
            course_code: "COMP 211",
            campus_code: "SMU-MAIN",
            day_of_week: 1,
            start_time: "08:30",
            end_time: "11:30",
            venue: "Computing Lab 3",
            lecturer_name: "Dr. Evans Ochieng",
            semester: 1,
            academic_year: "2026/2027",
          },
        ],
      };

      const result = uamsSyncPayloadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects an unsupported schema version", () => {
      const invalid = {
        version: 2, // Only version 1 is supported
        students: [],
        course_units: [],
        timetables: [],
      };

      const result = uamsSyncPayloadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects student with invalid email address format", () => {
      const invalid = {
        email: "not-an-email",
        full_name: "John Doe",
        registration_number: "SMU/123",
        faculty: "Science",
        department: "CS",
        year_of_study: 1,
      };

      const result = uamsStudentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects timetable entry where end_time is earlier than start_time", () => {
      const invalid = {
        course_code: "COMP 211",
        day_of_week: 1,
        start_time: "14:00",
        end_time: "10:00", // Invalid: before start_time
        venue: "Hall A",
        lecturer_name: "Prof. Catherine Ndung'u",
        semester: 1,
        academic_year: "2026/2027",
      };

      const result = uamsTimetableSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("End time must be after start time");
      }
    });

    it("rejects timetable entry with invalid day_of_week (> 7)", () => {
      const invalid = {
        course_code: "COMP 211",
        day_of_week: 9,
        start_time: "08:00",
        end_time: "10:00",
        venue: "Hall A",
        lecturer_name: "Prof. Ndung'u",
        semester: 1,
        academic_year: "2026/2027",
      };

      const result = uamsTimetableSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("validates course unit with default credit hours of 3", () => {
      const unit = {
        code: "COMP 315",
        name: "Artificial Intelligence",
        faculty: "School of Computing",
        department: "Computer Science",
        year_of_study: 3,
        semester: 1,
      };

      const result = uamsCourseUnitSchema.safeParse(unit);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.credit_hours).toBe(3);
      }
    });
  });

  describe("syncUamsDataAction dry-run execution", () => {
    it("processes valid dry_run payload and returns verified counts without writes", async () => {
      const payload = {
        version: 1,
        dry_run: true,
        students: [
          {
            email: "student.dryrun1@summit.ac.ke",
            full_name: "Student One",
            registration_number: "SMU/DRY/001",
            faculty: "School of Computing",
            department: "Computer Science",
            year_of_study: 2,
            campus_code: "SMU-MAIN",
          },
          {
            email: "student.dryrun2@summit.ac.ke",
            full_name: "Student Two",
            registration_number: "SMU/DRY/002",
            faculty: "School of Computing",
            department: "Computer Science",
            year_of_study: 2,
            campus_code: "SMU-MAIN",
          },
        ],
        course_units: [
          {
            code: "COMP 211",
            name: "Object-Oriented Analysis",
            faculty: "School of Computing",
            department: "Computer Science",
            year_of_study: 2,
            semester: 1,
            credit_hours: 3,
          },
        ],
        timetables: [],
      };

      const response = await syncUamsDataAction(payload);
      expect(response.success).toBe(true);
      expect(response.dry_run).toBe(true);
      expect(response.counts.students_processed).toBe(2);
      expect(response.counts.course_units_processed).toBe(1);
      expect(response.counts.timetables_processed).toBe(0);
      expect(response.message).toContain("Dry run completed successfully");
    });

    it("returns schema validation errors on invalid dry_run payload", async () => {
      const invalidPayload = {
        version: 1,
        dry_run: true,
        students: [
          {
            email: "invalid-email-address", // fails validation
            full_name: "",
            registration_number: "",
            faculty: "",
            department: "",
            year_of_study: 10, // out of range
          },
        ],
      };

      const response = await syncUamsDataAction(invalidPayload);
      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors?.length).toBeGreaterThan(0);
    });

    it("defaults initial_password to StudentPassword123! in uamsStudentSchema", () => {
      const student = {
        email: "student.test@summit.ac.ke",
        full_name: "Test Student",
        registration_number: "SMU/BCS/2026/001",
        faculty: "School of Computing",
        department: "Computer Science",
        year_of_study: 1,
      };

      const parsed = uamsStudentSchema.safeParse(student);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.initial_password).toBe("StudentPassword123!");
      }
    });

    it("rejects unauthenticated callers before checking roles when dry_run is false", async () => {
      const livePayload = {
        version: 1,
        dry_run: false,
        students: [],
        course_units: [],
        timetables: [],
      };

      const response = await syncUamsDataAction(livePayload);
      expect(response.success).toBe(false);
      expect(response.dry_run).toBe(false);
      expect(response.message).toContain("Unauthorized: Unauthenticated callers are rejected.");
      expect(response.errors?.[0]).toContain("Unauthenticated request");
    });
  });
});
