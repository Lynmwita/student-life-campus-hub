// Internal server module: never expose this writer as a browser Server Action.

import { demoSessionEmail, demoSessionRole } from "@/lib/security/demo-session";

import { createClient } from "@/lib/supabase/server";
import {createAdminClient} from '@/lib/supabase/admin';
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
  let db;
  let user: {id:string;email?:string} | null = null;
  let role=params.actorRole;
  try {db=await createClient();user=(await db.auth.getUser()).data.user;} catch {}
  if(user){
    const {data:member}=await db!.from('university_memberships').select('role').eq('user_id',user.id).eq('university_id',params.universityId).eq('verification_status','verified').maybeSingle();
    if(!member)return {success:false};
    params={...params,actorId:user.id,actorRole:member.role};role=member.role;
    if(!process.env.SUPABASE_SERVICE_ROLE_KEY)return {success:false};
    db=createAdminClient();
  } else if(params.actorRole==='system_scheduler' && process.env.SUPABASE_SERVICE_ROLE_KEY){
    db=createAdminClient();
  } else {
    let email: string | undefined;
    try{email=demoSessionEmail((await cookies()).get('smu_demo_session')?.value);}catch{}
    if(!email && process.env.NODE_ENV!=='test')return {success:false};
    role=demoSessionRole(email)??'student';
    // Demo records stay in the demo store; never substitute them for real audit records.
    const id=crypto.randomUUID();DEMO_AUDIT_LOGS.unshift({id,universityId:params.universityId,actorId:email??'test',actorName:email??'Test actor',actorRole:role,action:params.action,targetType:params.targetType,targetId:params.targetId??null,details:params.details??{},createdAt:new Date().toISOString()});return {success:true,id};
  }
  // Authenticated audit entries are durable and never merged into shared demo state.
  try {
    const supabase = db!;
    const { data, error } = await supabase
      .from("audit_log")
      .insert({
        actor_id: user?.id ?? null,
        action: params.action,
        entity_type: params.targetType,
        entity_id: params.targetId || null,
        details: {
          ...params.details,
          university_id: params.universityId,
          actor_role: role,
          ip_address: params.ipAddress || null,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Audit log insert skipped (offline / mock):", error.message);
      return { success: false };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.warn("Audit log recording error:", err);
    return { success: false };
  }
}

export async function getAuditLogsAction(): Promise<AuditLogsResponse> {
  let demoEmail: string | undefined;
  let demoRole: string | undefined;
  try {
    const cookieStore = await cookies();
    demoEmail = demoSessionEmail(cookieStore.get("smu_demo_session")?.value);
    demoRole = demoSessionRole(demoEmail);
  } catch {
    // outside request scope
  }

  const isTestEnv = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
  if (isTestEnv) {
    return {
      success: true,
      logs: DEMO_AUDIT_LOGS,
    };
  }

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

  if (!membership || membership.verification_status!=='verified' || (membership.role !== "staff" && membership.role !== "admin" && membership.role !== "super_admin")) {
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
    .eq('details->>university_id',membership.university_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !logs || logs.length === 0) {
    return {
      success: !error,
      logs: [],
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
