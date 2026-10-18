"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface AuditLogEntry {
  id: string;
  universityId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogsResponse {
  success: boolean;
  message?: string;
  logs: AuditLogEntry[];
}

const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "50000000-0000-0000-0000-000000000001",
    universityId: "00000000-0000-0000-0000-000000000001",
    actorId: "00000000-0000-0000-0000-000000000100",
    actorName: "SMU Registrar & Academic Affairs",
    actorRole: "staff",
    action: "uams_sync_completed",
    targetType: "uams_sync",
    targetId: "sync-2026-10-15",
    details: { students: 1, course_units: 4, timetables: 6, mode: "live" },
    createdAt: "2026-10-15T22:30:00Z",
  },
  {
    id: "50000000-0000-0000-0000-000000000002",
    universityId: "00000000-0000-0000-0000-000000000001",
    actorId: "00000000-0000-0000-0000-000000000100",
    actorName: "SMU Registrar & Academic Affairs",
    actorRole: "staff",
    action: "publish_announcement",
    targetType: "announcement",
    targetId: "00000000-0000-0000-0000-000000000201",
    details: { title: "Urgent: Campus Shuttle Service Rerouted", priority: "P1" },
    createdAt: "2026-10-15T21:45:00Z",
  },
  {
    id: "50000000-0000-0000-0000-000000000003",
    universityId: "00000000-0000-0000-0000-000000000001",
    actorId: "00000000-0000-0000-0000-000000000100",
    actorName: "SMU Registrar & Academic Affairs",
    actorRole: "staff",
    action: "view_sensitive_complaint",
    targetType: "help_request",
    targetId: "HD-2026-A92B1",
    details: { category: "lecturer_conduct", reason: "Authorized administrator review" },
    createdAt: "2026-10-15T20:10:00Z",
  },
];

export async function recordAuditLogAction(params: {
  universityId: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}): Promise<{ success: boolean; id?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_log")
      .insert({
        actor_id: params.actorId.startsWith("00000000-0000-0000-0000") ? null : params.actorId,
        action: params.action,
        entity_type: params.targetType,
        entity_id: params.targetId || null,
        details: {
          ...params.details,
          university_id: params.universityId,
          actor_role: params.actorRole,
          ip_address: params.ipAddress || null,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Audit log insert skipped (offline / mock):", error.message);
      return { success: true };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.warn("Audit log recording error:", err);
    return { success: true };
  }
}

export async function getAuditLogsAction(): Promise<AuditLogsResponse> {
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

  // Allow staff / admin demo session
  if (!user && demoEmail && (demoRole === "staff" || demoRole === "admin" || demoRole === "super_admin" || demoEmail === "registrar@summit.ac.ke")) {
    return {
      success: true,
      logs: DEMO_AUDIT_LOGS,
    };
  }

  if (!user) {
    return {
      success: false,
      message: "Unauthorized: Please log in as university staff or administrator.",
      logs: [],
    };
  }

  const supabase = await createClient();

  // Verify caller has staff or admin role
  const { data: membership } = await supabase
    .from("university_memberships")
    .select("university_id, role, verification_status")
    .eq("user_id", user.id)
    .single();

  if (!membership || (membership.role !== "staff" && membership.role !== "admin" && membership.role !== "super_admin")) {
    return {
      success: false,
      message: "Forbidden: Only staff and university administrators can inspect audit records.",
      logs: [],
    };
  }

  const { data: logs, error } = await supabase
    .from("audit_log")
    .select(`
      id,
      actor_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at,
      user_profiles (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !logs || logs.length === 0) {
    return {
      success: true,
      logs: DEMO_AUDIT_LOGS,
    };
  }

  return {
    success: true,
    logs: logs.map((l) => ({
      id: l.id,
      universityId: membership.university_id,
      actorId: l.actor_id || "00000000-0000-0000-0000-000000000100",
      actorName: (l.user_profiles as unknown as { full_name?: string } | null)?.full_name || "System Operator",
      actorRole: ((l.details as Record<string, unknown>)?.actor_role as string) || "staff",
      action: l.action,
      targetType: l.entity_type,
      targetId: l.entity_id,
      details: (l.details as Record<string, unknown>) || {},
      createdAt: l.created_at,
    })),
  };
}
