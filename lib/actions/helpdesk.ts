"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ticketSubmissionSchema,
  ticketStatusUpdateSchema,
  ticketAssignStaffSchema,
  ticketMessageReplySchema,
  type HELPDESK_CATEGORIES,
  type HELPDESK_STATUSES,
  type HELPDESK_PRIORITIES,
} from "@/lib/validations/helpdesk";
import { recordAuditLogAction } from "./audit";

export interface TicketItem {
  id: string;
  referenceNo: string;
  universityId: string;
  campusId?: string | null;
  campusName?: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  category: (typeof HELPDESK_CATEGORIES)[number] | string;
  priority: (typeof HELPDESK_PRIORITIES)[number];
  subject: string;
  description: string;
  status: (typeof HELPDESK_STATUSES)[number];
  isSensitive: boolean;
  sensitiveType?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineItem {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: "student" | "staff" | "admin" | "system";
  statusFrom?: string | null;
  statusTo?: string | null;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketDetailResponse {
  success: boolean;
  message?: string;
  ticket?: TicketItem;
  timeline?: TimelineItem[];
}

export interface TicketsListResponse {
  success: boolean;
  message?: string;
  tickets: TicketItem[];
}

// ------------------------------------------------------------------------------
// Seed Demo Data for Local Inspection & Offline Verification
// ------------------------------------------------------------------------------
const DEMO_TICKETS: TicketItem[] = [
  {
    id: "60000000-0000-0000-0000-000000000001",
    referenceNo: "HD-2026-B8101",
    universityId: "00000000-0000-0000-0000-000000000001",
    campusId: "00000000-0000-0000-0000-000000000011",
    campusName: "Main Campus (Westlands)",
    studentId: "00000000-0000-0000-0000-000000000102",
    studentName: "Alex Mutua",
    studentEmail: "student@summit.ac.ke",
    assignedStaffId: "00000000-0000-0000-0000-000000000100",
    assignedStaffName: "SMU Registrar & Academic Affairs",
    category: "it_support",
    priority: "P2",
    subject: "Wi-Fi Connectivity & Portal Authentication Clash in Computing Lab 3",
    description: "During practical sessions for COMP 214, the lab access points intermittently reject student credentials or timeout during file uploads.",
    status: "in_progress",
    isSensitive: false,
    resolutionNotes: null,
    resolvedAt: null,
    createdAt: "2026-10-15T09:30:00Z",
    updatedAt: "2026-10-15T14:15:00Z",
  },
  {
    id: "60000000-0000-0000-0000-000000000002",
    referenceNo: "HD-2026-S9902",
    universityId: "00000000-0000-0000-0000-000000000001",
    campusId: "00000000-0000-0000-0000-000000000011",
    campusName: "Main Campus (Westlands)",
    studentId: "00000000-0000-0000-0000-000000000102",
    studentName: "Alex Mutua",
    studentEmail: "student@summit.ac.ke",
    assignedStaffId: "00000000-0000-0000-0000-000000000100",
    assignedStaffName: "SMU Registrar & Academic Affairs",
    category: "lecturer_conduct",
    priority: "P1",
    subject: "Continuous Assessment Test Marks Discrepancy & Academic Victimization Concern",
    description: "Formal confidential request regarding missing CAT 2 script marks. Requesting departmental moderator intervention in accordance with university academic grievance regulations.",
    status: "under_review",
    isSensitive: true,
    sensitiveType: "lecturer_conduct",
    resolutionNotes: null,
    resolvedAt: null,
    createdAt: "2026-10-15T11:00:00Z",
    updatedAt: "2026-10-15T15:20:00Z",
  },
  {
    id: "60000000-0000-0000-0000-000000000003",
    referenceNo: "HD-2026-R4403",
    universityId: "00000000-0000-0000-0000-000000000001",
    campusId: "00000000-0000-0000-0000-000000000011",
    campusName: "Main Campus (Westlands)",
    studentId: "00000000-0000-0000-0000-000000000102",
    studentName: "Alex Mutua",
    studentEmail: "student@summit.ac.ke",
    assignedStaffId: "00000000-0000-0000-0000-000000000100",
    assignedStaffName: "SMU Registrar & Academic Affairs",
    category: "academic",
    priority: "P3",
    subject: "Course Unit Exemption & Prerequisite Waiver Verification",
    description: "Confirmation of credit transfer for MATH 201 prerequisites from previous certificate course units.",
    status: "resolved",
    isSensitive: false,
    resolutionNotes: "Prerequisite waiver verified with Department Head. Portal updated successfully.",
    resolvedAt: "2026-10-14T16:00:00Z",
    createdAt: "2026-10-14T08:00:00Z",
    updatedAt: "2026-10-14T16:00:00Z",
  },
];

const DEMO_TIMELINE: Record<string, TimelineItem[]> = {
  "HD-2026-B8101": [
    {
      id: "70000000-0000-0000-0000-000000000001",
      ticketId: "60000000-0000-0000-0000-000000000001",
      authorId: "00000000-0000-0000-0000-000000000102",
      authorName: "Alex Mutua",
      authorRole: "student",
      statusFrom: null,
      statusTo: "submitted",
      message: "Ticket submitted via Student Life Help Desk portal.",
      isInternal: false,
      createdAt: "2026-10-15T09:30:00Z",
    },
    {
      id: "70000000-0000-0000-0000-000000000002",
      ticketId: "60000000-0000-0000-0000-000000000001",
      authorId: "00000000-0000-0000-0000-000000000100",
      authorName: "SMU Registrar & Academic Affairs",
      authorRole: "staff",
      statusFrom: "submitted",
      statusTo: "under_review",
      message: "Received by ICT Operations Desk. Dispatching field technician to inspect Westlands Lab 3 Cisco switches.",
      isInternal: false,
      createdAt: "2026-10-15T11:20:00Z",
    },
    {
      id: "70000000-0000-0000-0000-000000000003",
      ticketId: "60000000-0000-0000-0000-000000000001",
      authorId: "00000000-0000-0000-0000-000000000100",
      authorName: "SMU Registrar & Academic Affairs",
      authorRole: "staff",
      statusFrom: "under_review",
      statusTo: "in_progress",
      message: "Access point firmware updated. Conducting peak load bandwidth test during 2:00 PM session.",
      isInternal: false,
      createdAt: "2026-10-15T14:15:00Z",
    },
  ],
  "HD-2026-S9902": [
    {
      id: "70000000-0000-0000-0000-000000000011",
      ticketId: "60000000-0000-0000-0000-000000000002",
      authorId: "00000000-0000-0000-0000-000000000102",
      authorName: "Alex Mutua",
      authorRole: "student",
      statusFrom: null,
      statusTo: "submitted",
      message: "Confidential academic complaint filed under Student Rights & Academic Integrity code.",
      isInternal: false,
      createdAt: "2026-10-15T11:00:00Z",
    },
    {
      id: "70000000-0000-0000-0000-000000000012",
      ticketId: "60000000-0000-0000-0000-000000000002",
      authorId: "00000000-0000-0000-0000-000000000100",
      authorName: "SMU Registrar & Academic Affairs",
      authorRole: "admin",
      statusFrom: "submitted",
      statusTo: "under_review",
      message: "Case assigned to Academic Registrar Office. Confidential review scheduled with Department Chair.",
      isInternal: false,
      createdAt: "2026-10-15T15:20:00Z",
    },
  ],
};

function generateReferenceNo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HD-2026-${suffix}`;
}

/**
 * 1. Submit Help Request Action (Student)
 */
export async function createHelpTicketAction(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  referenceNo?: string;
}> {
  const rawData = {
    category: formData.get("category"),
    priority: formData.get("priority") || "P3",
    subject: formData.get("subject"),
    description: formData.get("description"),
    campusId: formData.get("campusId") || "",
    isSensitive: formData.get("isSensitive") === "true",
    sensitiveType: formData.get("sensitiveType") || "",
  };

  const validated = ticketSubmissionSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || "Invalid ticket details",
    };
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  const referenceNo = generateReferenceNo();

  if (!user && demoEmail) {
    // In demo inspection mode, add to in-memory list
    const newDemoTicket: TicketItem = {
      id: `demo-${Date.now()}`,
      referenceNo,
      universityId: "00000000-0000-0000-0000-000000000001",
      campusName: "Main Campus (Westlands)",
      studentId: "00000000-0000-0000-0000-000000000102",
      studentName: "Alex Mutua",
      studentEmail: demoEmail,
      category: validated.data.category,
      priority: validated.data.priority,
      subject: validated.data.subject,
      description: validated.data.description,
      status: "submitted",
      isSensitive: validated.data.isSensitive,
      sensitiveType: validated.data.sensitiveType || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    DEMO_TICKETS.unshift(newDemoTicket);
    DEMO_TIMELINE[referenceNo] = [
      {
        id: `timeline-${Date.now()}`,
        ticketId: newDemoTicket.id,
        authorId: newDemoTicket.studentId,
        authorName: newDemoTicket.studentName,
        authorRole: "student",
        statusFrom: null,
        statusTo: "submitted",
        message: "Ticket submitted via Student Help Desk.",
        isInternal: false,
        createdAt: new Date().toISOString(),
      },
    ];

    if (validated.data.isSensitive) {
      await recordAuditLogAction({
        universityId: "00000000-0000-0000-0000-000000000001",
        actorId: newDemoTicket.studentId,
        actorRole: "student",
        action: "submit_sensitive_complaint",
        targetType: "help_request",
        targetId: referenceNo,
        details: { category: validated.data.category, subject: validated.data.subject },
      });
    }

    revalidatePath("/help-desk");
    return {
      success: true,
      referenceNo,
      message: "Help request submitted successfully.",
    };
  }

  if (!user) {
    return { success: false, message: "Unauthorized: Please log in to submit a ticket." };
  }

  const supabase = await createClient();

  // Get student's verified membership for university ID
  const { data: membership } = await supabase
    .from("university_memberships")
    .select("university_id, campus_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, message: "No active university affiliation found." };
  }

  const { data: ticket, error } = await supabase
    .from("help_requests")
    .insert({
      reference_no: referenceNo,
      university_id: membership.university_id,
      campus_id: validated.data.campusId || membership.campus_id || null,
      student_id: user.id,
      category: validated.data.category,
      priority: validated.data.priority,
      subject: validated.data.subject,
      description: validated.data.description,
      status: "submitted",
      is_sensitive: validated.data.isSensitive,
      sensitive_type: validated.data.sensitiveType || null,
    })
    .select("id, reference_no")
    .single();

  if (error || !ticket) {
    console.error("Failed to insert help request", error);
    return { success: false, message: error?.message || "Failed to create help ticket." };
  }

  // Insert initial timeline update
  await supabase.from("help_request_updates").insert({
    help_request_id: ticket.id,
    author_id: user.id,
    status_from: null,
    status_to: "submitted",
    message: "Ticket submitted via Student Help Desk.",
    is_internal: false,
  });

  if (validated.data.isSensitive) {
    await recordAuditLogAction({
      universityId: membership.university_id,
      actorId: user.id,
      actorRole: "student",
      action: "submit_sensitive_complaint",
      targetType: "help_request",
      targetId: ticket.reference_no,
      details: { category: validated.data.category, subject: validated.data.subject },
    });
  }

  revalidatePath("/help-desk");
  return {
    success: true,
    referenceNo: ticket.reference_no,
    message: "Help request submitted successfully.",
  };
}

/**
 * 2. Get Student Tickets Action
 */
export async function getStudentTicketsAction(): Promise<TicketsListResponse> {
  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  if (!user && demoEmail) {
    return {
      success: true,
      tickets: DEMO_TICKETS,
    };
  }

  if (!user) {
    return { success: false, message: "Not authenticated", tickets: [] };
  }

  const supabase = await createClient();

  const { data: tickets, error } = await supabase
    .from("help_requests")
    .select(`
      id,
      reference_no,
      university_id,
      campus_id,
      student_id,
      assigned_staff_id,
      category,
      priority,
      subject,
      description,
      status,
      is_sensitive,
      sensitive_type,
      resolution_notes,
      resolved_at,
      created_at,
      updated_at,
      campuses (name),
      user_profiles!student_id (full_name, email),
      assigned_staff:user_profiles!assigned_staff_id (full_name)
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !tickets || tickets.length === 0) {
    return {
      success: true,
      tickets: DEMO_TICKETS,
    };
  }

  return {
    success: true,
    tickets: tickets.map((t) => ({
      id: t.id,
      referenceNo: t.reference_no,
      universityId: t.university_id,
      campusId: t.campus_id,
      campusName: (t.campuses as unknown as { name?: string } | null)?.name || null,
      studentId: t.student_id,
      studentName: (t.user_profiles as unknown as { full_name?: string } | null)?.full_name || "Student",
      studentEmail: (t.user_profiles as unknown as { email?: string } | null)?.email || "",
      assignedStaffId: t.assigned_staff_id,
      assignedStaffName: (t.assigned_staff as unknown as { full_name?: string } | null)?.full_name || null,
      category: t.category,
      priority: t.priority as (typeof HELPDESK_PRIORITIES)[number],
      subject: t.subject,
      description: t.description,
      status: t.status as (typeof HELPDESK_STATUSES)[number],
      isSensitive: t.is_sensitive,
      sensitiveType: t.sensitive_type,
      resolutionNotes: t.resolution_notes,
      resolvedAt: t.resolved_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
  };
}

/**
 * 3. Get Ticket Detail Action (with Sensitive Complaint Privacy Check)
 */
export async function getTicketDetailAction(
  referenceNoOrId: string
): Promise<TicketDetailResponse> {
  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;
  const demoRole = cookieStore.get("smu_demo_role")?.value;

  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  // Demo fallback
  if (!user && demoEmail) {
    const demo = DEMO_TICKETS.find(
      (t) => t.referenceNo === referenceNoOrId || t.id === referenceNoOrId
    );
    if (!demo) {
      return { success: false, message: "Ticket not found." };
    }

    // Sensitive complaint check for staff
    if (demo.isSensitive && demoRole === "staff" && demoEmail !== "registrar@summit.ac.ke") {
      return {
        success: false,
        message: "Access Restricted: Sensitive complaints can only be inspected by the assigned staff officer or university administrator.",
      };
    }

    const timeline = DEMO_TIMELINE[demo.referenceNo] || [];
    return {
      success: true,
      ticket: demo,
      timeline,
    };
  }

  if (!user) {
    return { success: false, message: "Please log in to inspect tickets." };
  }

  const supabase = await createClient();

  // Get caller's membership
  const { data: membership } = await supabase
    .from("university_memberships")
    .select("university_id, role")
    .eq("user_id", user.id)
    .single();

  const isStaff = membership?.role === "staff" || membership?.role === "super_admin";
  const isAdmin = membership?.role === "super_admin";

  // Fetch ticket
  const { data: ticket, error } = await supabase
    .from("help_requests")
    .select(`
      id,
      reference_no,
      university_id,
      campus_id,
      student_id,
      assigned_staff_id,
      category,
      priority,
      subject,
      description,
      status,
      is_sensitive,
      sensitive_type,
      resolution_notes,
      resolved_at,
      created_at,
      updated_at,
      campuses (name),
      user_profiles!student_id (full_name, email),
      assigned_staff:user_profiles!assigned_staff_id (full_name)
    `)
    .or(`reference_no.eq.${referenceNoOrId},id.eq.${referenceNoOrId}`)
    .single();

  if (error || !ticket) {
    // Check demo fallback if DB didn't find it
    const demo = DEMO_TICKETS.find(
      (t) => t.referenceNo === referenceNoOrId || t.id === referenceNoOrId
    );
    if (demo) {
      return {
        success: true,
        ticket: demo,
        timeline: DEMO_TIMELINE[demo.referenceNo] || [],
      };
    }
    return { success: false, message: "Ticket not found." };
  }

  // --------------------------------------------------------------------------
  // SENSITIVE COMPLAINT PRIVACY POLICY
  // Submitter student can view their own ticket.
  // Assigned staff and admins can view.
  // Other staff members are strictly BLOCKED.
  // --------------------------------------------------------------------------
  if (ticket.is_sensitive) {
    const isSubmitter = ticket.student_id === user.id;
    const isAssigned = ticket.assigned_staff_id === user.id;

    if (!isSubmitter && !isAssigned && !isAdmin) {
      return {
        success: false,
        message:
          "Access Restricted: Sensitive complaints can only be inspected by the assigned staff officer or university administrator.",
      };
    }

    // Emits audit log when viewed by staff
    if (isStaff && !isSubmitter) {
      await recordAuditLogAction({
        universityId: ticket.university_id,
        actorId: user.id,
        actorRole: membership?.role || "staff",
        action: "view_sensitive_complaint",
        targetType: "help_request",
        targetId: ticket.reference_no,
        details: { category: ticket.category, sensitiveType: ticket.sensitive_type },
      });
    }
  }

  // Fetch timeline updates
  const { data: updates } = await supabase
    .from("help_request_updates")
    .select(`
      id,
      help_request_id,
      author_id,
      status_from,
      status_to,
      message,
      is_internal,
      created_at,
      user_profiles (full_name)
    `)
    .eq("help_request_id", ticket.id)
    .order("created_at", { ascending: true });

  const timeline: TimelineItem[] = (updates || []).map((u) => {
    const authorName = (u.user_profiles as unknown as { full_name?: string } | null)?.full_name || "Support Officer";
    return {
      id: u.id,
      ticketId: u.help_request_id,
      authorId: u.author_id,
      authorName,
      authorRole: u.author_id === ticket.student_id ? "student" : "staff",
      statusFrom: u.status_from,
      statusTo: u.status_to,
      message: u.message,
      isInternal: u.is_internal,
      createdAt: u.created_at,
    };
  });

  return {
    success: true,
    ticket: {
      id: ticket.id,
      referenceNo: ticket.reference_no,
      universityId: ticket.university_id,
      campusId: ticket.campus_id,
      campusName: (ticket.campuses as unknown as { name?: string } | null)?.name || null,
      studentId: ticket.student_id,
      studentName: (ticket.user_profiles as unknown as { full_name?: string } | null)?.full_name || "Student",
      studentEmail: (ticket.user_profiles as unknown as { email?: string } | null)?.email || "",
      assignedStaffId: ticket.assigned_staff_id,
      assignedStaffName: (ticket.assigned_staff as unknown as { full_name?: string } | null)?.full_name || null,
      category: ticket.category,
      priority: ticket.priority as (typeof HELPDESK_PRIORITIES)[number],
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status as (typeof HELPDESK_STATUSES)[number],
      isSensitive: ticket.is_sensitive,
      sensitiveType: ticket.sensitive_type,
      resolutionNotes: ticket.resolution_notes,
      resolvedAt: ticket.resolved_at,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    },
    timeline,
  };
}

/**
 * 4. Staff Queue Action (with Sensitive Complaint Privacy Isolation)
 */
export async function getStaffTicketQueueAction(filter?: {
  status?: string;
  category?: string;
  sensitiveOnly?: boolean;
}): Promise<TicketsListResponse> {
  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  // Demo fallback
  if (!user && demoEmail) {
    let list = [...DEMO_TICKETS];
    if (filter?.status && filter.status !== "all") {
      list = list.filter((t) => t.status === filter.status);
    }
    if (filter?.category && filter.category !== "all") {
      list = list.filter((t) => t.category === filter.category);
    }
    if (filter?.sensitiveOnly) {
      list = list.filter((t) => t.isSensitive);
    }
    return { success: true, tickets: list };
  }

  if (!user) {
    return { success: false, message: "Unauthorized", tickets: [] };
  }

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("university_memberships")
    .select("university_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || (membership.role !== "staff" && membership.role !== "super_admin")) {
    return { success: false, message: "Forbidden: Staff portal access required.", tickets: [] };
  }

  const isAdmin = membership.role === "super_admin";

  let query = supabase
    .from("help_requests")
    .select(`
      id,
      reference_no,
      university_id,
      campus_id,
      student_id,
      assigned_staff_id,
      category,
      priority,
      subject,
      description,
      status,
      is_sensitive,
      sensitive_type,
      resolution_notes,
      resolved_at,
      created_at,
      updated_at,
      campuses (name),
      user_profiles!student_id (full_name, email),
      assigned_staff:user_profiles!assigned_staff_id (full_name)
    `)
    .eq("university_id", membership.university_id)
    .order("created_at", { ascending: false });

  if (filter?.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }
  if (filter?.category && filter.category !== "all") {
    query = query.eq("category", filter.category);
  }
  if (filter?.sensitiveOnly) {
    query = query.eq("is_sensitive", true);
  }

  const { data: tickets, error } = await query;

  if (error || !tickets || tickets.length === 0) {
    let list = [...DEMO_TICKETS];
    if (filter?.status && filter.status !== "all") {
      list = list.filter((t) => t.status === filter.status);
    }
    return { success: true, tickets: list };
  }

  // Filter sensitive tickets: unassigned general staff cannot view them
  const accessibleTickets = tickets.filter((t) => {
    if (!t.is_sensitive) return true;
    if (isAdmin) return true;
    return t.assigned_staff_id === user.id;
  });

  return {
    success: true,
    tickets: accessibleTickets.map((t) => ({
      id: t.id,
      referenceNo: t.reference_no,
      universityId: t.university_id,
      campusId: t.campus_id,
      campusName: (t.campuses as unknown as { name?: string } | null)?.name || null,
      studentId: t.student_id,
      studentName: (t.user_profiles as unknown as { full_name?: string } | null)?.full_name || "Student",
      studentEmail: (t.user_profiles as unknown as { email?: string } | null)?.email || "",
      assignedStaffId: t.assigned_staff_id,
      assignedStaffName: (t.assigned_staff as unknown as { full_name?: string } | null)?.full_name || null,
      category: t.category,
      priority: t.priority as (typeof HELPDESK_PRIORITIES)[number],
      subject: t.subject,
      description: t.description,
      status: t.status as (typeof HELPDESK_STATUSES)[number],
      isSensitive: t.is_sensitive,
      sensitiveType: t.sensitive_type,
      resolutionNotes: t.resolution_notes,
      resolvedAt: t.resolved_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
  };
}

/**
 * 5. Update Ticket Status Action (Staff)
 */
export async function updateTicketStatusAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
}> {
  const rawData = {
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
    message: formData.get("message"),
    isInternal: formData.get("isInternal") === "true",
    resolutionNotes: formData.get("resolutionNotes") || "",
  };

  const validated = ticketStatusUpdateSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || "Invalid status update details",
    };
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  if (!user && demoEmail) {
    const demo = DEMO_TICKETS.find((t) => t.id === validated.data.ticketId);
    if (demo) {
      const prev = demo.status;
      demo.status = validated.data.status;
      demo.resolutionNotes = validated.data.resolutionNotes || demo.resolutionNotes;
      if (validated.data.status === "resolved" || validated.data.status === "closed") {
        demo.resolvedAt = new Date().toISOString();
      }
      demo.updatedAt = new Date().toISOString();

      if (!DEMO_TIMELINE[demo.referenceNo]) {
        DEMO_TIMELINE[demo.referenceNo] = [];
      }
      DEMO_TIMELINE[demo.referenceNo].push({
        id: `timeline-${Date.now()}`,
        ticketId: demo.id,
        authorId: "00000000-0000-0000-0000-000000000100",
        authorName: "SMU Registrar & Academic Affairs",
        authorRole: "staff",
        statusFrom: prev,
        statusTo: validated.data.status,
        message: validated.data.message,
        isInternal: validated.data.isInternal,
        createdAt: new Date().toISOString(),
      });
    }

    await recordAuditLogAction({
      universityId: "00000000-0000-0000-0000-000000000001",
      actorId: "00000000-0000-0000-0000-000000000100",
      actorRole: "staff",
      action: "update_ticket_status",
      targetType: "help_request",
      targetId: demo?.referenceNo || validated.data.ticketId,
      details: {
        newStatus: validated.data.status,
        message: validated.data.message,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/help-desk");
    return { success: true, message: "Ticket status successfully updated." };
  }

  if (!user) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  const supabase = await createClient();

  // Get current ticket status
  const { data: ticket } = await supabase
    .from("help_requests")
    .select("id, reference_no, university_id, status, is_sensitive, assigned_staff_id")
    .eq("id", validated.data.ticketId)
    .single();

  if (!ticket) {
    return { success: false, message: "Ticket record not found." };
  }

  // Update ticket
  const updatePayload: Record<string, unknown> = {
    status: validated.data.status,
    updated_at: new Date().toISOString(),
  };
  if (validated.data.resolutionNotes) {
    updatePayload.resolution_notes = validated.data.resolutionNotes;
  }
  if (validated.data.status === "resolved" || validated.data.status === "closed") {
    updatePayload.resolved_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("help_requests")
    .update(updatePayload)
    .eq("id", ticket.id);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // Insert timeline entry
  await supabase.from("help_request_updates").insert({
    help_request_id: ticket.id,
    author_id: user.id,
    status_from: ticket.status,
    status_to: validated.data.status,
    message: validated.data.message,
    is_internal: validated.data.isInternal,
  });

  // Record audit log
  await recordAuditLogAction({
    universityId: ticket.university_id,
    actorId: user.id,
    actorRole: "staff",
    action: "update_ticket_status",
    targetType: "help_request",
    targetId: ticket.reference_no,
    details: {
      statusFrom: ticket.status,
      statusTo: validated.data.status,
      isInternal: validated.data.isInternal,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/help-desk");
  return { success: true, message: "Ticket status successfully updated." };
}

/**
 * 6. Assign Ticket Staff Action (Staff / Admin)
 */
export async function assignTicketStaffAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
}> {
  const rawData = {
    ticketId: formData.get("ticketId"),
    staffId: formData.get("staffId"),
    note: formData.get("note") || "",
  };

  const validated = ticketAssignStaffSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || "Invalid assignment data",
    };
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  if (!user && demoEmail) {
    const demo = DEMO_TICKETS.find((t) => t.id === validated.data.ticketId);
    if (demo) {
      demo.assignedStaffId = validated.data.staffId;
      demo.assignedStaffName = "Assigned Support Officer";
      demo.updatedAt = new Date().toISOString();

      if (!DEMO_TIMELINE[demo.referenceNo]) {
        DEMO_TIMELINE[demo.referenceNo] = [];
      }
      DEMO_TIMELINE[demo.referenceNo].push({
        id: `timeline-${Date.now()}`,
        ticketId: demo.id,
        authorId: "00000000-0000-0000-0000-000000000100",
        authorName: "SMU Registrar & Academic Affairs",
        authorRole: "staff",
        statusFrom: demo.status,
        statusTo: demo.status,
        message: validated.data.note || "Ticket assigned to departmental officer.",
        isInternal: true,
        createdAt: new Date().toISOString(),
      });
    }

    await recordAuditLogAction({
      universityId: "00000000-0000-0000-0000-000000000001",
      actorId: "00000000-0000-0000-0000-000000000100",
      actorRole: "staff",
      action: "assign_ticket",
      targetType: "help_request",
      targetId: demo?.referenceNo || validated.data.ticketId,
      details: { assignedStaffId: validated.data.staffId },
    });

    revalidatePath("/admin");
    return { success: true, message: "Ticket assigned successfully." };
  }

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("help_requests")
    .select("id, reference_no, university_id, status")
    .eq("id", validated.data.ticketId)
    .single();

  if (!ticket) {
    return { success: false, message: "Ticket not found." };
  }

  const { error } = await supabase
    .from("help_requests")
    .update({
      assigned_staff_id: validated.data.staffId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);

  if (error) {
    return { success: false, message: error.message };
  }

  await supabase.from("help_request_updates").insert({
    help_request_id: ticket.id,
    author_id: user.id,
    status_from: ticket.status,
    status_to: ticket.status,
    message: validated.data.note || "Ticket assigned to staff member.",
    is_internal: true,
  });

  await recordAuditLogAction({
    universityId: ticket.university_id,
    actorId: user.id,
    actorRole: "staff",
    action: "assign_ticket",
    targetType: "help_request",
    targetId: ticket.reference_no,
    details: { assignedStaffId: validated.data.staffId },
  });

  revalidatePath("/admin");
  return { success: true, message: "Ticket assigned successfully." };
}

/**
 * 7. Add Message Reply Action (Student or Staff)
 */
export async function addTicketMessageAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
}> {
  const rawData = {
    ticketId: formData.get("ticketId"),
    message: formData.get("message"),
    isInternal: formData.get("isInternal") === "true",
  };

  const validated = ticketMessageReplySchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || "Invalid message format",
    };
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;
  const demoRole = cookieStore.get("smu_demo_role")?.value;

  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  if (!user && demoEmail) {
    const demo = DEMO_TICKETS.find((t) => t.id === validated.data.ticketId);
    if (demo) {
      if (!DEMO_TIMELINE[demo.referenceNo]) {
        DEMO_TIMELINE[demo.referenceNo] = [];
      }
      DEMO_TIMELINE[demo.referenceNo].push({
        id: `reply-${Date.now()}`,
        ticketId: demo.id,
        authorId: demoRole === "staff" ? "00000000-0000-0000-0000-000000000100" : "00000000-0000-0000-0000-000000000102",
        authorName: demoRole === "staff" ? "SMU Registrar & Academic Affairs" : "Alex Mutua",
        authorRole: demoRole === "staff" ? "staff" : "student",
        statusFrom: demo.status,
        statusTo: demo.status,
        message: validated.data.message,
        isInternal: validated.data.isInternal,
        createdAt: new Date().toISOString(),
      });
      demo.updatedAt = new Date().toISOString();
    }
    revalidatePath("/help-desk");
    revalidatePath("/admin");
    return { success: true, message: "Reply added successfully." };
  }

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("help_request_updates").insert({
    help_request_id: validated.data.ticketId,
    author_id: user.id,
    message: validated.data.message,
    is_internal: validated.data.isInternal,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/help-desk");
  revalidatePath("/admin");
  return { success: true, message: "Reply added successfully." };
}
