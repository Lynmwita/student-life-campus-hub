'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import {
  ClearanceDepartmentItem,
  SponsorViewSummary,
  StudentClearanceSummary,
  TranscriptRequest,
  VaultDocument,
} from '@/lib/graduation/types';
import {
  DEMO_CLEARANCE_SUMMARY,
  DEMO_SPONSOR_VIEW,
  DEMO_TRANSCRIPT_REQUESTS,
  DEMO_VAULT_DOCUMENTS,
} from '@/lib/graduation/demo-data';

// Stateful in-memory store for demo session transcript requests
let demoTranscriptRequestsStore: TranscriptRequest[] = [...DEMO_TRANSCRIPT_REQUESTS];

export interface ClearanceResponse {
  success: boolean;
  summary?: StudentClearanceSummary;
  isDemo: boolean;
  error?: string;
}

export interface VaultResponse {
  success: boolean;
  documents: VaultDocument[];
  isDemo: boolean;
  error?: string;
}

/**
 * Retrieves the multi-department final graduation clearance checklist.
 * Honesty rule: Clearance is NEVER falsely stamped as cleared. Every department
 * reflects verified registry status; blocking reasons and resolution links are provided.
 */
export async function getStudentClearanceSummaryAction(): Promise<ClearanceResponse> {
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
      summary: DEMO_CLEARANCE_SUMMARY,
      isDemo: true,
    };
  }

  if (!user) {
    return {
      success: false,
      isDemo: false,
      error: 'Authentication required to inspect graduation clearance.',
    };
  }

  try {
    const supabase = await createClient();

    // 1. Student profile & credentials
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const { data: membership } = await supabase
      .from('university_memberships')
      .select('registration_number, program_of_study, faculty, created_at, campuses(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    const admissionNo =
      membership?.registration_number || `REG/${user.id.substring(0, 5).toUpperCase()}/2026`;

    // 2. Query fee records for Finance department clearance
    const { data: feeRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'fee_statement')
      .order('source_updated_at', { ascending: false });

    let feeBalance = 0;
    if (feeRows && feeRows.length > 0) {
      feeBalance = feeRows[0].data?.balance ?? 0;
    }

    // 3. Query library records for Library department clearance
    const { data: loanRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'library_loan');

    const activeOrOverdueLoans = (loanRows || []).filter(
      (r: any) => r.data?.status === 'overdue' || r.data?.status === 'active'
    );

    // 4. Query hostel allocation for Residence clearance
    const { data: hostelRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'hostel_allocation');

    const hasHostelAllocation = hostelRows && hostelRows.length > 0;
    const isHostelCheckedOut =
      hasHostelAllocation &&
      (hostelRows[0].data?.status === 'checked_out' ||
        hostelRows[0].data?.clearance_status === 'cleared');

    // 5. Query sports equipment clearance
    const { data: sportsRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'sports_clearance');

    const isSportsCleared =
      sportsRows &&
      sportsRows.length > 0 &&
      sportsRows[0].data?.status === 'cleared';

    // 6. Query Senate graduation clearance
    const { data: senateRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'graduation_clearance');

    const isSenateApproved =
      senateRows &&
      senateRows.length > 0 &&
      senateRows[0].data?.status === 'cleared';

    // Build real departments without hardcoded fake approvals
    const departments: ClearanceDepartmentItem[] = [
      {
        id: 'real-dept-lib',
        departmentName: 'University Library Commons',
        category: 'library',
        status: activeOrOverdueLoans.length > 0 ? 'blocked' : 'cleared',
        blockingReason:
          activeOrOverdueLoans.length > 0
            ? `${activeOrOverdueLoans.length} active or overdue book loan(s) pending return.`
            : undefined,
        clearedAt: activeOrOverdueLoans.length === 0 ? new Date().toISOString() : undefined,
        resolutionActionUrl: '/library',
        resolutionActionLabel: 'Return or Renew at Library',
      },
      {
        id: 'real-dept-res',
        departmentName: 'Halls of Residence & Housing',
        category: 'hostels',
        status: isHostelCheckedOut ? 'cleared' : 'pending',
        blockingReason: isHostelCheckedOut
          ? undefined
          : hasHostelAllocation
          ? 'Room key handover and room inventory inspection pending at Hall Warden desk.'
          : 'No residential clearance record on file. Verify non-resident status with housing office.',
        clearedAt: isHostelCheckedOut ? new Date().toISOString() : undefined,
        resolutionActionUrl: '/hostels',
        resolutionActionLabel: 'Check Residence Details',
      },
      {
        id: 'real-dept-sport',
        departmentName: 'Sports & Recreation Department',
        category: 'sports',
        status: isSportsCleared ? 'cleared' : 'pending',
        blockingReason: isSportsCleared
          ? undefined
          : 'Sports equipment return and facility clearance pending departmental audit.',
        clearedAt: isSportsCleared ? new Date().toISOString() : undefined,
      },
      {
        id: 'real-dept-fin',
        departmentName: 'Finance & Student Accounts',
        category: 'finance',
        status: feeBalance > 0 ? 'blocked' : 'cleared',
        blockingReason:
          feeBalance > 0
            ? `Outstanding fee balance: KES ${feeBalance.toLocaleString()}. Must be fully settled for clearance.`
            : undefined,
        clearedAt: feeBalance <= 0 ? new Date().toISOString() : undefined,
        resolutionActionUrl: '/fees',
        resolutionActionLabel: 'View & Settle Outstanding Fees',
      },
      {
        id: 'real-dept-reg',
        departmentName: 'Office of the Academic Registrar',
        category: 'registrar',
        status: isSenateApproved ? 'cleared' : 'pending',
        blockingReason: isSenateApproved
          ? undefined
          : 'Pending Senate Academic Board graduation audit and graduation list confirmation.',
        clearedAt: isSenateApproved ? new Date().toISOString() : undefined,
        resolutionActionUrl: '/exams',
        resolutionActionLabel: 'Check Exam Schedule & Transcripts',
      },
    ];

    const clearedCount = departments.filter((d) => d.status === 'cleared').length;
    const isFullyCleared = clearedCount === departments.length;

    const summary: StudentClearanceSummary = {
      studentId: user.id,
      studentName: profile?.full_name || 'Enrolled Student',
      admissionNumber: admissionNo,
      programme: membership?.program_of_study || 'Degree Programme',
      faculty: membership?.faculty || 'Faculty Division',
      campus: (membership as any)?.campuses?.name || 'Main Campus',
      academicYear: '2026/2027',
      isFullyCleared,
      clearedDepartmentsCount: clearedCount,
      totalDepartmentsCount: departments.length,
      finalClearanceCertificateRef: isFullyCleared
        ? `CLR-CERT-2026-${user.id.substring(0, 6).toUpperCase()}`
        : undefined,
      departments,
    };

    return {
      success: true,
      summary,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query student clearance status.',
    };
  }
}

/**
 * Retrieves the certified documents in the student's digital documents vault.
 * Availability is strictly tied to real backing records.
 */
export async function getVaultDocumentsAction(): Promise<VaultResponse> {
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
      documents: DEMO_VAULT_DOCUMENTS,
      isDemo: true,
    };
  }

  if (!user) {
    return {
      success: false,
      documents: [],
      isDemo: false,
      error: 'Authentication required to inspect documents vault.',
    };
  }

  try {
    const supabase = await createClient();

    // Query real backing records
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('registration_number, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: feeRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'fee_statement');

    const { data: gradeRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'grade');

    const clrRes = await getStudentClearanceSummaryAction();
    const isFullyCleared = clrRes.summary?.isFullyCleared ?? false;
    const admissionNo = clrRes.summary?.admissionNumber || 'ADM';

    const hasMembership = !!membership?.registration_number;
    const hasFeeRecords = !!(feeRows && feeRows.length > 0);
    const hasGradeRecords = !!(gradeRows && gradeRows.length > 0);

    const admissionDate = membership?.created_at
      ? membership.created_at.split('T')[0]
      : '2023-09-01';

    const documents: VaultDocument[] = [
      {
        id: 'real-doc-adm',
        title: 'Official Letter of Admission',
        type: 'admission_letter',
        description: 'Statutory university admission offer letter with program code, faculty entry, and reporting instructions.',
        referenceNumber: `SMU/ADM/${admissionNo.replace(/[^A-Za-z0-9]/g, '-')}`,
        issuedDate: admissionDate,
        fileFormat: 'PDF',
        isAvailable: hasMembership,
        unavailableReason: hasMembership ? undefined : 'No university admission record on institutional registry.',
      },
      {
        id: 'real-doc-fee',
        title: 'Semester Fee Statement & Payment Receipt',
        type: 'fee_receipt',
        description: 'Certified financial statement showing billed tuition, campus amenities, HELB funding, and M-Pesa receipts.',
        referenceNumber: `STMT-2026-${admissionNo.replace(/[^A-Za-z0-9]/g, '')}`,
        issuedDate: new Date().toISOString().split('T')[0],
        fileFormat: 'PDF',
        isAvailable: hasFeeRecords,
        unavailableReason: hasFeeRecords ? undefined : 'No fee statements recorded on registry ledger.',
      },
      {
        id: 'real-doc-exam',
        title: 'Provisional Examination Results Slip & Grade Summary',
        type: 'provisional_transcript',
        description: 'Consolidated semester coursework and examination score summary endorsed by Departmental Examination Board.',
        referenceNumber: `EXAM-SLIP-2026-${admissionNo.replace(/[^A-Za-z0-9]/g, '')}`,
        issuedDate: new Date().toISOString().split('T')[0],
        fileFormat: 'PDF',
        isAvailable: hasGradeRecords,
        unavailableReason: hasGradeRecords ? undefined : 'No examination results recorded on registry ledger.',
      },
      {
        id: 'real-doc-clr',
        title: 'Certificate of Final University Clearance',
        type: 'clearance_certificate',
        description: 'Institutional certificate certifying zero liabilities across Library, Housing, Sports, Finance, and Registry.',
        referenceNumber: isFullyCleared
          ? `CLR-CERT-2026-${admissionNo.replace(/[^A-Za-z0-9]/g, '')}`
          : 'CLR-PENDING',
        issuedDate: isFullyCleared ? new Date().toISOString().split('T')[0] : 'Pending',
        fileFormat: 'PDF',
        isAvailable: isFullyCleared,
        unavailableReason: isFullyCleared
          ? undefined
          : `Available once all 5 departments record final clearance. Currently ${clrRes.summary?.clearedDepartmentsCount ?? 0} of 5 cleared.`,
      },
    ];

    return {
      success: true,
      documents,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      documents: [],
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query digital vault documents.',
    };
  }
}

/**
 * Submits an official academic transcript request for delivery to an employer or institution.
 */
export async function requestOfficialTranscriptAction(params: {
  destinationInstitution: string;
  destinationEmail: string;
  format: 'electronic_certified' | 'embossed_hardcopy';
  notes?: string;
}): Promise<{ success: boolean; request?: TranscriptRequest; message: string }> {
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
    return { success: false, message: 'Unauthorized. Please sign in to request an official transcript.' };
  }

  if (!params.destinationInstitution || params.destinationInstitution.trim().length < 3) {
    return { success: false, message: 'Please specify the destination institution or organisation name.' };
  }

  if (!params.destinationEmail || !params.destinationEmail.includes('@')) {
    return { success: false, message: 'Please provide a valid destination email address for dispatch.' };
  }

  const chars = '0123456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const trackingReference = `TRQ-2026-${rand}`;
  const nowIso = new Date().toISOString();

  const newRequest: TranscriptRequest = {
    id: `trq-${Date.now()}`,
    trackingReference,
    destinationInstitution: params.destinationInstitution.trim(),
    destinationEmail: params.destinationEmail.trim(),
    format: params.format,
    status: 'submitted',
    requestedAt: nowIso,
    notes: params.notes?.trim() || undefined,
  };

  if (demoEmail) {
    demoTranscriptRequestsStore = [newRequest, ...demoTranscriptRequestsStore];
    return {
      success: true,
      request: newRequest,
      message: `Transcript request logged with tracking reference ${trackingReference}. Registry verification in progress.`,
    };
  }

  try {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (membership?.university_id) {
      await supabase.from('help_requests').insert({
        university_id: membership.university_id,
        user_id: user!.id,
        category: 'academic_registry',
        priority: 'P2',
        subject: `[TRANSCRIPT REQUEST] ${params.destinationInstitution} (${params.format})`,
        message: JSON.stringify({
          trackingReference,
          destinationInstitution: params.destinationInstitution,
          destinationEmail: params.destinationEmail,
          format: params.format,
          notes: params.notes,
        }),
        status: 'open',
        reference_no: trackingReference,
      });
    }

    return {
      success: true,
      request: newRequest,
      message: `Official transcript dispatch request registered under reference ${trackingReference}.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to register transcript request.',
    };
  }
}

/**
 * Retrieves the student's submitted transcript requests.
 */
export async function getTranscriptRequestsAction(): Promise<{
  success: boolean;
  requests: TranscriptRequest[];
  isDemo: boolean;
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
      requests: demoTranscriptRequestsStore,
      isDemo: true,
    };
  }

  if (!user) {
    return { success: false, requests: [], isDemo: false };
  }

  try {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from('help_requests')
      .select('id, reference_no, message, status, created_at')
      .eq('category', 'academic_registry')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const requests: TranscriptRequest[] = (rows || []).map((r) => {
      let parsed = {
        destinationInstitution: 'Accredited Institution',
        destinationEmail: 'admissions@institution.edu',
        format: 'electronic_certified' as const,
        notes: undefined,
      };
      try {
        parsed = { ...parsed, ...JSON.parse(r.message) };
      } catch {}

      return {
        id: r.id,
        trackingReference: r.reference_no,
        destinationInstitution: parsed.destinationInstitution,
        destinationEmail: parsed.destinationEmail,
        format: parsed.format,
        status: r.status === 'resolved' ? 'delivered' : r.status === 'in_progress' ? 'processing' : 'submitted',
        requestedAt: r.created_at,
        notes: parsed.notes,
      };
    });

    return { success: true, requests, isDemo: false };
  } catch {
    return { success: false, requests: [], isDemo: false };
  }
}

/**
 * Retrieves the read-only summary for parents and sponsors.
 * Surfaces fee balances, provisional demonstration payment instructions, and academic standing
 * without exposing confidential private messages or help desk support tickets.
 */
export async function getSponsorViewSummaryAction(): Promise<{
  success: boolean;
  summary?: SponsorViewSummary;
  isDemo: boolean;
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
      summary: DEMO_SPONSOR_VIEW,
      isDemo: true,
    };
  }

  if (!user) {
    return {
      success: false,
      isDemo: false,
      error: 'Authentication required to inspect sponsor summary.',
    };
  }

  try {
    const supabase = await createClient();

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

    const admissionNo =
      membership?.registration_number || `REG/${user.id.substring(0, 5).toUpperCase()}/2026`;

    // Query fee statement
    const { data: feeRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'fee_statement')
      .order('source_updated_at', { ascending: false });

    let billed = 0;
    let paid = 0;
    let balance = 0;
    if (feeRows && feeRows.length > 0) {
      billed = feeRows[0].data?.total_billed ?? 0;
      paid = feeRows[0].data?.total_paid ?? 0;
      balance = feeRows[0].data?.balance ?? 0;
    }

    // Query enrolled units
    const { data: unitRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user.id)
      .eq('kind', 'unit_registration');

    const enrolledUnits = (unitRows || []).map((r: any) => ({
      code: r.data?.course_code || 'COMP',
      title: r.data?.course_name || 'Course Unit',
      creditHours: r.data?.credit_hours || 3,
    }));

    const cleanAccountNo = admissionNo.replace(/[^A-Za-z0-9]/g, '');

    const summary: SponsorViewSummary = {
      studentName: profile?.full_name || 'Enrolled Student',
      admissionNumber: admissionNo,
      programme: membership?.program_of_study || 'Degree Programme',
      faculty: membership?.faculty || 'Faculty Division',
      campus: (membership as any)?.campuses?.name || 'Main Campus',
      academicYear: '2026/2027',
      currentSemester: 1,
      academicStanding: balance > 0 ? 'Good Academic Standing (Fees Payment Required)' : 'Good Academic Standing (Cleared)',
      feeSummary: {
        totalBilled: billed,
        totalPaid: paid,
        balance,
        dueDate: '2026-11-15',
        paybillNumber: '247247 (Provisional Pilot Number)',
        accountNumber: cleanAccountNo,
        bankDetails: {
          bankName: 'Kenya Commercial Bank (KCB) [Provisional - Confirm with SMU Finance]',
          accountName: 'Summit Metropolitan University Fees Collection',
          accountNumber: '1102938475 (Provisional)',
          branch: 'University Way Branch',
        },
      },
      enrolledUnitsCount: enrolledUnits.length,
      enrolledUnits,
    };

    return {
      success: true,
      summary,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to compile sponsor view.',
    };
  }
}
