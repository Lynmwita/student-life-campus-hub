'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import { DigitalStudentIdCard } from '@/lib/student-id/types';
import { DEMO_STUDENT_ID_CARD } from '@/lib/student-id/demo-data';

export interface StudentIdResponse {
  success: boolean;
  card: DigitalStudentIdCard | null;
  isDemo: boolean;
  error?: string;
}

/**
 * Retrieves the authenticated student's official digital identity badge.
 * Strict per-student query ensuring student A can never view student B's ID.
 */
export async function getDigitalStudentIdAction(): Promise<StudentIdResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return {
      success: false,
      card: null,
      isDemo: false,
      error: 'Unauthorized access. Please log in to view student ID.',
    };
  }

  if (demoEmail) {
    return {
      success: true,
      card: DEMO_STUDENT_ID_CARD,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch student's profile & membership
    const { data: membership, error: memError } = await supabase
      .from('university_memberships')
      .select('university_id, role, verification_status, registration_number, faculty, department, program_of_study, campus:campuses(name)')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (memError || !membership) {
      return {
        success: false,
        card: null,
        isDemo: false,
        error: 'No active university enrollment found.',
      };
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user!.id)
      .maybeSingle();

    // Query academic records for fallback registration / programme info
    const { data: academicRow } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user!.id)
      .in('kind', ['fee_statement', 'exam_clearance'])
      .maybeSingle();

    const acadData = academicRow?.data as any;
    const studentName = profile?.full_name || 'Enrolled Student';
    const admissionNumber =
      membership.registration_number ||
      acadData?.admission_number ||
      acadData?.registration_number ||
      `REG/${user!.id.substring(0, 5).toUpperCase()}/2026`;
    const cleanAdmnNum = admissionNumber.replace(/[^A-Za-z0-9]/g, '');
    const programme = membership.program_of_study || acadData?.programme || 'Bachelor of Science in Information Technology';
    const faculty = membership.faculty || acadData?.faculty || 'School of Computing & Informatics';
    const department = membership.department || 'Department of Computer Science';
    const campusName = (membership as any)?.campus?.name || 'Main Campus';

    const card: DigitalStudentIdCard = {
      id: `card-${user!.id.substring(0, 8)}`,
      studentName,
      admissionNumber,
      programme,
      faculty,
      department,
      campusName,
      academicYear: '2026/2027',
      status: membership.verification_status === 'verified' ? 'active' : 'pending',
      issueDate: '2023-09-01',
      validUntil: 'DEC 2027',
      qrPayload: `SMU-PASS:${admissionNumber}:VERIFIED:EXP-2027`,
      libraryBarcode: `LIB${cleanAdmnNum.slice(-8)}`,
      emergencyContact: '+254 700 000 999 (Campus Security & Health)',
      isDemo: false,
    };

    return {
      success: true,
      card,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      card: null,
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query student ID badge.',
    };
  }
}
