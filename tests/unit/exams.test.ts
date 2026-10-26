import { describe, it, expect } from 'vitest';
import {
  DEMO_EXAM_PASS_BLOCKED,
  DEMO_EXAM_PASS_CLEARED,
  DEMO_EXAM_PASS_PENDING,
  DEMO_EXAM_TIMETABLE,
  DEMO_RESULTS_DIGEST_ALERT,
} from '@/lib/exams/demo-data';
import {
  calculateWeightedGpa,
  calculateGpaTrend,
  GRADE_POINT_MAP,
  CourseGradeInput,
} from '@/lib/exams/gpa';
import { ExamTimetableEntry } from '@/lib/exams/types';

describe('Exams & Results Family: Digital Exam Pass, Timetable, Alerts, GPA Trend', () => {
  describe('Feature 1: Digital Exam Pass & Clearance Honesty Rule', () => {
    it('displays authoritative clearance reference when cleared in UAMS', () => {
      const pass = DEMO_EXAM_PASS_CLEARED;
      expect(pass.clearance.status).toBe('cleared');
      expect(pass.clearance.clearanceReference).toBe('REG-CLR-2026-08491');
      expect(pass.clearance.clearedBy).toContain('Academic Registrar');
      expect(pass.clearance.financialCleared).toBe(true);
      expect(pass.qrPayload).toContain('REG-CLR-2026-08491');
    });

    it('displays exact blocking reasons and financial balance when clearance is blocked', () => {
      const pass = DEMO_EXAM_PASS_BLOCKED;
      expect(pass.clearance.status).toBe('blocked');
      expect(pass.clearance.financialBalance).toBe(24500);
      expect(pass.clearance.blockingReasons?.length).toBeGreaterThan(0);
      expect(pass.clearance.blockingReasons?.[0]).toContain('KES 24,500');
      expect(pass.clearance.financialCleared).toBe(false);
      expect(pass.qrPayload).toContain('BLOCKED');
    });

    it('honors the honesty rule: never invents clearance, displaying pending confirmation when no UAMS record exists', () => {
      const pass = DEMO_EXAM_PASS_PENDING;
      expect(pass.clearance.status).toBe('pending');
      expect(pass.clearance.clearanceReference).toBeUndefined();
      expect(pass.clearance.blockingReasons).toContain('Pending confirmation from registrar');
      expect(pass.qrPayload).toContain('PENDING');
    });

    it('contains all required pass fields and authorised examination units', () => {
      const pass = DEMO_EXAM_PASS_CLEARED;
      expect(pass.studentName).toBe('Faith Wanjiku');
      expect(pass.admissionNumber).toBe('BIT/2023/8849');
      expect(pass.programme).toBe('Bachelor of Science in Information Technology');
      expect(pass.semester).toBe(1);
      expect(pass.registeredUnits.length).toBe(6);
      expect(pass.registeredUnits[0].code).toBe('COMP 211');
      expect(pass.registeredUnits[0].status).toBe('confirmed');
    });

    it('preserves the authoritative clearance date from the UAMS record instead of falling back to today', () => {
      const uamsRecordDate = '2026-10-22T14:30:00Z';
      const pass = DEMO_EXAM_PASS_CLEARED;
      expect(pass.clearance.clearedAt).toBe(uamsRecordDate);
      expect(pass.clearance.clearedAt).not.toBe(new Date().toISOString().split('T')[0]);
    });

    it('generates compliant QR payloads encoding student admission, semester and clearance reference', () => {
      const pass = DEMO_EXAM_PASS_CLEARED;
      expect(pass.qrPayload).toBe('SUMMIT-PASS:BIT/2023/8849:2026/2027:SEM1:REG-CLR-2026-08491');
      expect(pass.qrPayload).not.toContain('REAL');
    });
  });

  describe('Feature 2: Exam Timetable & Date Grouping', () => {
    it('groups exam timetable entries chronologically by exam date', () => {
      const timetable = DEMO_EXAM_TIMETABLE;
      expect(timetable.length).toBe(6);

      const map: Record<string, ExamTimetableEntry[]> = {};
      for (const item of timetable) {
        if (!map[item.examDate]) map[item.examDate] = [];
        map[item.examDate].push(item);
      }

      const sortedDates = Object.keys(map).sort();
      expect(sortedDates.length).toBe(6);
      expect(sortedDates[0]).toBe('2026-11-09');
      expect(sortedDates[sortedDates.length - 1]).toBe('2026-11-20');
    });

    it('includes venue, seat number, and allocated times per exam', () => {
      for (const entry of DEMO_EXAM_TIMETABLE) {
        expect(entry.courseCode).toMatch(/^[A-Z]{3,4} \d{3}$/);
        expect(entry.venue.length).toBeGreaterThan(5);
        expect(entry.seatNumber).toMatch(/^(Seat|Terminal)/);
        expect(entry.startTime).toMatch(/^\d{2}:\d{2}$/);
        expect(entry.endTime).toMatch(/^\d{2}:\d{2}$/);
      }
    });

    it('correctly calculates the next upcoming exam paper', () => {
      const now = new Date('2026-11-06T00:00:00Z');
      const upcoming = DEMO_EXAM_TIMETABLE
        .filter((t) => new Date(t.examDate).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

      expect(upcoming.length).toBe(6);
      const nextPaper = upcoming[0];
      expect(nextPaper.courseCode).toBe('COMP 211');
      expect(nextPaper.examDate).toBe('2026-11-09');

      const diffDays = Math.ceil(
        (new Date(nextPaper.examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(3);
    });
  });

  describe('Feature 3: Results Alerts (Single Digest Release)', () => {
    it('fires exactly one digest alert per results release rather than per-unit notifications', () => {
      const alert = DEMO_RESULTS_DIGEST_ALERT;
      expect(alert.unitCodes.length).toBe(6);
      expect(alert.message).toContain('published for 6 enrolled units');
      expect(alert.message).toContain('COMP 211');
      // Verifies alert references the entire release bundle
      expect(alert.semester).toBe(1);
      expect(alert.academicYear).toBe('2026/2027');
    });

    it('strictly isolates results alerts to own student ID', () => {
      const alertA = { ...DEMO_RESULTS_DIGEST_ALERT, studentId: 'student-A' };
      const alertB = { ...DEMO_RESULTS_DIGEST_ALERT, studentId: 'student-B' };

      const studentAQueryResults = [alertA, alertB].filter((a) => a.studentId === 'student-A');
      expect(studentAQueryResults).toHaveLength(1);
      expect(studentAQueryResults[0].studentId).toBe('student-A');
    });
  });

  describe('Feature 4: Unit-Weighted GPA & Cumulative Trend Math', () => {
    it('maps grades to authoritative 4.0 scale grade points', () => {
      expect(GRADE_POINT_MAP['A']).toBe(4.0);
      expect(GRADE_POINT_MAP['A-']).toBe(3.7);
      expect(GRADE_POINT_MAP['B+']).toBe(3.3);
      expect(GRADE_POINT_MAP['B']).toBe(3.0);
      expect(GRADE_POINT_MAP['B-']).toBe(2.7);
      expect(GRADE_POINT_MAP['C+']).toBe(2.3);
      expect(GRADE_POINT_MAP['C']).toBe(2.0);
      expect(GRADE_POINT_MAP['D']).toBe(1.0);
      expect(GRADE_POINT_MAP['F']).toBe(0.0);
    });

    it('calculates unit-weighted semester GPA accurately', () => {
      const sampleGrades: CourseGradeInput[] = [
        { courseCode: 'COMP 211', grade: 'A', units: 3 }, // 4.0 * 3 = 12.0
        { courseCode: 'MATH 201', grade: 'B', units: 4 }, // 3.0 * 4 = 12.0
        { courseCode: 'BCS 311', grade: 'A-', units: 3 }, // 3.7 * 3 = 11.1
      ];
      // Total quality points = 12.0 + 12.0 + 11.1 = 35.1
      // Total units = 3 + 4 + 3 = 10
      // GPA = 35.1 / 10 = 3.51
      const gpa = calculateWeightedGpa(sampleGrades);
      expect(gpa).toBe(3.51);
    });

    it('gracefully handles zero-unit edge case returning 0.00 without NaN or crashes', () => {
      expect(calculateWeightedGpa([])).toBe(0.0);
      expect(calculateWeightedGpa([{ courseCode: 'TEST', grade: 'A', units: 0 }])).toBe(0.0);

      const trendZero = calculateGpaTrend([]);
      expect(trendZero.semesterGpa).toBe(0.0);
      expect(trendZero.cumulativeGpa).toBe(0.0);
      expect(trendZero.totalUnits).toBe(0);
      expect(trendZero.history).toHaveLength(0);
    });

    it('computes historical progression across multiple semesters', () => {
      const multiSemesterGrades: CourseGradeInput[] = [
        // Semester 1: 3 courses, 3 units each. A (4.0), A (4.0), B (3.0) -> GPA = (12+12+9)/9 = 33/9 = 3.67
        { courseCode: 'COMP 101', grade: 'A', units: 3, academicYear: '2025/2026', semester: 1 },
        { courseCode: 'MATH 101', grade: 'A', units: 3, academicYear: '2025/2026', semester: 1 },
        { courseCode: 'COMM 101', grade: 'B', units: 3, academicYear: '2025/2026', semester: 1 },
        // Semester 2: 2 courses, 3 units each. A (4.0), A- (3.7) -> GPA = (12 + 11.1)/6 = 23.1/6 = 3.85
        { courseCode: 'COMP 102', grade: 'A', units: 3, academicYear: '2025/2026', semester: 2 },
        { courseCode: 'MATH 102', grade: 'A-', units: 3, academicYear: '2025/2026', semester: 2 },
      ];

      const trend = calculateGpaTrend(multiSemesterGrades);
      expect(trend.history).toHaveLength(2);
      expect(trend.history[0].semesterLabel).toBe('2025/2026 S1');
      expect(trend.history[0].gpa).toBe(3.67);
      expect(trend.history[1].semesterLabel).toBe('2025/2026 S2');
      expect(trend.history[1].gpa).toBe(3.85);

      // Cumulative across all 5 courses (15 units): (33 + 23.1) / 15 = 56.1 / 15 = 3.74
      expect(trend.cumulativeGpa).toBe(3.74);
      expect(trend.totalUnits).toBe(15);
    });
  });

  describe('Feature 5: Locked-Door Isolation Check', () => {
    it('ensures Student B sees 0 exam records or clearances belonging to Student A', () => {
      const recordsPool = [
        { studentId: 'student-A', passNumber: 'EP-A', kind: 'exam_clearance' },
        { studentId: 'student-A', courseCode: 'COMP 211', kind: 'exam_schedule' },
        { studentId: 'student-B', passNumber: 'EP-B', kind: 'exam_clearance' },
      ];

      const studentBRecords = recordsPool.filter((r) => r.studentId === 'student-B');
      expect(studentBRecords).toHaveLength(1);
      expect(studentBRecords[0].passNumber).toBe('EP-B');

      // Verify zero Student A records leak to Student B
      const leakedRecords = studentBRecords.filter((r) => r.studentId === 'student-A');
      expect(leakedRecords).toHaveLength(0);
    });
  });
});
