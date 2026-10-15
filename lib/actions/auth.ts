"use server";

import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

import { cookies } from "next/headers";

const DEMO_ACCOUNTS: Record<string, { role: string; redirectUrl: string; password: string }> = {
  "student@summit.ac.ke": {
    role: "student",
    redirectUrl: "/onboarding",
    password: "StudentPassword123!",
  },
  "alex.mutua@summit.ac.ke": {
    role: "student",
    redirectUrl: "/dashboard",
    password: "StudentPassword123!",
  },
  "registrar@summit.ac.ke": {
    role: "staff",
    redirectUrl: "/announcements/new",
    password: "StaffPassword123!",
  },
  "root@studenthub.ac.ke": {
    role: "super_admin",
    redirectUrl: "/dashboard",
    password: "AdminPassword123!",
  },
};

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

  const emailLower = validated.data.email.toLowerCase().trim();
  const demoAccount = DEMO_ACCOUNTS[emailLower];

  // Try standard Supabase authentication first
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validated.data.email,
      password: validated.data.password,
    });

    if (!error) {
      redirect("/dashboard");
    }
  } catch (err: unknown) {
    // Next.js redirect throws NEXT_REDIRECT, rethrow
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    // Network or placeholder error, fall through to check demo credentials
  }

  // If Supabase failed or placeholder URL is in use, verify demo account
  if (demoAccount && validated.data.password === demoAccount.password) {
    const cookieStore = await cookies();
    cookieStore.set("smu_demo_session", emailLower, {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });
    cookieStore.set("smu_demo_role", demoAccount.role, {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });
    redirect(demoAccount.redirectUrl);
  }

  return {
    success: false,
    error: "Invalid email or password. Use demo credentials to inspect.",
  };
}

export async function signOutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("smu_demo_session");
    cookieStore.delete("smu_demo_role");
    cookieStore.delete("smu_demo_onboarded");
  } catch {
    // ignore
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  redirect("/login");
}

export async function requestPasswordResetAction(
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    email: formData.get("email"),
  };

  const validated = forgotPasswordSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid email address",
    };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function updatePasswordAction(
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validated = resetPasswordSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid password details",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}
