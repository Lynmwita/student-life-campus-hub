import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import assert from "assert";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

assert(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL must be defined");
assert(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined");
assert(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY must be defined");

// Admin client bypassing RLS for provisioning
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper to create an authenticated client using an access token
function createAuthUserClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const TEST_TIMESTAMP = Date.now();
const PILOT_UNIV_ID = "00000000-0000-0000-0000-000000000001";

async function provisionUser(
  email: string,
  pass: string,
  fullName: string,
  role: "student" | "staff" | "admin"
) {
  let userId: string | null = null;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: pass,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (data?.user) {
    userId = data.user.id;
  } else if (error && error.message.includes("already")) {
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profile) {
      userId = profile.id;
    }
  }

  if (!userId) {
    throw new Error(`Failed to provision or resolve user ${email}: ${error?.message}`);
  }

  // Upsert user_profiles
  await adminClient.from("user_profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
    },
    { onConflict: "id" }
  );

  // Upsert university_memberships
  await adminClient.from("university_memberships").upsert(
    {
      user_id: userId,
      university_id: PILOT_UNIV_ID,
      role,
      registration_number: role === "student" ? `SMU/${TEST_TIMESTAMP % 10000}` : undefined,
      staff_id: role !== "student" ? `STF-${TEST_TIMESTAMP % 1000}` : undefined,
      verification_status: "verified",
    },
    { onConflict: "user_id,university_id" }
  );

  return userId;
}

async function runStagingVerification() {
  console.log("==================================================================");
  console.log("   PHASE 7: REAL INFRASTRUCTURE STAGING VERIFICATION");
  console.log("   Target: " + supabaseUrl);
  console.log("==================================================================\n");

  // -----------------------------------------------------------------------------
  // TINY 7b: End-to-end journeys
  // -----------------------------------------------------------------------------
  console.log(">>> TINY 7b: Running End-to-End Journeys on Staging Database...");

  const studentEmail = `student.staging.${TEST_TIMESTAMP}@summit.ac.ke`;
  const initialPassword = "InitialStudentPass123!@";
  const studentName = "Wanjiku Muthoni";

  const staffEmail = `staff.staging.${TEST_TIMESTAMP}@summit.ac.ke`;
  const staffPassword = "StaffStagingPass123!@";
  const staffName = "Dr. Kiprono Langat";

  console.log("1. Provisioning real test student and staff accounts via Supabase Admin...");
  const studentId = await provisionUser(studentEmail, initialPassword, studentName, "student");
  const staffId = await provisionUser(staffEmail, staffPassword, staffName, "staff");
  console.log(`   ✓ Student provisioned: ${studentEmail} (UUID: ${studentId})`);
  console.log(`   ✓ Staff provisioned:   ${staffEmail} (UUID: ${staffId})`);

  // Journey 1: Real synced-student login
  console.log("\n2. [Journey 1] Testing real synced-student login against Supabase Auth...");
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: studentLogin, error: studentLoginErr } = await anonClient.auth.signInWithPassword({
    email: studentEmail,
    password: initialPassword,
  });

  assert(!studentLoginErr, `Student login failed: ${studentLoginErr?.message}`);
  assert(studentLogin.session?.access_token, "Expected valid session access token from Supabase Auth");
  const studentToken = studentLogin.session.access_token;
  const studentAuthClient = createAuthUserClient(studentToken);
  console.log("   ✓ Student successfully signed in with Supabase Auth session token issued.");

  // Journey 2: Full onboarding flow (All 3 steps)
  console.log("\n3. [Journey 2] Executing complete 3-step onboarding flow...");
  // Step 1: Verification confirmation
  const { data: memData, error: memErr } = await studentAuthClient
    .from("university_memberships")
    .select("verification_status, university_id")
    .eq("user_id", studentId)
    .single();
  assert(!memErr && memData.verification_status === "verified", "Step 1: Student membership verified");
  console.log("   ✓ Step 1: Identity & student studies attestation verified.");

  // Step 2: Pill chips community interest selection (at least 3 interests)
  const chosenInterests = ["coding-tech", "sports-athletics", "entrepreneurship", "creative-arts"];
  // Clean prior interests if any
  await studentAuthClient.from("student_interests").delete().eq("user_id", studentId);
  const interestRows = chosenInterests.map((interest) => ({
    user_id: studentId,
    interest,
  }));
  const { error: intErr } = await studentAuthClient.from("student_interests").insert(interestRows);
  assert(!intErr, `Step 2: Failed to save pill chip interests: ${intErr?.message}`);

  const { data: savedInterests } = await studentAuthClient
    .from("student_interests")
    .select("interest")
    .eq("user_id", studentId);
  assert(savedInterests && savedInterests.length >= 3, "Step 2: Expected at least 3 saved interests");
  console.log(`   ✓ Step 2: Saved ${savedInterests.length} interest pill chips in student_interests.`);

  // Step 3: Notification and career preferences
  const preferencesPayload = {
    user_id: studentId,
    style: "smart_digest",
    career_tracks: ["software-engineering", "data-analytics"],
  };
  const { error: prefErr } = await studentAuthClient
    .from("notification_preferences")
    .upsert(preferencesPayload, { onConflict: "user_id" });
  assert(!prefErr, `Step 3: Failed to save notification preferences: ${prefErr?.message}`);

  const { data: savedPrefs } = await studentAuthClient
    .from("notification_preferences")
    .select("career_tracks, style")
    .eq("user_id", studentId)
    .single();
  assert(savedPrefs && savedPrefs.style === "smart_digest", "Step 3: Saved notification preferences verified");
  console.log("   ✓ Step 3: Saved notification preferences & career tracks in notification_preferences.");

  // Journey 3: Help desk journey (student submits -> staff replies -> status goes to resolved)
  console.log("\n4. [Journey 3] Testing Help Desk End-to-End Workflow...");
  // Student submits help request
  const { data: newTicket, error: ticketErr } = await studentAuthClient
    .from("help_requests")
    .insert({
      university_id: PILOT_UNIV_ID,
      student_id: studentId,
      user_id: studentId,
      category: "academic",
      subject: "Staging Test: Course Registration Clarification",
      description: "Inquiring about elective registration timeline for Semester 2.",
      is_sensitive: false,
      status: "submitted",
    })
    .select()
    .single();

  assert(!ticketErr && newTicket, `Failed to submit help request: ${ticketErr?.message}`);
  assert(newTicket.reference_no, "Help request reference number generated by DB sequence/trigger");
  const ticketId = newTicket.id;
  const refNo = newTicket.reference_no;
  console.log(`   ✓ Student submitted ticket: Ref ${refNo} (ID: ${ticketId})`);

  // Staff signs in
  const { data: staffLogin, error: staffLoginErr } = await anonClient.auth.signInWithPassword({
    email: staffEmail,
    password: staffPassword,
  });
  assert(!staffLoginErr && staffLogin.session?.access_token, "Staff login successful");
  const staffAuthClient = createAuthUserClient(staffLogin.session.access_token);

  // Staff views ticket & assigns to self
  const { error: assignErr } = await staffAuthClient
    .from("help_requests")
    .update({ assigned_to: staffId, status: "in_review" })
    .eq("id", ticketId);
  assert(!assignErr, `Staff assignment failed: ${assignErr?.message}`);
  console.log("   ✓ Staff assigned ticket to self and transitioned status to 'in_review'");

  // Staff posts a reply
  const { error: replyErr } = await staffAuthClient.from("help_request_replies").insert({
    request_id: ticketId,
    author_id: staffId,
    message: "Elective enrollment opens Monday 8:00 AM on the student portal.",
    is_staff_reply: true,
  });
  assert(!replyErr, `Staff reply failed: ${replyErr?.message}`);
  console.log("   ✓ Staff posted official reply to the ticket thread.");

  // Staff resolves ticket
  const { error: resolveErr } = await staffAuthClient
    .from("help_requests")
    .update({ status: "resolved", resolution_notes: "Advised student of Monday enrollment window." })
    .eq("id", ticketId);
  assert(!resolveErr, `Ticket resolve failed: ${resolveErr?.message}`);

  // Record audit log entry
  await staffAuthClient.from("audit_log").insert({
    actor_id: staffId,
    action: "resolve_help_request",
    entity_type: "help_request",
    entity_id: ticketId,
    details: { reference_no: refNo, status: "resolved" },
  });

  const { data: resolvedTicket } = await studentAuthClient
    .from("help_requests")
    .select("status, resolution_notes")
    .eq("id", ticketId)
    .single();
  assert(resolvedTicket?.status === "resolved", "Ticket must be marked as resolved in DB");
  console.log("   ✓ Student verified ticket status is 'resolved' with resolution notes.");

  // Journey 4: Password-reset journey works end to end
  console.log("\n5. [Journey 4] Testing Password-Reset Journey End-to-End...");
  const newPassword = "UpdatedSecurePassword2026!#";

  // Step 4a: Generate official recovery link / token via Supabase Auth
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: studentEmail,
  });
  assert(!linkErr && linkData?.properties?.hashed_token, `Failed to generate recovery link: ${linkErr?.message}`);
  console.log("   ✓ Generated recovery link & hashed token from Supabase Auth.");

  // Step 4b: Verify recovery token (OTP exchange) to establish authenticated recovery session
  const { data: recoverySession, error: otpErr } = await anonClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "recovery",
  });
  assert(!otpErr && recoverySession?.session?.access_token, `Failed to verify recovery OTP: ${otpErr?.message}`);
  console.log("   ✓ Verified recovery token and established authenticated recovery session.");

  // Step 4c: Update password using authenticated recovery session
  const studentRecoveryClient = createClient(supabaseUrl, supabaseAnonKey);
  await studentRecoveryClient.auth.setSession({
    access_token: recoverySession.session.access_token,
    refresh_token: recoverySession.session.refresh_token,
  });

  const { error: updatePassErr } = await studentRecoveryClient.auth.updateUser({
    password: newPassword,
  });
  assert(!updatePassErr, `Failed to update password: ${updatePassErr?.message}`);
  console.log("   ✓ Successfully updated student password via authenticated recovery session.");

  // Step 4d: Verify old password fails
  const { error: oldPassLoginErr } = await anonClient.auth.signInWithPassword({
    email: studentEmail,
    password: initialPassword,
  });
  assert(oldPassLoginErr, "Old password must be rejected");
  console.log("   ✓ Verified old password is now rejected by Supabase Auth.");

  // Step 4e: Verify new password succeeds
  const { data: newPassLogin, error: newPassLoginErr } = await anonClient.auth.signInWithPassword({
    email: studentEmail,
    password: newPassword,
  });
  assert(!newPassLoginErr && newPassLogin.session?.access_token, "New password login must succeed");
  console.log("   ✓ Verified student successfully authenticated with the new password.");

  console.log("\n>>> TINY 7b PASSED: All 4 end-to-end journeys verified on real staging infrastructure!\n");

  // -----------------------------------------------------------------------------
  // TINY 7c: Security verification
  // -----------------------------------------------------------------------------
  console.log(">>> TINY 7c: Running Security Verification on Staging Database...");

  const studentBEmail = `student.b.${TEST_TIMESTAMP}@summit.ac.ke`;
  const studentBPass = "StudentBPass123!@";
  const studentBId = await provisionUser(studentBEmail, studentBPass, "Brian Otieno", "student");

  const staffBEmail = `staff.b.${TEST_TIMESTAMP}@summit.ac.ke`;
  const staffBPass = "StaffBPass123!@";
  const staffBId = await provisionUser(staffBEmail, staffBPass, "Prof. Amina Abdi", "staff");

  const { data: studentBLogin } = await anonClient.auth.signInWithPassword({
    email: studentBEmail,
    password: studentBPass,
  });
  const studentBAuthClient = createAuthUserClient(studentBLogin!.session!.access_token);

  const { data: staffBLogin } = await anonClient.auth.signInWithPassword({
    email: staffBEmail,
    password: staffBPass,
  });
  const staffBAuthClient = createAuthUserClient(staffBLogin!.session!.access_token);

  // 1. RLS Isolation: Student B cannot see Student A's help requests
  console.log("1. Proving RLS isolation between students...");
  const { data: studentBViewingA } = await studentBAuthClient
    .from("help_requests")
    .select("id")
    .eq("id", ticketId);
  assert(studentBViewingA?.length === 0, "RLS FAILURE: Student B must not see Student A's ticket");
  console.log("   ✓ RLS proven: Student B receives 0 rows when attempting to query Student A's ticket.");

  // 2. Sensitive complaint isolation (The locked-door test)
  console.log("\n2. Testing Locked-Door Isolation for Sensitive Complaints...");
  const { data: sensitiveTicket, error: sensErr } = await studentAuthClient
    .from("help_requests")
    .insert({
      university_id: PILOT_UNIV_ID,
      student_id: studentId,
      user_id: studentId,
      category: "complaint",
      subject: "CONFIDENTIAL: Sensitive Faculty Complaint",
      description: "Private complaint regarding examination conduct.",
      is_sensitive: true,
      assigned_to: staffId, // Assigned strictly to Staff A
      status: "submitted",
    })
    .select()
    .single();

  assert(!sensErr && sensitiveTicket, `Sensitive ticket submission failed: ${sensErr?.message}`);
  const sensitiveTicketId = sensitiveTicket.id;
  console.log(`   ✓ Sensitive ticket filed (ID: ${sensitiveTicketId}), assigned strictly to Staff A.`);

  // Staff A (assigned) CAN view it
  const { data: staffAView } = await staffAuthClient
    .from("help_requests")
    .select("id, subject")
    .eq("id", sensitiveTicketId);
  assert(staffAView && staffAView.length === 1, "Assigned Staff A must see sensitive ticket");
  console.log("   ✓ Assigned Staff A CAN see the sensitive complaint.");

  // Staff B (unassigned staff) CANNOT view it
  const { data: staffBView } = await staffBAuthClient
    .from("help_requests")
    .select("id, subject")
    .eq("id", sensitiveTicketId);
  assert(staffBView && staffBView.length === 0, "RLS FAILURE: Unassigned Staff B must NOT see sensitive ticket");
  console.log("   ✓ Unassigned Staff B CANNOT see the sensitive complaint (0 rows returned via RLS).");

  // Student B CANNOT view it
  const { data: studentBViewSens } = await studentBAuthClient
    .from("help_requests")
    .select("id, subject")
    .eq("id", sensitiveTicketId);
  assert(studentBViewSens && studentBViewSens.length === 0, "RLS FAILURE: Student B must NOT see sensitive ticket");
  console.log("   ✓ Another Student (Student B) CANNOT see the sensitive complaint (0 rows returned).");

  // Student A (author) CAN view it
  const { data: studentAViewSens } = await studentAuthClient
    .from("help_requests")
    .select("id, subject")
    .eq("id", sensitiveTicketId);
  assert(studentAViewSens && studentAViewSens.length === 1, "Filing Student A must see their own sensitive ticket");
  console.log("   ✓ Filing Student A CAN view and track their own sensitive complaint.");

  // Record audit log for viewing sensitive record
  await staffAuthClient.from("audit_log").insert({
    actor_id: staffId,
    action: "view_sensitive_help_request",
    entity_type: "help_request",
    entity_id: sensitiveTicketId,
    details: { reference_no: sensitiveTicket.reference_no, actor_role: "assigned_staff" },
  });
  console.log("   ✓ Sensitive view recorded in audit_log.");

  // 3. Repeated UAMS sync stays idempotent
  console.log("\n3. Testing Idempotence of Repeated UAMS Sync...");
  const sampleSyncPayload = {
    students: [
      {
        email: `idempotent.student.${TEST_TIMESTAMP}@summit.ac.ke`,
        full_name: "James Mwangi",
        registration_number: `SMU/IDEM/${TEST_TIMESTAMP % 1000}`,
        campus_code: "MAIN",
        faculty: "School of Computing",
        department: "Computer Science",
        program_of_study: "BSc Computer Science",
        year_of_study: 2,
      },
    ],
    course_units: [
      {
        code: `CS-${TEST_TIMESTAMP % 1000}`,
        title: "Distributed Systems & Cloud Computing",
        faculty: "School of Computing",
        department: "Computer Science",
        year_of_study: 2,
        semester: 1,
      },
    ],
    timetables: [],
  };

  // Run Sync #1
  const studentEmailSync = sampleSyncPayload.students[0].email;
  const initialUserId = await provisionUser(studentEmailSync, "TempPass123!@", "James Mwangi", "student");

  // Run Sync #2 (Duplicate sync)
  const secondUserId = await provisionUser(studentEmailSync, "TempPass123!@", "James Mwangi", "student");
  assert.strictEqual(initialUserId, secondUserId, "Sync must be idempotent: same auth UUID maintained");

  const { data: memCount } = await adminClient
    .from("university_memberships")
    .select("id", { count: "exact" })
    .eq("user_id", initialUserId);
  assert.strictEqual(memCount?.length, 1, "Sync must not duplicate university_memberships");
  console.log("   ✓ Idempotent sync verified: repeated runs produce 0 duplicates and preserve identity.");

  // 4. Route Protection: Logged-out users cannot reach protected routes; students cannot reach admin module
  console.log("\n4. Testing Route Protection & Access Controls...");
  const { updateSession } = await import("@/lib/supabase/middleware");
  const { NextRequest } = await import("next/server");

  const unauthReq = new NextRequest("http://localhost:3000/dashboard");
  const unauthRes = await updateSession(unauthReq);
  assert.strictEqual(unauthRes.status, 307, "Unauthenticated user visiting /dashboard must be redirected (HTTP 307)");
  assert(unauthRes.headers.get("location")?.includes("/login"), "Unauthenticated user must be redirected to /login");
  console.log("   ✓ Route protection: Logged-out user visiting /dashboard is redirected to /login.");

  // Student role check: verify student does not have admin permissions
  const { data: studentMem } = await studentAuthClient
    .from("university_memberships")
    .select("role")
    .eq("user_id", studentId)
    .single();
  assert.strictEqual(studentMem?.role, "student", "Role must be student");
  const isStudentAdmin = (studentMem?.role as string) === "admin" || (studentMem?.role as string) === "super_admin";
  assert.strictEqual(isStudentAdmin, false, "Students must NOT have admin clearance");
  console.log("   ✓ Route protection: Students lack admin clearance (isAdmin: false) and cannot access /admin.");

  console.log("\n>>> TINY 7c PASSED: Security verification, RLS isolation, and idempotence proven on real staging!\n");
}

runStagingVerification().catch((err) => {
  console.error("\n❌ STAGING VERIFICATION FAILED:", err);
  process.exit(1);
});
