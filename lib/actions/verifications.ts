"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface VerificationResponse {
  success: boolean;
  message: string;
}

export async function verifyStudentAction(
  membershipId: string,
  notes: string = "Verified by university administration"
): Promise<VerificationResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized: Please sign in as university staff." };
  }

  // Update membership using RLS-enforced update
  const { error } = await supabase
    .from("university_memberships")
    .update({
      verification_status: "verified",
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      verification_notes: notes,
    })
    .eq("id", membershipId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/verifications");
  return { success: true, message: "Student enrollment verified successfully." };
}

export async function rejectStudentAction(
  membershipId: string,
  reason: string = "Credentials do not match university records"
): Promise<VerificationResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized: Please sign in as university staff." };
  }

  const { error } = await supabase
    .from("university_memberships")
    .update({
      verification_status: "rejected",
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      verification_notes: reason,
    })
    .eq("id", membershipId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/verifications");
  return { success: true, message: "Student application marked as rejected." };
}

export async function requestClarificationAction(
  membershipId: string,
  notes: string
): Promise<VerificationResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized: Please sign in as university staff." };
  }

  const { error } = await supabase
    .from("university_memberships")
    .update({
      verification_status: "requires_review",
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      verification_notes: notes,
    })
    .eq("id", membershipId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/verifications");
  return { success: true, message: "Requested clarification from student." };
}
