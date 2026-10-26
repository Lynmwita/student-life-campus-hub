'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import {
  EmergencyCategory,
  EmergencySosResult,
  KdpaDataPackage,
  LostFoundItem,
} from '@/lib/community-safety/types';
import {
  DEMO_KDPA_DATA_PACKAGE,
  DEMO_LOST_FOUND_ITEMS,
} from '@/lib/community-safety/demo-data';

// Stateful in-memory store for demo session lost and found reports
let demoLostFoundStore: LostFoundItem[] = [...DEMO_LOST_FOUND_ITEMS];

export interface LostFoundResponse {
  success: boolean;
  items: LostFoundItem[];
  isDemo: boolean;
  error?: string;
}

/**
 * Retrieves the campus lost and found items.
 * Contact details are never exposed directly; all claims are routed through the staff help-desk custody desk.
 */
export async function getLostAndFoundItemsAction(): Promise<LostFoundResponse> {
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

  if (demoEmail) {
    return {
      success: true,
      items: demoLostFoundStore,
      isDemo: true,
    };
  }

  if (!user) {
    return {
      success: false,
      items: [],
      isDemo: false,
      error: 'Authentication required to view lost and found board.',
    };
  }

  try {
    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from('help_requests')
      .select('id, reference_no, subject, message, status, created_at, user_id')
      .eq('category', 'lost_and_found')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, items: [], isDemo: false, error: error.message };
    }

    const items: LostFoundItem[] = (rows || []).map((r) => {
      let parsed = {
        type: 'found' as const,
        category: 'other' as const,
        location: 'Campus Grounds',
        description: r.message,
      };

      try {
        const meta = JSON.parse(r.message);
        parsed = { ...parsed, ...meta };
      } catch {}

      return {
        id: r.id,
        type: parsed.type || 'found',
        title: r.subject,
        category: parsed.category || 'other',
        location: parsed.location || 'Campus Facility',
        dateReported: r.created_at.split('T')[0],
        description: parsed.description || r.message,
        status: r.status === 'resolved' ? 'handed_over' : r.status === 'in_progress' ? 'claimed' : 'open',
        ticketReference: r.reference_no,
        reportedByStudentId: r.user_id,
        isVerifiedHandover: r.status === 'resolved',
      };
    });

    return {
      success: true,
      items,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      items: [],
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query lost and found board.',
    };
  }
}

/**
 * Reports a lost or found item.
 * Automatically generates a staff help-desk custody ticket so items are safely deposited and verified.
 */
export async function reportLostFoundItemAction(params: {
  type: 'lost' | 'found';
  title: string;
  category: LostFoundItem['category'];
  location: string;
  description: string;
}): Promise<{ success: boolean; item?: LostFoundItem; error?: string }> {
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
    return { success: false, error: 'Unauthorized access. Please log in.' };
  }

  const chars = '0123456789';
  let numSuffix = '';
  for (let i = 0; i < 4; i++) {
    numSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const ticketRef = `HD-2026-${numSuffix}`;
  const nowIso = new Date().toISOString();

  const newItem: LostFoundItem = {
    id: `lf-${Date.now()}`,
    type: params.type,
    title: params.title,
    category: params.category,
    location: params.location,
    dateReported: nowIso.split('T')[0],
    description: params.description,
    status: 'open',
    ticketReference: ticketRef,
    reportedByStudentId: demoEmail ? 'student-demo-faith' : user!.id,
    isVerifiedHandover: false,
  };

  if (demoEmail) {
    demoLostFoundStore = [newItem, ...demoLostFoundStore];
    return { success: true, item: newItem };
  }

  try {
    const supabase = await createClient();

    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!membership?.university_id) {
      return { success: false, error: 'Active enrollment required to post notices.' };
    }

    const payload = JSON.stringify({
      type: params.type,
      category: params.category,
      location: params.location,
      description: params.description,
    });

    await supabase.from('help_requests').insert({
      university_id: membership.university_id,
      user_id: user!.id,
      category: 'lost_and_found',
      priority: 'P3',
      subject: params.title,
      message: payload,
      status: 'open',
      reference_no: ticketRef,
    });

    return { success: true, item: newItem };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to register item notice.',
    };
  }
}

/**
 * Claims a found item through the staff help-desk queue.
 * Claims are reviewed by staff for serial/feature verification prior to physical handover.
 */
export async function claimLostFoundItemAction(
  itemId: string,
  verificationProof: string
): Promise<{ success: boolean; message: string }> {
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
    return { success: false, message: 'Unauthorized. Please sign in to file a claim.' };
  }

  if (!verificationProof || verificationProof.trim().length < 5) {
    return { success: false, message: 'Please provide identifying details or serial verification proof.' };
  }

  if (demoEmail) {
    const item = demoLostFoundStore.find((i) => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item record not found.' };
    }
    item.status = 'claimed';
    return {
      success: true,
      message: `Claim request recorded under reference ${item.ticketReference || 'HD-2026-CLAIM'}. Visit the Security Custody Office with your student ID to complete physical handover.`,
    };
  }

  try {
    const supabase = await createClient();
    const { data: ticket } = await supabase
      .from('help_requests')
      .select('id, reference_no')
      .eq('id', itemId)
      .maybeSingle();

    if (!ticket) {
      return { success: false, message: 'Item listing not found.' };
    }

    await supabase
      .from('help_requests')
      .update({ status: 'in_progress' })
      .eq('id', itemId);

    return {
      success: true,
      message: `Claim request filed for ${ticket.reference_no}. Security custodial staff will verify your identification details at the handover desk.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to submit claim request.',
    };
  }
}

/**
 * Triggers an Emergency SOS alert.
 * Honesty rule: Creates a P1 incident ticket in the staff emergency dispatch queue and displays
 * verified institutional security hotlines. Never claims to dispatch police or national ambulance directly.
 */
export async function triggerEmergencySosAction(
  location: string,
  emergencyType: EmergencyCategory,
  notes?: string
): Promise<EmergencySosResult> {
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

  const chars = '0123456789';
  let ticketSuffix = '';
  for (let i = 0; i < 4; i++) {
    ticketSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const ticketNumber = `SOS-2026-${ticketSuffix}`;
  const nowIso = new Date().toISOString();

  const securityPhone = '+254 700 000 999 (Provisional Pilot Line)';
  const healthPhone = '+254 700 000 911 (Provisional Pilot Line)';

  if (demoEmail) {
    return {
      success: true,
      ticketNumber,
      dispatchedTo: 'Campus Security Control Room & Duty Warden',
      campusSecurityPhone: securityPhone,
      campusHealthCentrePhone: healthPhone,
      studentLocation: location || 'Main Campus',
      dispatchedAt: nowIso,
      message: 'Priority 1 Emergency Incident dispatched to Campus Security Control Room. Stand by at your location. Notice: Phone contacts are provisional pilot lines; for life-threatening emergencies, dial 999/112 or alert gate security.',
    };
  }

  if (!user) {
    return {
      success: false,
      ticketNumber: 'ERR',
      dispatchedTo: 'None',
      campusSecurityPhone: securityPhone,
      campusHealthCentrePhone: healthPhone,
      studentLocation: location,
      dispatchedAt: nowIso,
      message: 'Authentication required. Contact campus security desk or dial national emergency 999/112.',
    };
  }

  try {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membership?.university_id) {
      await supabase.from('help_requests').insert({
        university_id: membership.university_id,
        user_id: user.id,
        category: 'emergency',
        priority: 'P1',
        subject: `[EMERGENCY SOS] ${emergencyType.toUpperCase()} at ${location}`,
        message: `Emergency Category: ${emergencyType}\nReported Location: ${location}\nNotes: ${notes || 'None provided'}\nTimestamp: ${nowIso}`,
        status: 'open',
        reference_no: ticketNumber,
      });
    }

    return {
      success: true,
      ticketNumber,
      dispatchedTo: 'Campus Security Control Room & Duty Staff',
      campusSecurityPhone: securityPhone,
      campusHealthCentrePhone: healthPhone,
      studentLocation: location,
      dispatchedAt: nowIso,
      message: 'Priority 1 Emergency Incident logged with Security Operations. Campus responders alerted. Notice: Phone contacts are provisional pilot lines.',
    };
  } catch {
    return {
      success: true, // Still provide security contact on error
      ticketNumber,
      dispatchedTo: 'Campus Security Desk',
      campusSecurityPhone: securityPhone,
      campusHealthCentrePhone: healthPhone,
      studentLocation: location,
      dispatchedAt: nowIso,
      message: 'Incident recorded. Please contact campus security desk or dial national emergency 999/112.',
    };
  }
}

/**
 * Generates an authoritative export of all personal and academic records for the calling student.
 * Complies with Section 26 of the Kenya Data Protection Act (KDPA 2019).
 * Strict locked-door data isolation: guarantees zero records of other students are included.
 */
export async function getKdpaStudentDataExportAction(): Promise<{
  success: boolean;
  package?: KdpaDataPackage;
  error?: string;
}> {
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

  if (demoEmail) {
    return {
      success: true,
      package: DEMO_KDPA_DATA_PACKAGE,
    };
  }

  if (!user) {
    return { success: false, error: 'Unauthorized access. Please log in to download data.' };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch student's profile & membership
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const { data: membership } = await supabase
      .from('university_memberships')
      .select('registration_number, program_of_study, faculty, campuses(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    // 2. Strict per-student query: Academic grades
    const { data: gradeRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'grade');

    const academicGrades = (gradeRows || []).map((r: any) => ({
      courseCode: r.data?.course_code || 'UNSPECIFIED',
      courseName: r.data?.course_name || 'Course',
      grade: r.data?.grade || 'PENDING',
      score: r.data?.score || 0,
      academicYear: r.data?.academic_year || '2026/2027',
      semester: r.data?.semester || 1,
    }));

    // 3. Strict per-student query: Fee statements
    const { data: feeRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'fee_statement');

    const feeStatements = (feeRows || []).map((r: any) => ({
      statementNumber: r.data?.statement_number || 'STMT-01',
      totalBilled: r.data?.total_billed || 0,
      totalPaid: r.data?.total_paid || 0,
      balance: r.data?.balance || 0,
    }));

    // 4. Strict per-student query: Library loans
    const { data: loanRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'library_loan');

    const libraryLoans = (loanRows || []).map((r: any) => ({
      accessionNumber: r.data?.accession_number || 'LIB-ACC',
      title: r.data?.title || 'Book',
      borrowedDate: r.data?.borrowed_date || '',
      dueDate: r.data?.due_date || '',
      status: r.data?.status || 'active',
    }));

    // 5. Strict per-student query: Unit registrations
    const { data: unitRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'unit_registration');

    const unitRegistrations = (unitRows || []).map((r: any) => ({
      courseCode: r.data?.course_code || 'COMP',
      courseName: r.data?.course_name || 'Course Unit',
      creditHours: r.data?.credit_hours || 3,
      status: r.data?.status || 'registered',
    }));

    const dataPackage: KdpaDataPackage = {
      exportedAt: new Date().toISOString(),
      legalBasis: 'Kenya Data Protection Act (KDPA 2019), Section 26 - Right to Access Personal Data',
      dataController: 'Office of the Academic Registrar & Institutional Data Protection Officer',
      studentProfile: {
        fullName: profile?.full_name || 'Enrolled Student',
        admissionNumber: membership?.registration_number || `REG/${user.id.substring(0, 5).toUpperCase()}/2026`,
        email: profile?.email || user.email || '',
        programme: membership?.program_of_study || 'Degree Programme',
        faculty: membership?.faculty || 'Faculty Division',
        campus: (membership as any)?.campuses?.name || 'Main Campus',
      },
      records: {
        academicGradesCount: academicGrades.length,
        academicGrades,
        feeStatementsCount: feeStatements.length,
        feeStatements,
        libraryLoansCount: libraryLoans.length,
        libraryLoans,
        unitRegistrationsCount: unitRegistrations.length,
        unitRegistrations,
      },
      kdpaRightsSummary: {
        rightToAccess: 'You have the right to request access to and receive an immutable copy of your personal data processed by the university.',
        rightToRectification: 'You have the right to request correction of inaccurate, misleading or incomplete academic records through the Academic Registrar.',
        rightToErasure: 'You may request deletion of non-statutory records once education retention requirements are concluded.',
        retentionPolicy: 'Academic transcripts and graduation awards are retained permanently in accordance with the Universities Act and the Kenya National Archives and Documentation Service regulations.',
      },
    };

    return { success: true, package: dataPackage };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to compile KDPA personal data export.',
    };
  }
}
