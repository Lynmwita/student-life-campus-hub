'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import {
  RoomAllocation,
  MaintenanceTicket,
  HostelApplication,
  RoommateMatchProfile,
  WardenAnnouncement,
  VerifiedOffCampusHouse,
  MaintenanceCategory,
  TicketPriority,
  RoomType,
} from '@/lib/hostels/types';
import {
  DEMO_ROOM_ALLOCATION,
  DEMO_MAINTENANCE_TICKETS,
  DEMO_HOSTEL_APPLICATION,
  DEMO_ROOMMATE_MATCHES,
  DEMO_WARDEN_ANNOUNCEMENTS,
  DEMO_OFF_CAMPUS_HOUSES,
} from '@/lib/hostels/demo-data';
import { calculateRoommateMatches } from '@/lib/hostels/matching';

// In-memory runtime cache for demo session creations
let demoMaintenanceStore: MaintenanceTicket[] = [...DEMO_MAINTENANCE_TICKETS];
let demoApplicationStore: HostelApplication | null = { ...DEMO_HOSTEL_APPLICATION };

export interface RoomAllocationResponse {
  success: boolean;
  allocation: RoomAllocation | null;
  isDemo: boolean;
  error?: string;
}

export interface MaintenanceTicketsResponse {
  success: boolean;
  tickets: MaintenanceTicket[];
  isDemo: boolean;
  error?: string;
}

export interface HostelApplicationResponse {
  success: boolean;
  application: HostelApplication | null;
  isDemo: boolean;
  error?: string;
}

export interface RoommateMatchesResponse {
  success: boolean;
  matches: RoommateMatchProfile[];
  isDemo: boolean;
  error?: string;
}

export interface WardenAnnouncementsResponse {
  success: boolean;
  announcements: WardenAnnouncement[];
  isDemo: boolean;
  error?: string;
}

export interface OffCampusHousesResponse {
  success: boolean;
  houses: VerifiedOffCampusHouse[];
  isDemo: boolean;
  error?: string;
}

export async function getMyRoomAllocationAction(): Promise<RoomAllocationResponse> {
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
      allocation: null,
      isDemo: false,
      error: 'Unauthorized access. Please log in to view room allocation.',
    };
  }

  if (demoEmail) {
    return {
      success: true,
      allocation: DEMO_ROOM_ALLOCATION,
      isDemo: true,
    };
  }

  // Real user: query database
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'hostel_allocation')
      .eq('student_id', user!.id)
      .maybeSingle();

    if (error || !data) {
      return {
        success: true,
        allocation: null, // No on-campus room allocated for this student
        isDemo: false,
      };
    }

    return {
      success: true,
      allocation: data.data as RoomAllocation,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      allocation: null,
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query room allocation records.',
    };
  }
}

export async function getHostelMaintenanceTicketsAction(): Promise<MaintenanceTicketsResponse> {
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
      tickets: [],
      isDemo: false,
      error: 'Unauthorized access.',
    };
  }

  if (demoEmail) {
    return {
      success: true,
      tickets: demoMaintenanceStore,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('student_id', user!.id)
      .in('category', ['hostel', 'facilities', 'accommodation'])
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        tickets: [],
        isDemo: false,
        error: error.message,
      };
    }

    const tickets: MaintenanceTicket[] = (data || []).map((row: any) => {
      let hall = 'Hall 3 (Mount Kenya)';
      let room = 'B-204';
      const locMatch = row.subject?.match(/\(([^)]+)\s*-\s*([^)]+)\)/);
      if (locMatch) {
        hall = locMatch[1].trim();
        room = locMatch[2].trim();
      }

      return {
        id: row.id,
        ticketNumber: row.reference_no || `HD-2026-${row.id.substring(0, 5)}`,
        category: (row.metadata?.category || 'other') as MaintenanceCategory,
        categoryLabel: row.metadata?.categoryLabel || 'General Facilities',
        title: row.subject?.replace(/\([^)]+\)$/, '').trim() || 'Maintenance Request',
        description: row.description,
        hallName: hall,
        roomNumber: room,
        priority: row.priority === 'P1' ? 'urgent' : row.priority === 'P2' || row.priority === 'P3' ? 'medium' : 'low',
        status: row.status === 'resolved' || row.status === 'closed' ? 'resolved' : row.status === 'in_progress' ? 'in_progress' : 'reported',
        reportedBy: user!.email || 'Student',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        technicianAssigned: row.assigned_staff_id ? 'Assigned Facilities Technician' : undefined,
        resolutionNotes: row.resolution_notes || undefined,
        resolvedAt: row.resolved_at || undefined,
      };
    });

    return {
      success: true,
      tickets,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      tickets: [],
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve maintenance tickets.',
    };
  }
}

export async function createHostelMaintenanceTicketAction(params: {
  category: MaintenanceCategory;
  title: string;
  description: string;
  hallName: string;
  roomNumber: string;
  priority: TicketPriority;
}): Promise<{ success: boolean; ticket?: MaintenanceTicket; error?: string }> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  if (!params.title || !params.description || !params.category) {
    return { success: false, error: 'Title, category, and issue description are required.' };
  }

  const categoryLabels: Record<MaintenanceCategory, string> = {
    plumbing: 'Plumbing & Water',
    electrical: 'Electrical & Power',
    carpentry: 'Carpentry & Furniture',
    lock_key: 'Door Locks & Security',
    wifi_network: 'Wi-Fi & Connectivity',
    window_glass: 'Windows & Ventilation',
    pest_control: 'Pest Control',
    other: 'General Facilities',
  };

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let refSuffix = '';
  for (let i = 0; i < 4; i++) {
    refSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const ticketRef = `HD-2026-${refSuffix}`;

  const newTicket: MaintenanceTicket = {
    id: `TKT-${Date.now()}`,
    ticketNumber: ticketRef,
    category: params.category,
    categoryLabel: categoryLabels[params.category] || 'Facilities',
    title: params.title.trim(),
    description: params.description.trim(),
    hallName: params.hallName || 'Hall 3 (Mount Kenya)',
    roomNumber: params.roomNumber || 'B-204',
    priority: params.priority || 'medium',
    status: 'reported',
    reportedBy: demoEmail ? 'Faith Wanjiku' : user!.email || 'Student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (demoEmail) {
    demoMaintenanceStore = [newTicket, ...demoMaintenanceStore];
    return { success: true, ticket: newTicket };
  }

  try {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id, campus_id')
      .eq('user_id', user!.id)
      .single();

    if (!membership) {
      return { success: false, error: 'No active university affiliation found.' };
    }

    const priorityDb = params.priority === 'urgent' ? 'P1' : params.priority === 'medium' ? 'P3' : 'P4';
    const formattedSubject = `[${categoryLabels[params.category]}] ${params.title.trim()} (${params.hallName} - ${params.roomNumber})`;

    const { data: inserted, error } = await supabase.from('help_requests').insert({
      reference_no: ticketRef,
      university_id: membership.university_id,
      campus_id: membership.campus_id || null,
      student_id: user!.id,
      category: 'hostel',
      priority: priorityDb,
      subject: formattedSubject,
      description: params.description.trim(),
      status: 'submitted',
    }).select('id, reference_no').single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (inserted?.reference_no) {
      newTicket.ticketNumber = inserted.reference_no;
    }

    return { success: true, ticket: newTicket };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save maintenance ticket.' };
  }
}

export async function getHostelApplicationAction(): Promise<HostelApplicationResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return { success: false, application: null, isDemo: false, error: 'Unauthorized.' };
  }

  if (demoEmail) {
    return {
      success: true,
      application: demoApplicationStore,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    // Query student's submitted application from help_requests with category 'hostel'
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('student_id', user!.id)
      .eq('category', 'hostel')
      .ilike('subject', '[Hostel Application]%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { success: true, application: null, isDemo: false };
    }

    let parsedApp: HostelApplication | null = null;
    try {
      parsedApp = JSON.parse(data.description) as HostelApplication;
      // Map status from database record
      if (data.status === 'resolved' || data.status === 'closed') {
        parsedApp.status = 'allocated';
      } else if (data.status === 'in_progress' || data.status === 'under_review') {
        parsedApp.status = 'pending';
      } else {
        parsedApp.status = 'applied';
      }
    } catch {
      parsedApp = {
        id: data.id,
        applicationNumber: data.reference_no,
        studentId: user!.id,
        studentName: user!.email?.split('@')[0] || 'Student',
        admissionNumber: 'BIT/2023/REAL',
        academicYear: '2026/2027',
        semester: 2,
        status: data.status === 'resolved' ? 'allocated' : data.status === 'under_review' ? 'pending' : 'applied',
        firstPreferenceHall: 'Hall 3 (Mount Kenya Residence)',
        secondPreferenceHall: 'Hall 5 (Kilimanjaro Hall)',
        preferredRoomType: 'double',
        submittedAt: data.created_at,
        decisionDate: '2026-11-20',
      };
    }

    return { success: true, application: parsedApp, isDemo: false };
  } catch (err) {
    return { success: false, application: null, isDemo: false, error: err instanceof Error ? err.message : 'Failed to query application.' };
  }
}

export async function submitHostelApplicationAction(params: {
  firstPreferenceHall: string;
  secondPreferenceHall: string;
  preferredRoomType: RoomType;
  specialNeedsDescription?: string;
}): Promise<{ success: boolean; application?: HostelApplication; error?: string }> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  if (!params.firstPreferenceHall || !params.preferredRoomType) {
    return { success: false, error: 'Preferred hall and room type are mandatory.' };
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let appSuffix = '';
  for (let i = 0; i < 4; i++) {
    appSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const appNumber = `HS-2027-SEM2-${appSuffix}`;

  const app: HostelApplication = {
    id: `APP-${Date.now()}`,
    applicationNumber: appNumber,
    studentId: demoEmail ? 'student-demo-faith' : user!.id,
    studentName: demoEmail ? 'Faith Wanjiku' : user!.email?.split('@')[0] || 'Student',
    admissionNumber: demoEmail ? 'BIT/2023/8849' : 'BIT/2023/REAL',
    academicYear: '2026/2027',
    semester: 2,
    status: 'applied',
    firstPreferenceHall: params.firstPreferenceHall,
    secondPreferenceHall: params.secondPreferenceHall || 'Hall 2 (Menengai)',
    preferredRoomType: params.preferredRoomType,
    specialNeedsDescription: params.specialNeedsDescription?.trim(),
    submittedAt: new Date().toISOString(),
    decisionDate: '2026-11-20',
  };

  if (demoEmail) {
    demoApplicationStore = app;
    return { success: true, application: app };
  }

  try {
    const supabase = await createClient();
    // Retrieve student's university membership to attach mandatory university_id
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id, campus_id')
      .eq('user_id', user!.id)
      .single();

    if (!membership) {
      return { success: false, error: 'No active university affiliation found.' };
    }

    const formattedSubject = `[Hostel Application] ${params.firstPreferenceHall} (${params.preferredRoomType})`;

    const { data: inserted, error } = await supabase.from('help_requests').insert({
      reference_no: appNumber,
      university_id: membership.university_id,
      campus_id: membership.campus_id || null,
      student_id: user!.id,
      category: 'hostel',
      priority: 'P3',
      subject: formattedSubject,
      description: JSON.stringify(app),
      status: 'submitted',
    }).select('id, reference_no').single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (inserted?.reference_no) {
      app.applicationNumber = inserted.reference_no;
    }

    return { success: true, application: app };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit application.' };
  }
}

export async function getRoommateMatchesAction(): Promise<RoommateMatchesResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  let userInterests: string[] = [];
  if (user) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('student_interests')
        .select('interest')
        .eq('user_id', user.id);
      if (data && data.length > 0) {
        userInterests = data.map((d: any) => d.interest);
      }
    } catch {}
  } else if (demoEmail) {
    // Demo user Faith Wanjiku's profile interests from onboarding
    userInterests = ['technology', 'leadership', 'community_service', 'Web Development', 'Campus Tech Club'];
  }

  // Calculate roommate compatibility dynamically using the student's saved interests
  const matches = calculateRoommateMatches(userInterests, DEMO_ROOMMATE_MATCHES);

  return {
    success: true,
    matches,
    isDemo: !!demoEmail,
  };
}

export async function getWardenAnnouncementsAction(): Promise<WardenAnnouncementsResponse> {
  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  // Retrieve student's room allocation to identify resident hall
  const roomRes = await getMyRoomAllocationAction();
  const residentHall = roomRes.allocation?.hallName;

  // Filter announcements: only show notices for student's hall, or campus-wide notices
  const scopedAnnouncements = DEMO_WARDEN_ANNOUNCEMENTS.filter((notice) => {
    if (notice.hallScope === 'All Campus Halls' || notice.hallScope === 'All Halls') {
      return true;
    }
    if (!residentHall) {
      // Non-resident students only receive campus-wide announcements
      return false;
    }
    // Resident only sees notices for their assigned hall
    const cleanScope = notice.hallScope.toLowerCase().split('(')[0].trim();
    const cleanResident = residentHall.toLowerCase().split('(')[0].trim();
    return cleanScope === cleanResident || residentHall.toLowerCase().includes(cleanScope);
  });

  return {
    success: true,
    announcements: scopedAnnouncements,
    isDemo: !!demoEmail,
  };
}

export async function getVerifiedOffCampusHousesAction(): Promise<OffCampusHousesResponse> {
  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  return {
    success: true,
    houses: DEMO_OFF_CAMPUS_HOUSES,
    isDemo: !!demoEmail,
  };
}

export async function reportOffCampusListingAction(params: {
  houseId: string;
  reason: string;
  description: string;
}): Promise<{ success: boolean; message: string }> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return { success: false, message: 'Unauthorized. Please log in to report listings.' };
  }

  if (!params.houseId || !params.reason) {
    return { success: false, message: 'Reason for report is required.' };
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let refSuffix = '';
  for (let i = 0; i < 4; i++) {
    refSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const reportRef = `HD-2026-${refSuffix}`;

  if (demoEmail) {
    return {
      success: true,
      message: `Report ${reportRef} received. Our Accommodation Office has flagged this listing for immediate verification.`,
    };
  }

  try {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from('university_memberships')
      .select('university_id')
      .eq('user_id', user!.id)
      .single();

    if (membership) {
      await supabase.from('help_requests').insert({
        reference_no: reportRef,
        university_id: membership.university_id,
        student_id: user!.id,
        category: 'hostel',
        priority: 'P2',
        subject: `[Off-Campus Scam Report] Property ${params.houseId} - ${params.reason}`,
        description: params.description?.trim() || `Listing reported for: ${params.reason}`,
        status: 'submitted',
      });
    }

    return {
      success: true,
      message: `Report ${reportRef} logged successfully. Staff will review this off-campus property.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to submit scam report.',
    };
  }
}
