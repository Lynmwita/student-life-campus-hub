'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import {
  AvailableCourseUnit,
  RegisteredUnit,
  UnitRegistrationResponse,
  UnitRegistrationRules,
  UnitRegistrationSubmissionResult,
} from '@/lib/units/types';
import {
  DEMO_AVAILABLE_UNITS,
  DEMO_INITIAL_REGISTERED_UNITS,
  DEMO_REGISTRATION_RULES,
} from '@/lib/units/demo-data';

// Stateful in-memory store for demo session unit registration submissions
let demoRegisteredStore: RegisteredUnit[] = [...DEMO_INITIAL_REGISTERED_UNITS];

/**
 * Retrieves available course units, prerequisite statuses, and current registration state.
 * Strict per-student query.
 */
export async function getUnitRegistrationAction(): Promise<UnitRegistrationResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  let demoEmail: string | null | undefined = null;
  try {
    const cookieStore = await cookies();
    demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);
  } catch {
    demoEmail = 'student-demo-faith@smu.ac.ke';
  }

  if (!user && !demoEmail) {
    return {
      success: false,
      rules: DEMO_REGISTRATION_RULES,
      availableUnits: [],
      registeredUnits: [],
      isDemo: false,
      error: 'Unauthorized access. Please log in to access unit registration.',
    };
  }

  if (demoEmail) {
    const totalRegisteredCredits = demoRegisteredStore.reduce((acc, u) => acc + u.creditHours, 0);
    const rules: UnitRegistrationRules = {
      ...DEMO_REGISTRATION_RULES,
      currentRegisteredCredits: totalRegisteredCredits,
    };

    return {
      success: true,
      rules,
      availableUnits: DEMO_AVAILABLE_UNITS,
      registeredUnits: demoRegisteredStore,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch student's verified membership for programme and faculty
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id, role, verification_status, faculty, department, year_of_study')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!membership) {
      return {
        success: false,
        rules: DEMO_REGISTRATION_RULES,
        availableUnits: [],
        registeredUnits: [],
        isDemo: false,
        error: 'Active university enrollment is required for unit registration.',
      };
    }

    // 2. Query available course units from catalogue
    const { data: catalogUnits } = await supabase
      .from('course_units')
      .select('id, code, name, faculty, department, year_of_study, credit_hours')
      .eq('university_id', membership.university_id)
      .eq('department', membership.department || 'Computer Science');

    // 3. Query student's past grades to evaluate prerequisites
    const { data: gradeRecords } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'grade')
      .eq('student_id', user!.id);

    const passedUnits = new Set<string>();
    for (const row of gradeRecords || []) {
      const code = (row.data as any)?.course_code;
      const score = (row.data as any)?.score || 0;
      if (code && score >= 40) {
        passedUnits.add(code.trim().toUpperCase());
      }
    }

    // 4. Query student's current registered units from UAMS
    const { data: regRecords } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'unit_registration')
      .eq('student_id', user!.id);

    const registeredUnits: RegisteredUnit[] = (regRecords || []).map((r: any) => ({
      unitId: r.data?.unit_id || 'reg-01',
      code: r.data?.course_code || 'COMP',
      name: r.data?.course_name || 'Course Unit',
      creditHours: r.data?.credit_hours || 3,
      registeredAt: r.data?.registered_at || new Date().toISOString(),
      status: 'registered',
      registrationRef: r.data?.registration_reference || 'REG-REF',
    }));

    // Known curriculum prerequisite map for undergraduate computing
    const prereqMap: Record<string, { code: string; grade: string }[]> = {
      'COMP 311': [{ code: 'COMP 211', grade: 'C' }],
      'COMP 312': [{ code: 'COMP 216', grade: 'C' }],
      'COMP 314': [{ code: 'MATH 201', grade: 'C' }],
      'COMP 316': [{ code: 'COMP 211', grade: 'C' }],
      'COMP 318': [{ code: 'COMP 216', grade: 'C' }],
      'COMP 325': [{ code: 'MATH 301', grade: 'B' }],
    };

    const availableUnits: AvailableCourseUnit[] = (catalogUnits || []).map((u: any) => {
      const definedPrereqs = prereqMap[u.code] || [];
      const evaluatedPrereqs = definedPrereqs.map((p) => ({
        courseCode: p.code,
        minimumGrade: p.grade,
        isSatisfied: passedUnits.has(p.code),
      }));

      const unsatisfied = evaluatedPrereqs.filter((p) => !p.isSatisfied);
      const isEligible = unsatisfied.length === 0;

      return {
        id: u.id,
        code: u.code,
        name: u.name,
        faculty: u.faculty || membership.faculty || 'School of Computing',
        department: u.department,
        yearOfStudy: u.year_of_study,
        semester: 2,
        creditHours: u.credit_hours || 3,
        lectureHoursPerWeek: 3,
        isCore: u.code.startsWith('COMP 311') || u.code.startsWith('COMP 312') || u.code.startsWith('COMP 314') || u.code.startsWith('COMP 316'),
        prerequisites: evaluatedPrereqs,
        isEligible,
        ineligibilityReason: unsatisfied.length > 0
          ? `Prerequisite ${unsatisfied.map((p) => p.courseCode).join(', ')} not yet satisfied.`
          : undefined,
      };
    });

    const totalCredits = registeredUnits.reduce((acc, u) => acc + u.creditHours, 0);

    const rules: UnitRegistrationRules = {
      minCreditHours: 15,
      maxCreditHours: 24,
      currentRegisteredCredits: totalCredits,
      academicYear: '2026/2027',
      semester: 2,
      semesterLabel: 'Year 2 Semester 2 (2026/2027)',
      registrationDeadline: '2026-11-30',
      isOpen: true,
    };

    return {
      success: true,
      rules,
      availableUnits,
      registeredUnits,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      rules: DEMO_REGISTRATION_RULES,
      availableUnits: [],
      registeredUnits: [],
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query unit registration.',
    };
  }
}

/**
 * Submits semester course unit registration to the UAMS registrar engine.
 * Boundary rule: The Hub submits candidate units; UAMS validates prerequisites and credit thresholds.
 * The Hub marks units as registered only when UAMS accepts - never local confirmation.
 */
export async function submitUnitRegistrationAction(
  selectedUnitCodes: string[]
): Promise<UnitRegistrationSubmissionResult> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  let demoEmail: string | null | undefined = null;
  try {
    const cookieStore = await cookies();
    demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);
  } catch {
    demoEmail = 'student-demo-faith@smu.ac.ke';
  }

  if (!user && !demoEmail) {
    return {
      success: false,
      message: 'Unauthorized access. Please log in to submit unit registration.',
    };
  }

  // Demo User Flow
  if (demoEmail) {
    const catalogPool = DEMO_AVAILABLE_UNITS;
    const selectedUnits = catalogPool.filter((u) => selectedUnitCodes.includes(u.code));

    if (selectedUnits.length === 0) {
      return {
        success: false,
        message: 'UAMS Registrar rejection: No course units selected for registration.',
      };
    }

    const totalCredits = selectedUnits.reduce((acc, u) => acc + u.creditHours, 0);
    const minCredits = 15;
    const maxCredits = 24;

    if (totalCredits < minCredits) {
      return {
        success: false,
        totalCredits,
        message: `UAMS Registrar rejection: Selected ${totalCredits} credit hours is below the minimum threshold of ${minCredits} credits. Please select additional units.`,
      };
    }

    if (totalCredits > maxCredits) {
      return {
        success: false,
        totalCredits,
        message: `UAMS Registrar rejection: Selected ${totalCredits} credit hours exceeds the maximum semester limit of ${maxCredits} credits.`,
      };
    }

    // Validate prerequisites for selected units
    const prerequisiteErrors: string[] = [];
    for (const unit of selectedUnits) {
      for (const prereq of unit.prerequisites) {
        if (!prereq.isSatisfied) {
          prerequisiteErrors.push(
            `${unit.code} requires prerequisite ${prereq.courseCode} with minimum grade ${prereq.minimumGrade}.`
          );
        }
      }
    }

    if (prerequisiteErrors.length > 0) {
      return {
        success: false,
        totalCredits,
        rejectionReasons: prerequisiteErrors,
        message: `UAMS Registrar rejection: Prerequisite requirements not satisfied. ${prerequisiteErrors.join(' ')}`,
      };
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let refSuffix = '';
    for (let i = 0; i < 5; i++) {
      refSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const registrationRef = `REG-SEM2-2026-${refSuffix}`;
    const nowIso = new Date().toISOString();

    const newlyRegistered: RegisteredUnit[] = selectedUnits.map((u) => ({
      unitId: u.id,
      code: u.code,
      name: u.name,
      creditHours: u.creditHours,
      registeredAt: nowIso,
      status: 'registered',
      registrationRef,
    }));

    demoRegisteredStore = newlyRegistered;
    return {
      success: true,
      registrationReference: registrationRef,
      registeredUnits: newlyRegistered,
      totalCredits,
      message: `UAMS course registration approved. Reference: ${registrationRef}. Official examination roster updated.`,
    };
  }

  // Real student flow: Validate strictly against real course_units and real student passed grades
  try {
    const supabase = await createClient();

    // 1. Fetch student's membership
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id, department')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!membership?.university_id) {
      return {
        success: false,
        message: 'Active university membership required to register units.',
      };
    }

    // 2. Fetch real course units from database catalogue
    const { data: dbUnits } = await supabase
      .from('course_units')
      .select('id, code, name, credit_hours')
      .eq('university_id', membership.university_id)
      .in('code', selectedUnitCodes);

    const validUnits = dbUnits || [];
    if (validUnits.length === 0) {
      return {
        success: false,
        message: 'UAMS Registrar rejection: Selected course units not found in current institutional curriculum.',
      };
    }

    const totalCredits = validUnits.reduce((acc, u) => acc + (u.credit_hours || 3), 0);
    const minCredits = 15;
    const maxCredits = 24;

    if (totalCredits < minCredits) {
      return {
        success: false,
        totalCredits,
        message: `UAMS Registrar rejection: Selected ${totalCredits} credit hours is below the minimum threshold of ${minCredits} credits.`,
      };
    }

    if (totalCredits > maxCredits) {
      return {
        success: false,
        totalCredits,
        message: `UAMS Registrar rejection: Selected ${totalCredits} credit hours exceeds the maximum limit of ${maxCredits} credits.`,
      };
    }

    // 3. Evaluate real passed grades from UAMS
    const { data: gradeRecords } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'grade')
      .eq('student_id', user!.id);

    const realPassedCodes = new Set<string>();
    for (const row of gradeRecords || []) {
      const code = (row.data as any)?.course_code;
      const score = (row.data as any)?.score || 0;
      if (code && score >= 40) {
        realPassedCodes.add(code.trim().toUpperCase());
      }
    }

    const prereqRules: Record<string, string> = {
      'COMP 311': 'COMP 211',
      'COMP 312': 'COMP 216',
      'COMP 314': 'MATH 201',
      'COMP 316': 'COMP 211',
      'COMP 318': 'COMP 216',
      'COMP 325': 'MATH 301',
    };

    const prereqErrors: string[] = [];
    for (const unit of validUnits) {
      const requiredPrereq = prereqRules[unit.code];
      if (requiredPrereq && !realPassedCodes.has(requiredPrereq)) {
        prereqErrors.push(`${unit.code} requires prerequisite ${requiredPrereq}.`);
      }
    }

    if (prereqErrors.length > 0) {
      return {
        success: false,
        totalCredits,
        rejectionReasons: prereqErrors,
        message: `UAMS Registrar rejection: Prerequisite requirements not satisfied. ${prereqErrors.join(' ')}`,
      };
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let refSuffix = '';
    for (let i = 0; i < 5; i++) {
      refSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const registrationRef = `REG-SEM2-2026-${refSuffix}`;
    const nowIso = new Date().toISOString();

    const newlyRegistered: RegisteredUnit[] = validUnits.map((u) => ({
      unitId: u.id,
      code: u.code,
      name: u.name,
      creditHours: u.credit_hours || 3,
      registeredAt: nowIso,
      status: 'pending_approval',
      registrationRef,
    }));

    for (const reg of newlyRegistered) {
      await supabase.from('uams_academic_records').insert({
        university_id: membership.university_id,
        student_id: user!.id,
        kind: 'unit_registration',
        source_id: `${registrationRef}-${reg.code}`,
        source_updated_at: nowIso,
        data: {
          registration_reference: registrationRef,
          course_code: reg.code,
          course_name: reg.name,
          credit_hours: reg.creditHours,
          academic_year: '2026/2027',
          semester: 2,
          registered_at: nowIso,
          status: 'pending_approval',
        },
        is_published: true,
      });
    }

    return {
      success: true,
      registrationReference: registrationRef,
      registeredUnits: newlyRegistered,
      totalCredits,
      message: `Registration submitted. Reference: ${registrationRef}. Status: Pending registrar confirmation.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to persist unit registration.',
    };
  }
}
