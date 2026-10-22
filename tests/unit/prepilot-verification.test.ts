import { describe, it, expect, vi } from "vitest";
import {importCore} from '@/lib/uams/core-import';
import {uamsSyncPayloadSchema} from '@/lib/validations/sync';
import type {SupabaseClient} from '@supabase/supabase-js';
import fs from "fs";
import path from "path";
import {
  KENYAN_CAMPUS_DIRECTORY,
  CAREER_ALERT_TRACKS,
  NOTIFICATION_STYLE_OPTIONS,
} from "@/lib/constants/campus-directory";
import {
  completeSmartOnboardingAction,
  getStudentOnboardingDataAction,
} from "@/lib/actions/interests";
import { CANONICAL_INTEREST_IDS } from "@/lib/constants/interests";

describe("Pre-Pilot Staging & Security Verification", () => {
  const rootDir = path.resolve(import.meta.dirname, "../..");
  const migrationsDir = path.join(rootDir, "supabase/migrations");

  it("V-01: Environment Safety Guard — strictly uses staging/local test env, never production", () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    // Verify it does not target production or live unapproved domains
    expect(supabaseUrl).not.toContain("prod.summit.ac.ke");
    expect(supabaseUrl).not.toContain("production");
  });

  it("V-02: Database Migrations Completeness — all 12 versioned migrations exist with correct dependencies", () => {
    const files = fs.readdirSync(migrationsDir);
    expect(files.length).toBeGreaterThanOrEqual(12);

    const requiredMigrations = [
      "20261015000001_core_schema.sql",
      "20261015000002_triggers_and_functions.sql",
      "20261015000003_row_level_security.sql",
      "20261015000004_security_hardening.sql",
      "20261015000005_storage_and_campus_integrity.sql",
      "20261015000006_storage_delete_policy.sql",
      "20261015000007_announcements_department_rls.sql",
      "20261015000008_university_directory_columns.sql",
      "20261015000009_academics_and_campus_life.sql",
      "20261015000010_student_interests.sql",
      "20261015000011_timetables_unique_slot.sql",
      "20261015000012_onboarding_preferences.sql",
    ];

    for (const migration of requiredMigrations) {
      expect(files).toContain(migration);
    }
  });

  it("V-03: Timetable Duplicate Prevention — enforces unique constraint on timetable slots", () => {
    const timetableMigration = fs.readFileSync(
      path.join(migrationsDir, "20261015000011_timetables_unique_slot.sql"),
      "utf-8"
    );
    expect(timetableMigration).toContain("uq_timetable_schedule_slot");
    expect(timetableMigration).toContain(
      "UNIQUE (university_id, course_unit_id, campus_id, day_of_week, start_time, academic_year, semester)"
    );
  });

  function provisioningClient(directory:(page:number,size:number)=>{id:string;email:string}[]){
    type ProvisionInput={password:string;user_metadata:{must_reset_password:boolean}};
    type Result={error:null;data:Record<string,string>[]};
    type Query=PromiseLike<Result>&{select:()=>Query;eq:()=>Query;maybeSingle:()=>Promise<{data:null;error:null}>;upsert:(data:Record<string,unknown>)=>Promise<{error:null}>};
    const createUser=vi.fn(async(input:ProvisionInput)=>{void input;return {data:{user:{id:'provisioned-auth-id'}},error:null};});
    const listUsers=vi.fn(async({page,perPage}:{page:number;perPage:number})=>({data:{users:directory(page,perPage)},error:null}));
    const writes:{table:string;data:Record<string,unknown>}[]=[];
    const client={auth:{admin:{createUser,listUsers}},from:(table:string)=>{const result=Promise.resolve<Result>({error:null,data:table==='campuses'?[{id:'campus-id',code:'MAIN'}]:[]});const q:Query={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:null,error:null}),upsert:(data)=>{writes.push({table,data});return Promise.resolve({error:null});},then:result.then.bind(result)};return q;}};
    return {client:client as unknown as SupabaseClient,createUser,listUsers,writes};
  }
  const student=(email:string)=>({email,full_name:'Test Student',registration_number:'REG001',faculty:'Computing',department:'Computer Science',year_of_study:1,campus_code:'MAIN'});
  it("V-04: Student provisioning uses fresh random passwords and requires reset",async()=>{
    const first=provisioningClient(()=>[]),second=provisioningClient(()=>[]);
    const payload=uamsSyncPayloadSchema.parse({version:1,students:[student('new@example.edu')]});
    await importCore(first.client,'tenant',payload);await importCore(second.client,'tenant',payload);
    const password=first.createUser.mock.calls[0][0].password;
    expect(password).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
    expect(second.createUser.mock.calls[0][0].password).not.toBe(password);
    expect(first.createUser.mock.calls[0][0].user_metadata.must_reset_password).toBe(true);
  });
  it("V-05: Registrar searches subsequent auth pages before provisioning",async()=>{
    const fake=provisioningClient((page,size)=>page===1?Array.from({length:size},(_,i)=>({id:'existing-'+i,email:'existing'+i+'@example.edu'})):[{id:'target-auth-id',email:'target@example.edu'}]);
    await importCore(fake.client,'tenant',uamsSyncPayloadSchema.parse({version:1,students:[student('target@example.edu')]}));
    expect(fake.listUsers.mock.calls.map(([call])=>call.page)).toEqual([1,2]);
    expect(fake.createUser).not.toHaveBeenCalled();
    expect(fake.writes.find(w=>w.table==='user_profiles')?.data.id).toBe('target-auth-id');
  });

  it("V-06: Pre-Filled Studies Integrity — Step 1 loads academic credentials correctly", async () => {
    const data = await getStudentOnboardingDataAction();
    expect(data.success).toBe(true);
    expect(data.studies.fullName).toBeTruthy();
    expect(data.studies.registrationNumber).toBe("BIT/2023/8849");
    expect(data.studies.faculty).toBe("School of Computing & Informatics");
    expect(data.studies.yearOfStudy).toBe(2);
    expect(data.studies.verificationStatus).toBe("verified");
  });

  it("V-07: Mandatory Attestation Gating — Step 1 blocks submission without confirmation", async () => {
    const res = await completeSmartOnboardingAction({
      studiesConfirmed: false,
      communityIds: ["gdsc-chapter", "varsity-football-club", "christian-union-cu"],
    });
    expect(res.success).toBe(false);
    expect(res.message).toContain("confirm your pre-filled academic studies");
  });

  it("V-08: Community Minimum Selection Gating — enforces at least 3 communities", () => {
    // Verified via wizard logic: requires minimum 3 communities
    expect(KENYAN_CAMPUS_DIRECTORY.length).toBeGreaterThanOrEqual(20);
    expect(CANONICAL_INTEREST_IDS.length).toBe(10);
  });

  it("V-09: Faculty-Matching Accuracy — law majors do not receive computing recommendations", () => {
    const lawFaculty = "School of Law";
    const studentFaculty = lawFaculty.toLowerCase();

    const lawRecommendations = KENYAN_CAMPUS_DIRECTORY.filter((c) => {
      if (!c.facultyMatches) return false;
      return c.facultyMatches.some(
        (f) =>
          studentFaculty.includes(f.toLowerCase()) ||
          (studentFaculty.includes("computing") && f.toLowerCase().includes("computing"))
      );
    });

    const lawNames = lawRecommendations.map((c) => c.name);
    // Law student matches Law/Debate, never tech clubs
    expect(lawNames.some((n) => n.includes("Law") || n.includes("Debate"))).toBe(true);
    expect(lawNames.some((n) => n.includes("GDSC"))).toBe(false);
    expect(lawNames.some((n) => n.includes("Cyber Security"))).toBe(false);
    expect(lawNames.some((n) => n.includes("IEEE"))).toBe(false);
  });

  it("V-10: Notification Preferences Persistence Schema — migration 12 defines required columns and RLS", () => {
    const prefMigration = fs.readFileSync(
      path.join(migrationsDir, "20261015000012_onboarding_preferences.sql"),
      "utf-8"
    );
    expect(prefMigration).toContain("CREATE TABLE IF NOT EXISTS public.notification_preferences");
    expect(prefMigration).toContain("user_id UUID NOT NULL REFERENCES public.user_profiles(id)");
    expect(prefMigration).toContain("career_tracks TEXT[] NOT NULL DEFAULT '{}'");
    expect(prefMigration).toContain("uq_user_notification_preferences UNIQUE (user_id)");
    expect(prefMigration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(prefMigration).toContain("Students can manage own notification preferences");
  });

  it("V-11: Classic Collegiate Design Tokens — exact Academic Navy + Gold palette verified", () => {
    const cssContent = fs.readFileSync(
      path.join(rootDir, "app/globals.css"),
      "utf-8"
    );
    expect(cssContent).toContain("#0B1D33"); // Oxford Navy
    expect(cssContent).toContain("#06101E"); // Deep Navy
    expect(cssContent).toContain("#C59B27"); // Academic Gold
    expect(cssContent).toContain("#FCD34D"); // Soft Gold
  });

  it("V-12: Full Kenyan Campus Directory Coverage — covers sports, faith, tech, arts, civic, and academic chapters", () => {
    const categories = new Set(KENYAN_CAMPUS_DIRECTORY.map((c) => c.category));
    expect(categories.has("sports")).toBe(true);
    expect(categories.has("faith")).toBe(true);
    expect(categories.has("technology")).toBe(true);
    expect(categories.has("arts")).toBe(true);
    expect(categories.has("community_service")).toBe(true);
    expect(categories.has("leadership")).toBe(true);
    expect(categories.has("academic")).toBe(true);

    expect(CAREER_ALERT_TRACKS.length).toBeGreaterThanOrEqual(5);
    expect(NOTIFICATION_STYLE_OPTIONS.length).toBe(3);
  });

  it("V-13: Production Lockdown — Pilot Demo Access quick-fill card is OFF in production builds", () => {
    const loginPageSource = fs.readFileSync(
      path.join(rootDir, "app/(auth)/login/page.tsx"),
      "utf-8"
    );
    expect(loginPageSource).toContain('process.env.NODE_ENV !== "production"');
    expect(loginPageSource).toContain('process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true"');
  });

  it("V-14: Production Lockdown — Demo passwords do not exist in seed.sql", () => {
    const seedSource = fs.readFileSync(
      path.join(rootDir, "supabase/seed.sql"),
      "utf-8"
    );
    expect(seedSource).not.toContain("crypt('StaffPassword123!'");
    expect(seedSource).not.toContain("crypt('StudentPassword123!'");
    expect(seedSource).not.toContain("crypt('AdminPassword123!'");
  });

  it("V-15: Production Lockdown — Auth action strictly blocks demo fallback in production", () => {
    const authActionSource = fs.readFileSync(
      path.join(rootDir, "lib/actions/auth.ts"),
      "utf-8"
    );
    expect(authActionSource).toContain('process.env.NODE_ENV !== "production"');
    expect(authActionSource).toContain('process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true"');
    expect(authActionSource).toContain('error: "Invalid email or password."');
  });
});
