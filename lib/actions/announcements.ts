"use server";

import { createClient } from "@/lib/supabase/server";
import { announcementSchema } from "@/lib/validations/announcements";
import { revalidatePath } from "next/cache";

export interface AnnouncementActionResponse {
  success: boolean;
  message: string;
}

export async function createAnnouncementAction(
  formData: FormData
): Promise<AnnouncementActionResponse> {
  const rawData = {
    universityId: formData.get("universityId"),
    campusId: formData.get("campusId") || "",
    title: formData.get("title"),
    content: formData.get("content"),
    priority: formData.get("priority"),
    targetScope: formData.get("targetScope"),
    targetFaculty: formData.get("targetFaculty") || "",
    targetDepartment: formData.get("targetDepartment") || "",
    targetYear: formData.get("targetYear") || 0,
    expiresAt: formData.get("expiresAt") || "",
    isPublished: formData.get("isDraft") !== "true",
  };

  const validated = announcementSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || "Invalid announcement details",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Unauthorized: You must be logged in as university staff to post announcements.",
    };
  }

  let formattedExpiresAt: string | null = null;
  if (validated.data.expiresAt && validated.data.expiresAt.trim() !== "") {
    const parsedDate = new Date(validated.data.expiresAt);
    if (!isNaN(parsedDate.getTime())) {
      formattedExpiresAt = parsedDate.toISOString();
    }
  }

  const { error } = await supabase.from("announcements").insert({
    university_id: validated.data.universityId,
    campus_id: validated.data.campusId || null,
    author_id: user.id,
    title: validated.data.title,
    content: validated.data.content,
    priority: validated.data.priority,
    target_scope: validated.data.targetScope,
    target_faculty: validated.data.targetFaculty || null,
    target_department: validated.data.targetDepartment || null,
    target_year: validated.data.targetYear && validated.data.targetYear > 0 ? validated.data.targetYear : null,
    is_published: validated.data.isPublished,
    published_at: new Date().toISOString(),
    expires_at: formattedExpiresAt,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    message: validated.data.isPublished
      ? "Announcement published and broadcast to students."
      : "Announcement saved as draft.",
  };
}

export async function markAnnouncementAsReadAction(
  announcementId: string
): Promise<AnnouncementActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  const { error } = await supabase.from("announcement_reads").insert({
    announcement_id: announcementId,
    user_id: user.id,
  });

  // PostgreSQL error 23505 is unique_violation
  if (error && error.code !== "23505") {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Marked as read." };
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  priority: "P1" | "P2" | "P3" | "P4";
  targetScope: string;
  publishedAt: string;
  isRead: boolean;
}

export interface StudentDashboardData {
  success: boolean;
  message?: string;
  universityName: string;
  campusName: string;
  notices: NoticeItem[];
}

export async function getStudentAnnouncementsAction(): Promise<StudentDashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Not authenticated",
      universityName: "Student Life & Campus Hub",
      campusName: "Verified Student Portal",
      notices: [],
    };
  }

  // Get student's verified membership with university and campus details
  const { data: memberships } = await supabase
    .from("university_memberships")
    .select(`
      university_id,
      campus_id,
      faculty,
      department,
      year_of_study,
      verification_status,
      universities (name, slug),
      campuses (name)
    `)
    .eq("user_id", user.id)
    .eq("verification_status", "verified")
    .limit(1);

  const activeMembership = memberships && memberships.length > 0 ? memberships[0] : null;

  const universityName =
    (activeMembership?.universities as unknown as { name?: string } | null)?.name ||
    "Summit Metropolitan University";
  const campusName =
    (activeMembership?.campuses as unknown as { name?: string } | null)?.name ||
    "Main Campus";

  // Fetch announcements for this user. RLS automatically filters published & targeted announcements.
  const { data: announcements, error } = await supabase
    .from("announcements")
    .select(`
      id,
      title,
      content,
      priority,
      target_scope,
      target_faculty,
      target_department,
      target_year,
      published_at,
      campuses (name),
      announcement_reads (user_id)
    `)
    .order("published_at", { ascending: false });

  if (error || !announcements) {
    return {
      success: true,
      universityName,
      campusName,
      notices: [],
    };
  }

  const notices: NoticeItem[] = announcements.map((item) => {
    let scopeLabel = "All Students";
    if (item.target_scope === "campus") {
      const campName = (item.campuses as unknown as { name?: string } | null)?.name;
      scopeLabel = campName ? `Campus: ${campName}` : "Campus";
    } else if (item.target_scope === "faculty" && item.target_faculty) {
      scopeLabel = item.target_faculty;
    } else if (item.target_scope === "department" && item.target_department) {
      scopeLabel = `Dept: ${item.target_department}`;
    } else if (item.target_scope === "year" && item.target_year) {
      scopeLabel = `Year ${item.target_year}`;
    }

    const pubDate = new Date(item.published_at);
    const dateFormatted = !isNaN(pubDate.getTime())
      ? pubDate.toLocaleDateString("en-KE", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Recent";

    const reads = item.announcement_reads as unknown as Array<{ user_id: string }> | null;
    const hasRead = Array.isArray(reads) ? reads.some((r) => r.user_id === user.id) : false;

    return {
      id: item.id,
      title: item.title,
      content: item.content,
      priority: item.priority as "P1" | "P2" | "P3" | "P4",
      targetScope: scopeLabel,
      publishedAt: dateFormatted,
      isRead: hasRead,
    };
  });

  return {
    success: true,
    universityName,
    campusName,
    notices,
  };
}
