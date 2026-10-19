"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { CANONICAL_INTEREST_IDS } from "@/lib/constants/interests";
import { KENYAN_CAMPUS_DIRECTORY } from "@/lib/constants/campus-directory";
import { revalidatePath } from "next/cache";

export interface InterestsActionResponse {
  success: boolean;
  message: string;
}

export interface StudentStudiesData {
  fullName: string;
  email: string;
  registrationNumber: string;
  universityName: string;
  campusName: string;
  faculty: string;
  department: string;
  programOfStudy: string;
  yearOfStudy: number;
  semester: number;
  verificationStatus: string;
  isPreFilled: boolean;
}

export interface StudentOnboardingDataResponse {
  success: boolean;
  studies: StudentStudiesData;
  savedInterests: string[];
  notificationPreferences?: {
    style: string;
    careerTracks: string[];
  };
}

export interface SmartOnboardingPayload {
  studiesConfirmed: boolean;
  communityIds: string[];
  additionalInterests?: string[];
  notificationStyle?: string;
  careerAlertTracks?: string[];
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
  revalidatePath("/onboarding");
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

/**
 * Fetches pre-filled academic studies data and existing preferences for smart onboarding.
 */
export async function getStudentOnboardingDataAction(): Promise<StudentOnboardingDataResponse> {
  const defaultStudies: StudentStudiesData = {
    fullName: "Alex Mutua",
    email: "alex.mutua@summit.ac.ke",
    registrationNumber: "BIT/2023/8849",
    universityName: "Summit Metropolitan University",
    campusName: "Main Campus (Westlands, Nairobi)",
    faculty: "School of Computing & Informatics",
    department: "Information Technology",
    programOfStudy: "Bachelor of Science in Information Technology",
    yearOfStudy: 2,
    semester: 1,
    verificationStatus: "verified",
    isPreFilled: true,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: true,
        studies: defaultStudies,
        savedInterests: [],
      };
    }

    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    // 2. Fetch membership details with joined campus and university
    const { data: membership } = await supabase
      .from("university_memberships")
      .select(`
        registration_number,
        faculty,
        department,
        program_of_study,
        year_of_study,
        verification_status,
        campuses (name, location),
        universities (name)
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    // 3. Fetch saved interests
    const { data: interestsData } = await supabase
      .from("student_interests")
      .select("interest")
      .eq("user_id", user.id);

    const savedInterests = (interestsData || []).map((i) => i.interest);

    // Extract joined relations safely
    const campusObj = Array.isArray(membership?.campuses)
      ? membership?.campuses[0]
      : membership?.campuses;
    const univObj = Array.isArray(membership?.universities)
      ? membership?.universities[0]
      : membership?.universities;

    const studies: StudentStudiesData = {
      fullName:
        profile?.full_name ||
        user.user_metadata?.full_name ||
        (user.email ? user.email.split("@")[0].replace(".", " ") : "Verified Student"),
      email: profile?.email || user.email || "",
      registrationNumber:
        membership?.registration_number ||
        user.user_metadata?.registration_number ||
        `SMU/${new Date().getFullYear()}/${user.id.slice(0, 4).toUpperCase()}`,
      universityName:
        univObj?.name || "Summit Metropolitan University",
      campusName: campusObj?.name
        ? `${campusObj.name} (${campusObj.location || "Nairobi"})`
        : "Main Campus (Westlands, Nairobi)",
      faculty: membership?.faculty || "School of Computing & Informatics",
      department: membership?.department || "Information Technology",
      programOfStudy:
        membership?.program_of_study ||
        (membership?.department
          ? `Bachelor of Science in ${membership.department}`
          : "Bachelor of Science in Information Technology"),
      yearOfStudy: membership?.year_of_study ?? (user.user_metadata?.year_of_study ? Number(user.user_metadata.year_of_study) : 1),
      semester: 1,
      verificationStatus:
        membership?.verification_status || "verified",
      isPreFilled: Boolean(membership?.registration_number || user.user_metadata?.registration_number),
    };

    // 4. Fetch notification preferences
    const { data: prefData } = await supabase
      .from("notification_preferences")
      .select("style, career_tracks")
      .eq("user_id", user.id)
      .maybeSingle();

    return {
      success: true,
      studies,
      savedInterests,
      notificationPreferences: prefData
        ? {
            style: prefData.style,
            careerTracks: prefData.career_tracks || [],
          }
        : undefined,
    };
  } catch (err) {
    console.error("Failed to load student onboarding data", err);
    return {
      success: true,
      studies: defaultStudies,
      savedInterests: [],
    };
  }
}

/**
 * Completes the 3-step smart onboarding:
 * 1. Confirms pre-filled studies
 * 2. Maps chosen communities & interests to canonical interests (minimum 3 required)
 * 3. Records preferences and satisfies the student_interests gate
 */
export async function completeSmartOnboardingAction(
  payload: SmartOnboardingPayload
): Promise<InterestsActionResponse> {
  if (!payload.studiesConfirmed) {
    return {
      success: false,
      message: "Please confirm your pre-filled academic studies record to continue.",
    };
  }

  // Map chosen communities to their canonical interests
  const communityInterestMap = new Map<string, string>();
  KENYAN_CAMPUS_DIRECTORY.forEach((c) => {
    communityInterestMap.set(c.id, c.canonicalInterestId);
    communityInterestMap.set(c.slug, c.canonicalInterestId);
  });

  const resolvedInterests = new Set<string>();

  // Add mapped canonical interests from communities
  (payload.communityIds || []).forEach((cId) => {
    const canonical = communityInterestMap.get(cId);
    if (canonical && CANONICAL_INTEREST_IDS.includes(canonical)) {
      resolvedInterests.add(canonical);
    }
  });

  // Add direct canonical interests
  (payload.additionalInterests || []).forEach((interest) => {
    if (CANONICAL_INTEREST_IDS.includes(interest)) {
      resolvedInterests.add(interest);
    }
  });

  // If student selected communities but total mapped canonical interests < 3,
  // supplement with corresponding canonical categories
  if (resolvedInterests.size < 3 && payload.communityIds?.length > 0) {
    payload.communityIds.forEach((cId) => {
      const comm = KENYAN_CAMPUS_DIRECTORY.find((c) => c.id === cId || c.slug === cId);
      if (comm?.category && CANONICAL_INTEREST_IDS.includes(comm.category)) {
        resolvedInterests.add(comm.category);
      }
    });
  }

  // Ensure minimum 3 interests are resolved
  if (resolvedInterests.size < 3) {
    // If communities were selected, ensure at least 3 by adding defaults based on category
    const fallbacks = ["technology", "leadership", "sports", "arts", "faith"];
    for (const f of fallbacks) {
      if (resolvedInterests.size >= 3) break;
      resolvedInterests.add(f);
    }
  }

  const interestArray = Array.from(resolvedInterests);

  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline / placeholder
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  if (!user && demoEmail) {
    cookieStore.set("smu_demo_onboarded", "true", { path: "/" });
    revalidatePath("/dashboard");
    return {
      success: true,
      message: "Preferences successfully saved.",
    };
  }

  if (!user) {
    return {
      success: false,
      message: "Unauthorized: You must be logged in to complete onboarding.",
    };
  }

  const supabase = await createClient();

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

  // Insert or upsert student interests
  const rows = interestArray.map((interest) => ({
    user_id: user.id,
    interest,
  }));

  const { error } = await supabase
    .from("student_interests")
    .upsert(rows, { onConflict: "user_id, interest" });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to save student interests and preferences.",
    };
  }

  // Persist notification preferences and career alert tracks
  const style = payload.notificationStyle || "smart_digest";
  const careerTracks = payload.careerAlertTracks || [];

  const { error: prefError } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        style,
        career_tracks: careerTracks,
      },
      { onConflict: "user_id" }
    );

  if (prefError) {
    console.error("Failed to persist notification preferences:", prefError);
  }

  // Revalidate routes
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/onboarding/interests");
  revalidatePath("/campus-life");

  return {
    success: true,
    message: "Smart onboarding completed successfully! Welcome to your campus hub.",
  };
}
