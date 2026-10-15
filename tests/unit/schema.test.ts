import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Database Migrations Integrity", () => {
  const migrationsDir = path.resolve(import.meta.dirname, "../../supabase/migrations");

  it("contains all versioned migration files", () => {
    const files = fs.readdirSync(migrationsDir);
    expect(files).toContain("20261015000001_core_schema.sql");
    expect(files).toContain("20261015000002_triggers_and_functions.sql");
    expect(files).toContain("20261015000003_row_level_security.sql");
  });

  it("defines all core tables in 20261015000001_core_schema.sql", () => {
    const schemaSql = fs.readFileSync(
      path.join(migrationsDir, "20261015000001_core_schema.sql"),
      "utf-8"
    );
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS public.universities");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS public.campuses");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS public.user_profiles");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS public.university_memberships");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS public.announcements");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS public.announcement_reads");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS public.help_requests");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS public.help_request_updates");
  });

  it("defines automated triggers and security helper functions", () => {
    const triggersSql = fs.readFileSync(
      path.join(migrationsDir, "20261015000002_triggers_and_functions.sql"),
      "utf-8"
    );
    expect(triggersSql).toContain("handle_updated_at");
    expect(triggersSql).toContain("handle_new_auth_user");
    expect(triggersSql).toContain("set_help_request_reference_no");
    expect(triggersSql).toContain("is_university_staff");
    expect(triggersSql).toContain("is_university_admin");
    expect(triggersSql).toContain("is_verified_member");
  });

  it("enforces Row-Level Security on all core entities", () => {
    const rlsSql = fs.readFileSync(
      path.join(migrationsDir, "20261015000003_row_level_security.sql"),
      "utf-8"
    );
    expect(rlsSql).toContain("ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY");
    expect(rlsSql).toContain("ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY");
    expect(rlsSql).toContain("ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY");
    expect(rlsSql).toContain("ALTER TABLE public.university_memberships ENABLE ROW LEVEL SECURITY");
    expect(rlsSql).toContain("ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY");
    expect(rlsSql).toContain("ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY");
  });

  it("contains seed script with pilot universities", () => {
    const seedPath = path.resolve(import.meta.dirname, "../../supabase/seed.sql");
    const seedSql = fs.readFileSync(seedPath, "utf-8");
    expect(seedSql).toContain("Summit Metropolitan University");
    expect(seedSql).toContain("Zetech University");
  });
});
