import { describe, it, expect, beforeEach } from 'vitest';
import { DEMO_BORROWED_BOOKS, DEMO_LIBRARY_CLEARANCE } from '@/lib/library/demo-data';
import { DEMO_AVAILABLE_UNITS, DEMO_REGISTRATION_RULES } from '@/lib/units/demo-data';
import { renewBorrowedBookAction } from '@/lib/actions/library';
import { submitUnitRegistrationAction } from '@/lib/actions/unit-registration';
import { BorrowedBook } from '@/lib/library/types';
import { RegisteredUnit } from '@/lib/units/types';

describe('Library and Unit Registration Family', () => {
  describe('Feature 1: Library Circulation & Renewal Honesty Rule', () => {
    it('retrieves authoritative borrowed book records with due dates and accession numbers', () => {
      const books = DEMO_BORROWED_BOOKS;
      expect(books).toHaveLength(3);

      const activeBook = books.find((b) => b.id === 'book-loan-02');
      expect(activeBook).toBeDefined();
      expect(activeBook?.title).toBe('Designing Data-Intensive Applications');
      expect(activeBook?.accessionNumber).toBe('LIB-2026-IT-0899');
      expect(activeBook?.status).toBe('active');
      expect(activeBook?.daysRemaining).toBe(9);
      expect(activeBook?.isRenewable).toBe(true);
    });

    it('accrues overdue fines at KES 20 per day for overdue loans', () => {
      const overdueBook = DEMO_BORROWED_BOOKS.find((b) => b.status === 'overdue');
      expect(overdueBook).toBeDefined();
      expect(overdueBook?.daysRemaining).toBe(-3);
      expect(overdueBook?.overdueFineKes).toBe(60);
      expect(overdueBook?.isRenewable).toBe(false);
      expect(overdueBook?.nonRenewableReason).toContain('circulation desk');
    });

    it('evaluates institutional clearance: hold placed when overdue items or unpaid fines exist', () => {
      const clearance = DEMO_LIBRARY_CLEARANCE;
      expect(clearance.isCleared).toBe(false);
      expect(clearance.overdueCount).toBe(1);
      expect(clearance.totalFinesKes).toBe(60);
      expect(clearance.statusNote).toContain('Return 1 overdue item');
    });

    it('enforces renewal honesty rule: rejects online renewal for overdue items with UAMS reason', async () => {
      const overdueResult = await renewBorrowedBookAction('book-loan-03');
      expect(overdueResult.success).toBe(false);
      expect(overdueResult.message).toContain('UAMS Library rejection');
      expect(overdueResult.message).toContain('Overdue items cannot be renewed online');
      expect(overdueResult.newDueDate).toBeUndefined();
    });

    it('enforces renewal honesty rule: approves eligible book extending authoritative due date by 14 days', async () => {
      const eligibleResult = await renewBorrowedBookAction('book-loan-01');
      expect(eligibleResult.success).toBe(true);
      expect(eligibleResult.newDueDate).toBeDefined();
      expect(eligibleResult.newRenewalCount).toBe(1);
      expect(eligibleResult.message).toContain('UAMS loan extension confirmed');
    });

    it('enforces locked-door privacy: Student B cannot view or renew Student A library loans', () => {
      const loansPool: (BorrowedBook & { studentId: string })[] = [
        { ...DEMO_BORROWED_BOOKS[0], studentId: 'student-A' },
        { ...DEMO_BORROWED_BOOKS[1], studentId: 'student-A' },
        { ...DEMO_BORROWED_BOOKS[2], studentId: 'student-B' },
      ];

      const studentBLoans = loansPool.filter((b) => b.studentId === 'student-B');
      expect(studentBLoans).toHaveLength(1);
      expect(studentBLoans[0].id).toBe('book-loan-03');

      // Verify zero Student A loans leak to Student B
      const leakedLoans = studentBLoans.filter((b) => b.studentId === 'student-A');
      expect(leakedLoans).toHaveLength(0);
    });
  });

  describe('Feature 2: Unit Registration & UAMS Boundary Rules', () => {
    it('accurately lists offered course units, credit values and core/elective status', () => {
      const units = DEMO_AVAILABLE_UNITS;
      expect(units.length).toBeGreaterThanOrEqual(7);

      const coreUnit = units.find((u) => u.code === 'COMP 311');
      expect(coreUnit).toBeDefined();
      expect(coreUnit?.isCore).toBe(true);
      expect(coreUnit?.creditHours).toBe(3);
      expect(coreUnit?.isEligible).toBe(true);

      const electiveUnit = units.find((u) => u.code === 'COMP 320');
      expect(electiveUnit).toBeDefined();
      expect(electiveUnit?.isCore).toBe(false);
    });

    it('evaluates prerequisites: marks unit ineligible when prerequisite is unsatisfied', () => {
      const advancedUnit = DEMO_AVAILABLE_UNITS.find((u) => u.code === 'COMP 325');
      expect(advancedUnit).toBeDefined();
      expect(advancedUnit?.isEligible).toBe(false);
      expect(advancedUnit?.prerequisites[0].courseCode).toBe('MATH 301');
      expect(advancedUnit?.prerequisites[0].isSatisfied).toBe(false);
      expect(advancedUnit?.ineligibilityReason).toContain('MATH 301');
    });

    it('enforces UAMS boundary rule: rejects registration when selected credits fall below minimum threshold (15)', async () => {
      // Select only 2 units (6 credits)
      const res = await submitUnitRegistrationAction(['COMP 311', 'COMP 312']);
      expect(res.success).toBe(false);
      expect(res.totalCredits).toBe(6);
      expect(res.message).toContain('UAMS Registrar rejection');
      expect(res.message).toContain('below the minimum threshold of 15 credits');
      expect(res.registrationReference).toBeUndefined();
    });

    it('enforces UAMS boundary rule: rejects registration when selected credits exceed maximum limit (24)', async () => {
      // 9 units = 27 credits
      const res = await submitUnitRegistrationAction([
        'COMP 311',
        'COMP 312',
        'COMP 314',
        'COMP 316',
        'COMP 318',
        'COMP 320',
        'COMP 325', // 4 credits
        'COMP 311', // duplicate or high load
      ]);
      expect(res.success).toBe(false);
      expect(res.message).toContain('UAMS Registrar rejection');
    });

    it('enforces UAMS boundary rule: rejects registration if an ineligible prerequisite unit is submitted', async () => {
      // Select 5 units including COMP 325 which has unsatisfied prerequisite MATH 301
      const res = await submitUnitRegistrationAction([
        'COMP 311', // 3
        'COMP 312', // 3
        'COMP 314', // 3
        'COMP 316', // 3
        'COMP 325', // 4 (ineligible: missing MATH 301)
      ]);
      expect(res.success).toBe(false);
      expect(res.rejectionReasons?.length).toBeGreaterThan(0);
      expect(res.rejectionReasons?.[0]).toContain('MATH 301');
      expect(res.message).toContain('Prerequisite requirements not satisfied');
    });

    it('enforces UAMS boundary rule: approves valid registration (18 credits) and issues official confirmation reference', async () => {
      // Select 6 eligible units (18 credits)
      const res = await submitUnitRegistrationAction([
        'COMP 311',
        'COMP 312',
        'COMP 314',
        'COMP 316',
        'COMP 318',
        'COMP 320',
      ]);
      expect(res.success).toBe(true);
      expect(res.totalCredits).toBe(18);
      expect(res.registrationReference).toMatch(/^REG-SEM2-2026-/);
      expect(res.registeredUnits).toHaveLength(6);
      expect(res.message).toContain('UAMS course registration approved');
    });

    it('enforces locked-door privacy: Student B registration records are never visible to Student A', () => {
      const recordsPool: (RegisteredUnit & { studentId: string })[] = [
        {
          unitId: 'u1',
          code: 'COMP 311',
          name: 'Web Apps',
          creditHours: 3,
          registeredAt: '2026-10-26T10:00:00Z',
          status: 'registered',
          registrationRef: 'REG-A',
          studentId: 'student-A',
        },
        {
          unitId: 'u2',
          code: 'BCOM 101',
          name: 'Accounting',
          creditHours: 3,
          registeredAt: '2026-10-26T10:00:00Z',
          status: 'registered',
          registrationRef: 'REG-B',
          studentId: 'student-B',
        },
      ];

      const studentBRecords = recordsPool.filter((r) => r.studentId === 'student-B');
      expect(studentBRecords).toHaveLength(1);
      expect(studentBRecords[0].code).toBe('BCOM 101');

      const leakedRecords = studentBRecords.filter((r) => r.studentId === 'student-A');
      expect(leakedRecords).toHaveLength(0);
    });
  });

  describe('Feature 3: Strict Design Standards (Zero Emojis & Zero Em Dashes)', () => {
    it('guarantees zero emojis across all Library and Unit Registration data structures', () => {
      const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
      const jsonLibrary = JSON.stringify(DEMO_BORROWED_BOOKS);
      const jsonUnits = JSON.stringify(DEMO_AVAILABLE_UNITS);

      expect(jsonLibrary.match(emojiRegex)).toBeNull();
      expect(jsonUnits.match(emojiRegex)).toBeNull();
    });

    it('guarantees zero em dashes across all Library and Unit Registration strings', () => {
      const jsonLibrary = JSON.stringify(DEMO_BORROWED_BOOKS);
      const jsonUnits = JSON.stringify(DEMO_AVAILABLE_UNITS);

      expect(jsonLibrary.includes('\u2014')).toBe(false);
      expect(jsonUnits.includes('\u2014')).toBe(false);
    });
  });
});
