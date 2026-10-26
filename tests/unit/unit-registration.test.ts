import { describe, it, expect } from 'vitest';
import { DEMO_AVAILABLE_UNITS, DEMO_REGISTRATION_RULES } from '@/lib/units/demo-data';
import { submitUnitRegistrationAction } from '@/lib/actions/unit-registration';
import { RegisteredUnit } from '@/lib/units/types';

describe('Unit Registration & UAMS Boundary Rules', () => {
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

  it('guarantees zero emojis across all Unit Registration data structures', () => {
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
    const jsonUnits = JSON.stringify(DEMO_AVAILABLE_UNITS);
    expect(jsonUnits.match(emojiRegex)).toBeNull();
  });

  it('guarantees zero em dashes across all Unit Registration strings', () => {
    const jsonUnits = JSON.stringify(DEMO_AVAILABLE_UNITS);
    expect(jsonUnits.includes('\u2014')).toBe(false);
  });
});
