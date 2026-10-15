"use server";

import { createClient } from "@/lib/supabase/server";
import { CANONICAL_INTEREST_IDS } from "@/lib/constants/interests";
import { revalidatePath } from "next/cache";

export interface InterestsActionResponse {
  success: boolean;
  message: string;
}

/**
 * Validates and saves at least 3 selected interests for the authenticated student.
 */
export async function saveStudentInterestsAction(
  interests: string[]
): Promise<InterestsActionResponse> {
  if (!Array.isArray(interests) || interests.length < 3) {
    return {
      success: false,
      message: "Please select at least 3 interests to personalize your campus experience.",
    };
  }

  // Verify all chosen interests are in the canonical list
  const invalidInterests = interests.filter(
    (item) => !CANONICAL_INTEREST_IDS.includes(item)
  );

  if (invalidInterests.length > 0) {
    return {
      success: false,
      message: "One or more selected interests are not recognized.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Unauthorized: You must be logged in to save your interests.",
    };
  }

  // Ensure user has a profile record in user_profiles
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("user_profiles").insert({
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "Student",
    });
  }

  // Insert or upsert interests
  const rows = interests.map((interest) => ({
    user_id: user.id,
    interest,
  }));

  const { error } = await supabase
    .from("student_interests")
    .upsert(rows, { onConflict: "user_id, interest" });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to save student interests.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding/interests");

  return {
    success: true,
    message: "Student interests successfully recorded.",
  };
}

/**
 * Fetches the student's currently saved interests.
 */
export async function getStudentInterestsAction(): Promise<{
  success: boolean;
  interests: string[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, interests: [] };
  }

  const { data, error } = await supabase
    .from("student_interests")
    .select("interest")
    .eq("user_id", user.id);

  if (error || !data) {
    return { success: false, interests: [] };
  }

  return {
    success: true,
    interests: data.map((d) => d.interest),
  };
}
