import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PILOT_UNIV_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  console.log("Provisioning pilot accounts on:", supabaseUrl);

  const { data: campuses } = await adminClient
    .from("campuses")
    .select("id")
    .eq("university_id", PILOT_UNIV_ID)
    .limit(1);

  const campusId = campuses && campuses[0] ? campuses[0].id : null;

  const accounts = [
    {
      email: "alex.mutua@summit.ac.ke",
      password: "StudentPassword123!",
      fullName: "Alex Mutua",
      role: "student",
      regNo: "BIT/2023/8849",
      faculty: "School of Computing & Informatics",
      department: "Information Technology",
      yearOfStudy: 2,
    },
    {
      email: "registrar@summit.ac.ke",
      password: "StaffPassword123!",
      fullName: "Academic Registrar",
      role: "staff",
      regNo: "STAFF/REG/001",
      faculty: "Registrar Office",
      department: "Academic Affairs",
      yearOfStudy: 1,
    },
    {
      email: "admin@summit.ac.ke",
      password: "AdminPassword123!",
      fullName: "System Administrator",
      role: "admin",
      regNo: "ADMIN/SYS/001",
      faculty: "ICT Directorate",
      department: "Enterprise Systems",
      yearOfStudy: 1,
    },
  ];

  for (const acc of accounts) {
    let userId: string | null = null;

    // Check if auth user exists
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const existing = usersData.users.find(
      (u) => u.email?.toLowerCase() === acc.email.toLowerCase()
    );

    if (existing) {
      userId = existing.id;
      // Update password
      await adminClient.auth.admin.updateUserById(userId, {
        password: acc.password,
        user_metadata: { full_name: acc.fullName, role: acc.role },
      });
      console.log(`Updated existing user: ${acc.email} (${userId})`);
    } else {
      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName, role: acc.role },
      });

      if (error) {
        console.error(`Error creating ${acc.email}:`, error.message);
        continue;
      }
      userId = newUser.user.id;
      console.log(`Created new user: ${acc.email} (${userId})`);
    }

    if (userId) {
      // Upsert profile
      await adminClient.from("user_profiles").upsert(
        {
          id: userId,
          email: acc.email,
          full_name: acc.fullName,
        },
        { onConflict: "id" }
      );

      // Upsert membership
      await adminClient.from("university_memberships").upsert(
        {
          user_id: userId,
          university_id: PILOT_UNIV_ID,
          campus_id: campusId,
          role: acc.role,
          registration_number: acc.regNo,
          faculty: acc.faculty,
          department: acc.department,
          year_of_study: acc.yearOfStudy,
          verification_status: "verified",
        },
        { onConflict: "user_id, university_id" }
      );
    }
  }

  console.log("Pilot accounts provisioned successfully!");
}

main().catch(console.error);
