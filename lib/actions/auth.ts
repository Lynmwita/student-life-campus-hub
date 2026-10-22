"use server";

import { demoSessionEmail, demoSessionRole } from "@/lib/security/demo-session";

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
import {
  checkRateLimit,
  resetRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";

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
    redirectUrl: "/admin",
    password: "StaffPassword123!",
  },
  "admin@summit.ac.ke": {
    role: "admin",
    redirectUrl: "/admin",
    password: "AdminPassword123!",
  },
  "root@studenthub.ac.ke": {
    role: "super_admin",
    redirectUrl: "/admin",
    password: "AdminPassword123!",
  },
};

export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`login:${ip}`, 5, 60 * 1000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds || 60} seconds before trying again.`,
    };
  }

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
      resetRateLimit(`login:${ip}`);
      // Check user membership role to route admin and staff directly to staff console
      const { data: { user } } = await supabase.auth.getUser();
      let targetPath = "/dashboard";
      if (user) {
        const { data: membership } = await supabase
          .from("university_memberships")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        const role = membership?.role || (user.app_metadata?.role as string);
        if (role === "admin" || role === "super_admin") {
          targetPath = "/admin";
        } else if (role === "staff") {
          targetPath = "/announcements/new";
        }
      }
      redirect(targetPath);
    }
  } catch (err: unknown) {
    // Next.js redirect throws NEXT_REDIRECT, rethrow
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    // Network or placeholder error, fall through to check demo credentials
  }

  // Allow fallback authentication for known demo/pilot accounts if Supabase Auth encounters schema errors or unseeded status
  const allowDemoFallback =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true" ||
    process.env.NODE_ENV !== "production";

  if (allowDemoFallback && demoAccount && validated.data.password === demoAccount.password) {
    resetRateLimit(`login:${ip}`);
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
    error: "Invalid email or password.",
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
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`pwd_reset:${ip}`, 3, 60 * 1000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: `Too many password reset requests. Please wait ${rateLimit.retryAfterSeconds || 60} seconds before trying again.`,
    };
  }

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

export async function getUserRoleAction(): Promise<{
  isAuthenticated: boolean;
  role: "student" | "staff" | "admin" | "super_admin";
  email?: string;
  accountId?: string;
  fullName?: string;
  registrationNumber?: string;
  isAdmin: boolean;
  isStaff: boolean;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data: membership } = await supabase
        .from("university_memberships")
        .select("role, registration_number")
        .eq("user_id", user.id)
        .maybeSingle();

      const role = (membership?.role || user.app_metadata?.role || "student") as "student" | "staff" | "admin" | "super_admin";
      const isAdmin = role === "admin" || role === "super_admin";
      const isStaff = isAdmin || role === "staff";

      return {
        isAuthenticated: true,
        accountId: user.id,
        role,
        email: user.email || profile?.email,
        fullName: profile?.full_name || user.user_metadata?.full_name || (user.email ? user.email.split("@")[0] : "User"),
        registrationNumber: membership?.registration_number || user.user_metadata?.registration_number,
        isAdmin,
        isStaff,
      };
    }
  } catch {
    // offline fallback
  }

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get("smu_demo_session")?.value);
  const demoRole = demoSessionRole(demoEmail);

  if (demoEmail) {
    const role = (demoRole || (demoEmail.includes("registrar") || demoEmail.includes("admin") ? "admin" : demoEmail.includes("staff") ? "staff" : "student")) as "student" | "staff" | "admin" | "super_admin";
    const isAdmin = role === "admin" || role === "super_admin";
    const isStaff = isAdmin || role === "staff";
    return {
      isAuthenticated: true,
      accountId: `demo:${demoEmail}`,
      role,
      email: demoEmail,
      fullName: demoEmail.includes("alex") ? "Alex Mutua" : demoEmail.includes("registrar") ? "Registrar Academic Affairs" : demoEmail.includes("admin") ? "System Administrator" : "Student",
      registrationNumber: "BIT/2023/8849",
      isAdmin,
      isStaff,
    };
  }

  return {
    isAuthenticated: false,
    role: "student",
    isAdmin: false,
    isStaff: false,
  };
}
