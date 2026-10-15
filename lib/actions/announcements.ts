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
    is_published: true,
    published_at: new Date().toISOString(),
    expires_at: validated.data.expiresAt ? new Date(validated.data.expiresAt).toISOString() : null,
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
    message: "Announcement published and broadcast to students.",
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

  if (error && !error.message.includes("duplicate")) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Marked as read." };
}
