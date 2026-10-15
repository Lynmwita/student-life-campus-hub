import { describe, it, expect } from "vitest";
import {
  courseUnitSchema,
  timetableSchema,
  clubSchema,
  eventSchema,
} from "@/lib/validations/academics";

describe("Phase 5 Academics & Campus Life Validation Schemas", () => {
  describe("courseUnitSchema", () => {
    it("validates a standard computer science course unit", () => {
      const valid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        code: "COMP 211",
        name: "Object-Oriented Analysis & Design",
        faculty: "School of Computing & Informatics",
        department: "Computer Science",
        yearOfStudy: 2,
        semester: 1,
        creditHours: 3,
      };
      const result = courseUnitSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid year of study (> 7)", () => {
      const invalid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        code: "COMP 211",
        name: "Object-Oriented Analysis",
        faculty: "School of Computing",
        department: "Computer Science",
        yearOfStudy: 8,
        semester: 1,
      };
      const result = courseUnitSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("timetableSchema", () => {
    it("validates valid lecture schedule with correct time ordering", () => {
      const valid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        campusId: "00000000-0000-0000-0000-000000000011",
        courseUnitId: "40000000-0000-0000-0000-000000000001",
        dayOfWeek: 1, // Monday
        startTime: "08:30",
        endTime: "11:30",
        venue: "Computing Lab 3",
        lecturerName: "Dr. Evans Ochieng",
        semester: 1,
        academicYear: "2026/2027",
      };
      const result = timetableSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects timetable entry where end time is before or equal to start time", () => {
      const invalid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        courseUnitId: "40000000-0000-0000-0000-000000000001",
        dayOfWeek: 1,
        startTime: "14:00",
        endTime: "11:00",
        venue: "Lecture Hall 4B",
        lecturerName: "Prof. Catherine Ndung'u",
        semester: 1,
        academicYear: "2026/2027",
      };
      const result = timetableSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("End time must be after start time");
      }
    });

    it("rejects invalid day of week (> 7)", () => {
      const invalid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        courseUnitId: "40000000-0000-0000-0000-000000000001",
        dayOfWeek: 8,
        startTime: "09:00",
        endTime: "12:00",
        venue: "Lab 2",
        lecturerName: "Dr. Kamau",
        semester: 1,
        academicYear: "2026/2027",
      };
      const result = timetableSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("clubSchema", () => {
    it("validates a recognized student club with lowercase slug", () => {
      const valid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        name: "SMU Tech Innovators & GDSC",
        slug: "smu-tech-innovators",
        description: "Student developer community focusing on web, mobile, AI, and open-source software solutions.",
        category: "technology",
        patronName: "Dr. Evans Ochieng",
      };
      const result = clubSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid club category", () => {
      const invalid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        name: "Test Club",
        slug: "test-club",
        description: "A test student club for testing invalid categories.",
        category: "invalid_category",
      };
      const result = clubSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("eventSchema", () => {
    it("validates a campus hackathon event", () => {
      const valid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        campusId: "00000000-0000-0000-0000-000000000011",
        clubId: "40000000-0000-0000-0000-000000000201",
        title: "Annual Inter-Campus Hackathon 2026",
        description: "A 48-hour buildathon addressing fintech and civic tech challenges across universities.",
        venue: "Main Auditorium & Innovation Lab",
        eventDate: "2026-10-24",
        startTime: "08:00",
        endTime: "18:00",
        category: "hackathon",
      };
      const result = eventSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid date format", () => {
      const invalid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        title: "Event",
        description: "Valid event description over 10 chars",
        venue: "Hall 1",
        eventDate: "24-10-2026", // Wrong format
        startTime: "09:00",
        category: "social",
      };
      const result = eventSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
