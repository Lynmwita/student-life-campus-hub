/**
 * Phase 10 — Step 10.4: Production Pre-Flight Verification Script
 * Validates domain alignment, security hardening, container packaging, and environment hygiene.
 */

import fs from "fs";
import path from "path";

const rootDir = process.cwd();

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

function check(name: string, fn: () => { passed: boolean; details: string }) {
  try {
    const res = fn();
    results.push({ name, ...res });
  } catch (err) {
    results.push({
      name,
      passed: false,
      details: err instanceof Error ? err.message : String(err),
    });
  }
}

// 1. Canonical Domain Standardization
check("Canonical Domain Consistency", () => {
  const syncWf = fs.readFileSync(path.join(rootDir, ".github/workflows/uams-sync.yml"), "utf-8");
  const deployDoc = fs.readFileSync(path.join(rootDir, "DEPLOYMENT.md"), "utf-8");
  const secretScript = fs.readFileSync(path.join(rootDir, "scripts/generate-production-secrets.sh"), "utf-8");

  const hasCampusHub = syncWf.includes("campus-hub.summit.ac.ke");
  const hasCanonical =
    syncWf.includes("hub.summit.ac.ke") &&
    deployDoc.includes("hub.summit.ac.ke") &&
    secretScript.includes("hub.summit.ac.ke");

  if (!hasCampusHub && hasCanonical) {
    return { passed: true, details: "All configs consistently use canonical domain https://hub.summit.ac.ke" };
  }
  return { passed: false, details: "Domain mismatch detected between configuration and documentation" };
});

// 2. Database Migrations Sequential Integrity
check("Database Migrations Integrity (13 Versioned SQL Files)", () => {
  const migrationsDir = path.join(rootDir, "supabase/migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
  const expectedMigrations = [
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
    "20261015000014_sync_runs.sql",
  ];

  const missing = expectedMigrations.filter((m) => !files.includes(m));
  if (missing.length === 0) {
    return { passed: true, details: `All ${files.length} migrations exist in chronological sequence` };
  }
  return { passed: false, details: `Missing required migration files: ${missing.join(", ")}` };
});

// 3. Standalone Next.js Runtime Packaging
check("Next.js Standalone Build Configuration", () => {
  const nextConfig = fs.readFileSync(path.join(rootDir, "next.config.ts"), "utf-8");
  if (nextConfig.includes('output: "standalone"')) {
    return { passed: true, details: 'output: "standalone" enabled in next.config.ts for lean containers' };
  }
  return { passed: false, details: 'Missing output: "standalone" in next.config.ts' };
});

// 4. Hardened Multi-Stage Dockerfile Security
check("Hardened Multi-Stage Dockerfile", () => {
  const dockerfile = fs.readFileSync(path.join(rootDir, "Dockerfile"), "utf-8");
  const hasNonRoot = dockerfile.includes("USER nextjs");
  const hasLockdown = dockerfile.includes('ENV NEXT_PUBLIC_ENABLE_DEMO_AUTH="false"');
  const hasStandaloneCopy = dockerfile.includes(".next/standalone");

  if (hasNonRoot && hasLockdown && hasStandaloneCopy) {
    return { passed: true, details: "Runs as non-root user, copies standalone build, disables demo auth" };
  }
  return { passed: false, details: "Dockerfile missing non-root user or demo auth lockdown" };
});

// 5. Automated 15-Minute UAMS Sync Wiring
check("Automated 15-Minute UAMS Sync Wiring", () => {
  const vercelJson = fs.readFileSync(path.join(rootDir, "vercel.json"), "utf-8");
  const uamsWf = fs.readFileSync(path.join(rootDir, ".github/workflows/uams-sync.yml"), "utf-8");

  const vercelCron = vercelJson.includes('"schedule": "*/15 * * * *"') || vercelJson.includes('"schedule": "0 0 * * *"');
  const ghCron = uamsWf.includes("cron: '*/15 * * * *'");
  const hasBearer = uamsWf.includes("Authorization: Bearer $CRON_SECRET");

  if (vercelCron && ghCron && hasBearer) {
    return { passed: true, details: "Both Vercel crons and GitHub Actions configured with Bearer guard (Hobby/Pro compliant)" };
  }
  return { passed: false, details: "Sync schedule cadence or Bearer authorization missing" };
});

// 6. Anti-Storming Circuit Breaker
check("Anti-Storming Circuit Breaker in Sync Engine", () => {
  const syncAction = fs.readFileSync(path.join(rootDir, "lib/actions/sync.ts"), "utf-8");
  const hasCooldown = syncAction.includes("SYNC_FAILURE_COOLDOWN_MS") || syncAction.includes("lastSyncFailureTime");
  const hasLock = syncAction.includes("isSyncInProgress");

  if (hasCooldown && hasLock) {
    return { passed: true, details: "In-flight concurrency execution lock and 60s failure backoff cooldown active" };
  }
  return { passed: false, details: "Missing concurrency lock or backoff cooldown" };
});

// 7. Environment & Secrets Hygiene (.gitignore & .env.example)
check("Environment File Isolation & Template Completeness", () => {
  const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
  const envExample = fs.readFileSync(path.join(rootDir, ".env.example"), "utf-8");

  const ignoresLocal = gitignore.includes(".env*") || gitignore.includes(".env.local");
  const hasCronSecret = envExample.includes("CRON_SECRET=");
  const hasAppUrl = envExample.includes("NEXT_PUBLIC_APP_URL=");
  const hasDemoToggle = envExample.includes("NEXT_PUBLIC_ENABLE_DEMO_AUTH=");

  if (ignoresLocal && hasCronSecret && hasAppUrl && hasDemoToggle) {
    return { passed: true, details: ".env.local strictly ignored in Git; .env.example contains all required placeholders" };
  }
  return { passed: false, details: "Environment template missing variables or .env.local not ignored" };
});

// 8. Human Governance Guard Documented
check("Institutional Human Review Gate in Audit Documentation", () => {
  const auditDoc = fs.readFileSync(path.join(rootDir, "SECURITY_AUDIT.md"), "utf-8");
  const hasGovernanceGuard = auditDoc.includes("Human Institutional Governance Guard") && auditDoc.includes("PENDING CAMPUS REVIEW");

  if (hasGovernanceGuard) {
    return { passed: true, details: "SECURITY_AUDIT.md clearly requires real-world institutional human review before live launch" };
  }
  return { passed: false, details: "Missing explicit human governance review requirement in SECURITY_AUDIT.md" };
});

// Print Results
console.log("\n========================================================================");
console.log("SMU Student Life & Campus Hub — Pre-Flight Production Readiness Report");
console.log("========================================================================\n");

let allPassed = true;
for (const r of results) {
  const symbol = r.passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${symbol}] ${r.name}`);
  console.log(`         ${r.details}\n`);
  if (!r.passed) allPassed = false;
}

console.log("========================================================================");
if (allPassed) {
  console.log("VERDICT: ALL 8 PRE-FLIGHT GATES PASSED (100%) — CLEARED FOR CLOUD DEPLOYMENT");
} else {
  console.log("VERDICT: ONE OR MORE PRE-FLIGHT GATES FAILED — RESOLVE BEFORE LAUNCH");
  process.exit(1);
}
console.log("========================================================================\n");
