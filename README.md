# Student Life & Campus Hub 🎓

> **"The university follows the student."**  
> A lightweight, mobile-first, multi-tenant campus platform designed for university students to unify official communications, academic timetables, campus discovery, and student support into a fast, low-bandwidth web application (PWA).

---

## 📌 Project Overview

University students frequently face fragmented campus communication channels — relying on noisy WhatsApp groups, physical bulletin boards, and bloated administrative portals. **Student Life & Campus Hub** centralizes essential student services into a clean, mobile-first hub built to perform smoothly even on 3G mobile connections.

### Key Pillars
- **Strict Multi-Tenancy**: Data isolation between universities via database-level Supabase Row-Level Security (RLS).
- **Verified Student Identity**: Tiered onboarding with student credential verification (`pending` → `verified`).
- **Targeted Announcements & Priority Alerts**: Official campus notices scoped by institution, faculty, department, or year of study, categorized by urgency (P1 Urgent to P4 General).
- **Personalized Student Feed**: Daily glance covering upcoming schedules, academic deadlines, and notifications.
- **Structured Help Desk**: Direct student inquiry submission with tracking codes (`REQ-YYYY-XXXXX`) and status timelines.
- **Low-Bandwidth & PWA First**: Lightweight asset footprint with offline fallback caching for core views.

### 🚫 Explicit Scope Boundaries
- **NO M-Pesa / Daraja Integration**: The platform has zero payment processing, mobile wallets, or transaction flows.
- **NO Heavy ERP Admin Suites**: We do not duplicate university HR, payroll, or senate deliberation workflows. The app remains 100% student-centered.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Row-Level Security) |
| **Session Management** | `@supabase/ssr` with Next.js Edge Middleware |
| **Testing** | [Vitest](https://vitest.dev/) (Unit/Schema tests), [Playwright](https://playwright.dev/) (E2E) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict mode) |

---

## 📂 Project Structure

```text
student-life-campus-hub/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication route group (login, register, onboarding)
│   ├── (dashboard)/              # Student dashboard & campus features
│   ├── (admin)/                  # University staff & verification queue
│   ├── globals.css               # Base Tailwind CSS rules
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing / entry page
├── components/
│   ├── ui/                       # Atomic reusable UI components (buttons, cards, inputs)
│   └── shared/                   # Composed domain components (navbars, modals, notices)
├── lib/
│   ├── supabase/                 # Supabase client helpers
│   │   ├── client.ts             # Browser client (createBrowserClient)
│   │   ├── server.ts             # Server client (createServerClient with async cookies)
│   │   └── middleware.ts         # Edge session refresh helper
│   ├── types/                    # Core TypeScript models & database schemas
│   └── utils.ts                  # Shared utilities (e.g., cn Tailwind class merge)
├── supabase/
│   ├── migrations/               # Versioned SQL migrations (schema, RLS, triggers)
│   └── seed.sql                  # Pilot institution synthetic data
├── tests/
│   ├── unit/                     # Vitest unit & schema integrity tests
│   └── e2e/                      # Playwright browser end-to-end tests
├── middleware.ts                 # Next.js session refresh middleware
├── vitest.config.mts             # Vitest test runner configuration
└── tsconfig.json                 # TypeScript compiler options
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) project (or local Supabase CLI)

### 2. Installation
```bash
git clone git@github.com:Lynmwita/student-life-campus-hub.git
cd student-life-campus-hub
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup
Apply migrations located in `supabase/migrations/` sequentially or via Supabase CLI:
```bash
# Core schema:
supabase/migrations/20261015000001_core_schema.sql
# Triggers & functions:
supabase/migrations/20261015000002_triggers_and_functions.sql
# Row-Level Security policies:
supabase/migrations/20261015000003_row_level_security.sql

# Seed pilot institutions (Summit Metropolitan & Zetech):
supabase/seed.sql
```

### 5. Running the Application
```bash
# Start development server
npm run dev

# Run unit and schema verification tests
npm test

# Run linter
npm run lint

# Production build check
npm run build
```
Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🌿 Git & Branching Workflow

To maintain clean code quality and auditability:
1. Always branch off `main` for new features or bug fixes:
   ```bash
   git checkout -b feat/<phase-or-feature-name>
   ```
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(...)`: New features
   - `fix(...)`: Bug fixes
   - `test(...)`: Test additions or adjustments
   - `docs(...)`: Documentation updates
3. Verify `npm run lint`, `npm test`, and `npm run build` pass before pushing.
4. Push the branch and merge into `main`.

---

## 🗺️ Roadmap & Phase Progress

- [x] **Phase 1: Repository & Development Foundation** (Next.js 16, Supabase SSR, Vitest, Base Utilities)
- [x] **Phase 2: Database Design & Multi-Tenant Security** (Schema, RLS, Triggers, Seed Data)
- [ ] **Phase 3: Authentication, Onboarding & Student Verification**
- [ ] **Phase 4: Core Walking Skeleton (Announcements & Daily Feed)**
- [ ] **Phase 5: Campus Life & Academics (Timetables, Events & Clubs)**
- [ ] **Phase 6: Student Help Desk & Issue Resolution**
- [ ] **Phase 7: PWA & Offline Optimization**
- [ ] **Phase 8: Automated Testing & Security Hardening**
- [ ] **Phase 9: CI/CD & Production Readiness**
- [ ] **Phase 10: Pilot Launch & Feedback Intake**
