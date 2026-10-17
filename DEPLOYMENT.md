# Production Deployment & CI/CD Runbook

**System:** Student Life & Campus Hub  
**Target Pilot Institution:** Summit Metropolitan University (SMU)  
**Document:** Deployment & Operational Engineering Guide (Phase 10)  

---

## 1. Why Step 5 Is Essential

Without an automated deployment pipeline and verified operational runbook, a software system suffers from three critical failure modes:
1. **Silent Drift & Regressions:** Code changes pushed directly without continuous testing can break production authentication, corrupt database schemas, or degrade page rendering for students.
2. **Environment Mismatches:** Secrets and configurations that work on a developer's laptop frequently fail in production if environment boundaries and secrets handling are not codified.
3. **Operational Blindness:** Without automated health checks and runbooks, university IT administrators cannot verify whether the database, auth services, or timetable synchronization are operational.

Step 5 establishes **deterministic reproducibility**: every commit is verified by automated CI, containerized or deployed to staging, and verified before serving live university students.

---

## 2. What Step 5 Does

1. **Automated Continuous Integration (CI):**
   - Configured via [`.github/workflows/ci.yml`](file:///home/lynnaz/projects/student-life-campus-hub/.github/workflows/ci.yml).
   - On every pull request and push to `main`, GitHub Actions spins up an isolated Ubuntu container, installs clean dependencies (`npm ci`), runs ESLint, runs the 83-test Vitest suite, and builds the Next.js production bundle.
2. **Containerized Production Packaging:**
   - Multi-stage [`Dockerfile`](file:///home/lynnaz/projects/student-life-campus-hub/Dockerfile) producing a hardened, non-root, standalone Node.js image (`node:20-alpine`) optimized for university servers or container platforms.
3. **Operational Health & Latency Monitoring:**
   - Dedicated [`/api/health`](file:///home/lynnaz/projects/student-life-campus-hub/app/api/health/route.ts) endpoint returning real-time service status, database connectivity, latency, and uptime.
4. **Staging vs Production Environment Separation:**
   - Zero-leakage policy for service role keys and database connection strings.

---

## 3. Environment Variables Specification

The application requires the following environment variables:

| Variable Name | Exposure | Environment | Purpose |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Staging / Prod | HTTPS endpoint of the Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Staging / Prod | Supabase public anonymous key (guarded by Row-Level Security). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret (Server Only)** | Staging / Prod | Service role key for admin sync operations. **NEVER expose to client**. |
| `CRON_SECRET` | **Secret (Server Only)** | Staging / Prod | Secret token guarding `POST /api/sync/uams`. Must be a strong 256-bit random string (`openssl rand -hex 32`) in production. **NEVER reuse staging secret**. |
| `UAMS_SYNC_SECRET` | **Secret (Server Only)** | Staging / Prod | Shared secret header (`x-sync-secret`) authorizing registrar sync requests. |
| `NEXT_PUBLIC_APP_NAME` | Public | Staging / Prod | Institution name display (`"Student Life & Campus Hub"`). |
| `NEXT_PUBLIC_APP_URL` | Public | Staging / Prod | Canonical URL (`https://hub.summit.ac.ke` or staging equivalent). |

---

## 4. Database Provisioning & Migrations Guide

The database layer requires PostgreSQL 15+ managed through Supabase.

### Migration Order

Apply the 12 migrations sequentially in order:

```bash
# 1. Using Supabase CLI (Recommended)
supabase db push

# 2. Or execute sequentially in Supabase SQL Editor:
# 01: Core schema (universities, campuses, user_profiles, memberships, announcements)
# 02: Triggers, updated_at handlers, role helpers
# 03: Row-Level Security enablement on all tables
# 04: Security hardening (prevent self-verification & role escalation)
# 05: Storage integrity & student document bucket policies
# 06: Storage delete policies
# 07: Department audience scoping on announcements
# 08: University directory columns (county, ownership)
# 09: Academic course units, timetables, clubs, and events
# 10: Mandatory student interests table and RLS
# 11: Unique timetable schedule slot constraint
# 12: Notification preferences & career alert tracks persistence
```

### Initial Staging Seed

Execute [supabase/seed.sql](file:///home/lynnaz/projects/student-life-campus-hub/supabase/seed.sql) to seed the pilot university (Summit Metropolitan University), campuses, course units, and Kenyan campus societies directory.

---

## 5. Deployment Options

### Option A: Containerized Deployment (Docker / Kubernetes / Cloud Run)

Build and run the production container:

```bash
# Build the production image
docker build -t student-life-campus-hub:latest .

# Run container exposing port 3000
docker run -d -p 3000:3000 \
  --name student-hub \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
  -e UAMS_SYNC_SECRET="your-secure-sync-secret" \
  student-life-campus-hub:latest
```

### Option B: Managed Serverless Deployment (Vercel)

1. Connect the GitHub repository `Lynmwita/student-life-campus-hub` to Vercel.
2. Select Framework: **Next.js**.
3. Configure the Environment Variables under **Project Settings &rarr; Environment Variables**.
4. Deploy branch `main` for Production and pull requests for Preview environments.

---

## 6. Post-Deployment Verification Checklist

Upon deploying to staging or production:

1. **Ping Health Check:**
   ```bash
   curl -i https://<deployed-url>/api/health
   # Expected: HTTP 200 OK {"status":"healthy","checks":{"api":"healthy","database":"healthy"}}
   ```
2. **Verify Static Pages:**
   - Visit `/login` &rarr; verify Oxford Navy & Academic Gold institutional crest.
   - Visit `/onboarding` &rarr; verify 3-step wizard with unchecked attestation.
3. **Verify Auth Gating:**
   - Attempt to access `/dashboard` unauthenticated &rarr; redirected to `/login`.
4. **Registrar Sync Test:**
   - Perform a dry-run sync using [`syncUamsDataAction({ ... }, { dry_run: true })`](file:///home/lynnaz/projects/student-life-campus-hub/lib/actions/sync.ts).
