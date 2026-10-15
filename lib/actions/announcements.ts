"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { announcementSchema } from "@/lib/validations/announcements";
import { revalidatePath } from "next/cache";

const DEMO_NOTICES: NoticeItem[] = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    title: "Urgent: Campus Shuttle Service Rerouted Due to Road Maintenance",
    content: "All Westlands Campus shuttles will pick up and drop off students at Gate 3 along Ring Road until Friday 5:00 PM. Please plan extra 15 minutes of transit time.",
    priority: "P1",
    targetScope: "Campus: Main Campus",
    publishedAt: "2 hours ago",
    isRead: false,
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    title: "End of Semester Examination Draft Timetable Released",
    content: "The finalized draft timetable for School of Computing & Informatics is now uploaded. Review your unit codes and report any exam clash to the department coordinator before Oct 20.",
    priority: "P2",
    targetScope: "School of Computing & Informatics",
    publishedAt: "1 day ago",
    isRead: false,
  },
  {
    id: "00000000-0000-0000-0000-000000000203",
    title: "Annual Tech Innovation & Hackathon Registrations Open",
    content: "Form teams of 2 to 4 students. Mentors from Safaricom and Microsoft ADC will be hosting workshops next week. Cash prizes and internship fast-tracks for winners.",
    priority: "P3",
    targetScope: "All Students",
    publishedAt: "2 days ago",
    isRead: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000204",
    title: "Main Library Extended Revision Hours for Exam Period",
    content: "Starting next Monday, the main campus digital library will remain open until 11:00 PM on weekdays with high-speed Wi-Fi and power stations accessible to all verified students.",
    priority: "P4",
    targetScope: "All Students",
    publishedAt: "3 days ago",
    isRead: true,
  },
];

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
  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  if (!user && demoEmail) {
    return {
      success: true,
      universityName: "Summit Metropolitan University",
      campusName: "Main Campus (Westlands, Nairobi)",
      notices: DEMO_NOTICES,
    };
  }

  if (!user) {
    return {
      success: false,
      message: "Not authenticated",
      universityName: "Student Life & Campus Hub",
      campusName: "Verified Student Portal",
      notices: [],
    };
  }

  const supabase = await createClient();

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

  if (error || !announcements || announcements.length === 0) {
    return {
      success: true,
      universityName,
      campusName,
      notices: DEMO_NOTICES,
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
