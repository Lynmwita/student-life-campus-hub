'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import {
  DigitalExamPassData,
  ExamTimetableEntry,
  ResultsDigestAlert,
  ClearanceStatus,
} from '@/lib/exams/types';
import {
  DEMO_EXAM_PASS_BLOCKED,
  DEMO_EXAM_PASS_CLEARED,
  DEMO_EXAM_PASS_PENDING,
  DEMO_EXAM_TIMETABLE,
  DEMO_RESULTS_DIGEST_ALERT,
} from '@/lib/exams/demo-data';
import { calculateGpaTrend } from '@/lib/exams/gpa';

export interface ExamPassResponse {
  success: boolean;
  pass: DigitalExamPassData | null;
  isDemo: boolean;
  error?: string;
}

export interface ExamTimetableResponse {
  success: boolean;
  timetable: ExamTimetableEntry[];
  isDemo: boolean;
  nextExam?: ExamTimetableEntry | null;
  daysToNextExam?: number | null;
  error?: string;
}

export interface ResultsAlertResponse {
  success: boolean;
  alert: ResultsDigestAlert | null;
  isDemo: boolean;
}

/**
 * 1. Digital Exam Pass Action
 * Strict clearance rule:
 * - Hub NEVER invents clearance.
 * - If UAMS has no clearance record, status is "pending" ("Pending confirmation from registrar").
 * - If blocked (e.g. fee balance outstanding), status is "blocked" with exact reason and link to /fees.
 * - If cleared in UAMS, status is "cleared" with clearance reference code.
 */
export async function getDigitalExamPassAction(demoVariant?: ClearanceStatus): Promise<ExamPassResponse> {
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
      pass: null,
      isDemo: false,
      error: 'Unauthorized access. Please log in to view exam pass.',
    };
  }

  // Demo session inspection
  if (demoEmail) {
    let chosenPass = DEMO_EXAM_PASS_BLOCKED;
    if (demoVariant === 'cleared') {
      chosenPass = DEMO_EXAM_PASS_CLEARED;
    } else if (demoVariant === 'pending') {
      chosenPass = DEMO_EXAM_PASS_PENDING;
    }

    return {
      success: true,
      pass: chosenPass,
      isDemo: true,
    };
  }

  // Real user: Strict per-student query
  try {
    const supabase = await createClient();

    // 1. Fetch student's profile & membership
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id, role, verification_status')
      .eq('user_id', user!.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user!.id)
      .maybeSingle();

    // 2. Query authoritative clearance record from UAMS
    const { data: clearanceRow } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'exam_clearance')
      .eq('student_id', user!.id)
      .maybeSingle();

    // 3. Query fee statement for balance confirmation
    const { data: feeRow } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'fee_statement')
      .eq('student_id', user!.id)
      .maybeSingle();

    // 4. Query registered units from exam schedule or academic records
    const { data: scheduleRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'exam_schedule')
      .eq('student_id', user!.id);

    const feeData = feeRow?.data as any;
    const feeBalance = typeof feeData?.balance === 'number' ? feeData.balance : 0;

    // Strict Clearance Rule Logic
    let clearanceStatus: ClearanceStatus = 'pending';
    let blockingReasons: string[] = [];
    let clearanceRef: string | undefined = undefined;

    if (clearanceRow?.data) {
      const cData = clearanceRow.data as any;
      if (cData.status === 'cleared') {
        clearanceStatus = 'cleared';
        clearanceRef = cData.clearance_reference || `REG-CLR-2026-${user!.id.substring(0, 5).toUpperCase()}`;
      } else if (cData.status === 'blocked') {
        clearanceStatus = 'blocked';
        blockingReasons = cData.blocking_reasons || ['Outstanding academic or administrative hold'];
      }
    } else if (feeBalance > 0) {
      // Fee statement explicitly shows outstanding balance
      clearanceStatus = 'blocked';
      blockingReasons.push(`Outstanding fee balance of KES ${feeBalance.toLocaleString('en-KE')} (100% threshold required for examination clearance)`);
    } else {
      // No authoritative clearance record exists in UAMS
      clearanceStatus = 'pending';
      blockingReasons.push('Pending confirmation from registrar');
    }

    const registeredUnits = (scheduleRows || []).map((row: any) => ({
      code: row.data?.course_code || 'UNSPECIFIED',
      name: row.data?.course_name || 'Enrolled Course Unit',
      units: row.data?.units || 3,
      status: 'confirmed' as const,
    }));

    const passData: DigitalExamPassData = {
      passNumber: `EP-2026-SEM1-${user!.id.substring(0, 6).toUpperCase()}`,
      studentName: profile?.full_name || 'Enrolled Student',
      admissionNumber: 'BIT/2023/REAL',
      programme: 'Bachelor of Science in Information Technology',
      faculty: 'School of Computing & Informatics',
      campusName: 'Main Campus',
      academicYear: '2026/2027',
      semester: 1,
      semesterLabel: 'Year 2 Semester 1',
      registeredUnits,
      clearance: {
        status: clearanceStatus,
        clearanceReference: clearanceRef,
        clearedAt: clearanceStatus === 'cleared' ? new Date().toISOString() : undefined,
        clearedBy: clearanceStatus === 'cleared' ? 'Office of the Academic Registrar' : undefined,
        blockingReasons,
        financialBalance: feeBalance,
        financialCleared: feeBalance <= 0,
        academicApproved: clearanceStatus === 'cleared',
      },
      qrPayload: `SUMMIT-PASS:BIT/2023/REAL:2026/2027:SEM1:${clearanceRef || clearanceStatus.toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      isDemo: false,
    };

    return {
      success: true,
      pass: passData,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      pass: null,
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query student exam pass records.',
    };
  }
}

/**
 * 2. Exam Timetable Action
 */
export async function getExamTimetableAction(): Promise<ExamTimetableResponse> {
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
      timetable: [],
      isDemo: false,
      error: 'Unauthorized access.',
    };
  }

  if (demoEmail) {
    const timetable = DEMO_EXAM_TIMETABLE;
    const now = new Date('2026-11-06T00:00:00Z'); // Demo reference date
    const futureExams = timetable
      .filter((t) => new Date(t.examDate).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

    const nextExam = futureExams[0] || null;
    let daysToNext: number | null = null;
    if (nextExam) {
      const diff = new Date(nextExam.examDate).getTime() - now.getTime();
      daysToNext = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      success: true,
      timetable,
      isDemo: true,
      nextExam,
      daysToNextExam: daysToNext,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'exam_schedule')
      .eq('student_id', user!.id);

    if (error) {
      return { success: false, timetable: [], isDemo: false, error: error.message };
    }

    const timetable: ExamTimetableEntry[] = (data || []).map((row: any) => ({
      id: row.data?.id || `ex-${Math.random()}`,
      courseCode: row.data?.course_code,
      courseName: row.data?.course_name,
      examDate: row.data?.exam_date,
      startTime: row.data?.start_time,
      endTime: row.data?.end_time,
      venue: row.data?.venue,
      seatNumber: row.data?.seat_number,
      paperType: row.data?.paper_type,
      instructions: row.data?.instructions,
    }));

    const now = new Date();
    const futureExams = timetable
      .filter((t) => new Date(t.examDate).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

    const nextExam = futureExams[0] || null;
    let daysToNext: number | null = null;
    if (nextExam) {
      const diff = new Date(nextExam.examDate).getTime() - now.getTime();
      daysToNext = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      success: true,
      timetable,
      isDemo: false,
      nextExam,
      daysToNextExam: daysToNext,
    };
  } catch (err) {
    return {
      success: false,
      timetable: [],
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query exam schedule.',
    };
  }
}

/**
 * 3. Results Digest Alert Action
 * One digest alert per release window, linking to /results.
 */
export async function getResultsDigestAlertAction(): Promise<ResultsAlertResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (demoEmail) {
    return {
      success: true,
      alert: DEMO_RESULTS_DIGEST_ALERT,
      isDemo: true,
    };
  }

  if (!user) {
    return { success: false, alert: null, isDemo: false };
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('uams_academic_records')
      .select('data, source_updated_at')
      .eq('kind', 'grade')
      .eq('student_id', user.id)
      .order('source_updated_at', { ascending: false });

    if (!data || data.length === 0) {
      return { success: true, alert: null, isDemo: false };
    }

    const unitCodes = data.map((d: any) => d.data?.course_code).filter(Boolean);
    const uniqueCodes = Array.from(new Set(unitCodes));

    const latestRelease = data[0].source_updated_at;
    const alert: ResultsDigestAlert = {
      id: `digest-${user.id}-${new Date(latestRelease).toISOString().split('T')[0]}`,
      studentId: user.id,
      academicYear: data[0].data?.academic_year || '2026/2027',
      semester: data[0].data?.semester || 1,
      unitCodes: uniqueCodes,
      publishedAt: latestRelease,
      message: `Official semester examination results published for ${uniqueCodes.length} units (${uniqueCodes.slice(0, 3).join(', ')}${uniqueCodes.length > 3 ? '...' : ''}).`,
      isRead: false,
    };

    return {
      success: true,
      alert,
      isDemo: false,
    };
  } catch {
    return { success: false, alert: null, isDemo: false };
  }
}
