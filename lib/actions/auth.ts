"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, onboardingSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = loginSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid credentials",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  redirect("/dashboard");
}

export async function registerAction(formData: FormData): Promise<ActionResponse> {
  const rawData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid registration data",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        full_name: validated.data.fullName,
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  redirect("/onboarding");
}

export async function submitOnboardingAction(formData: FormData): Promise<ActionResponse> {
  const rawData = {
    universityId: formData.get("universityId"),
    campusId: formData.get("campusId"),
    registrationNumber: formData.get("registrationNumber"),
    faculty: formData.get("faculty"),
    department: formData.get("department"),
    programOfStudy: formData.get("programOfStudy"),
    yearOfStudy: formData.get("yearOfStudy"),
    idDocumentUrl: formData.get("idDocumentUrl") || "",
  };

  const validated = onboardingSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid onboarding details",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be signed in to complete student onboarding",
    };
  }

  const { error } = await supabase.from("university_memberships").insert({
    user_id: user.id,
    university_id: validated.data.universityId,
    campus_id: validated.data.campusId,
    role: "student",
    registration_number: validated.data.registrationNumber,
    faculty: validated.data.faculty,
    department: validated.data.department,
    program_of_study: validated.data.programOfStudy,
    year_of_study: validated.data.yearOfStudy,
    verification_status: "pending",
    id_document_url: validated.data.idDocumentUrl || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  redirect("/verification-status");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
