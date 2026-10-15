# UAMS Data Ingestion Specification & Sync Contract (v1)

## Overview
Student Life and Campus Hub operates as a single-institution student experience platform. The University Academic Management System (UAMS) is the definitive source of truth for student identity, course unit catalogs, and lecture schedules.

This document specifies the format, natural key upsert semantics, and behavior for synchronizing records from UAMS into the hub database via `syncUamsDataAction`.

---

## Ingestion Architecture & Rules

1. **Additive Synchronization**: The sync process is strictly additive. Existing records are never deleted during synchronization. Student departures, course retirements, or cancellations are managed via explicit deactivation.
2. **Pre-Verified Status**: All students provisioned via the UAMS sync are marked with `verification_status = 'verified'`. Students log in with their institutional credentials and proceed directly to mandatory interest onboarding.
3. **Dry Run Capability**: Payloads containing `"dry_run": true` are validated for schema correctness and entity counts without committing any mutations to the database.
4. **Natural Key Resolution**:
   - Students: Resolved by institutional `email` address.
   - Course Units: Resolved by composite key `(university_id, code)`.
   - Timetable Slots: Resolved by composite schedule slot `(university_id, course_unit_id, campus_id, day_of_week, start_time, academic_year, semester)`.
   - Campuses: Resolved by campus code (e.g. `SMU-MAIN`, `SMU-CITY`).

---

## Contract Schema (Version 1)

### Top-Level Request Format

```json
{
  "version": 1,
  "dry_run": false,
  "students": [
    {
      "email": "student@summit.ac.ke",
      "full_name": "Faith Chepkemoi",
      "registration_number": "SMU/BCS/2024/0089",
      "faculty": "School of Computing and Informatics",
      "department": "Computer Science",
      "year_of_study": 2,
      "campus_code": "SMU-MAIN"
    }
  ],
  "course_units": [
    {
      "code": "COMP 211",
      "name": "Object-Oriented Analysis and Design",
      "faculty": "School of Computing and Informatics",
      "department": "Computer Science",
      "year_of_study": 2,
      "semester": 1,
      "credit_hours": 3
    }
  ],
  "timetables": [
    {
      "course_code": "COMP 211",
      "campus_code": "SMU-MAIN",
      "day_of_week": 1,
      "start_time": "08:30",
      "end_time": "11:30",
      "venue": "Computing Lab 3",
      "lecturer_name": "Dr. Evans Ochieng",
      "semester": 1,
      "academic_year": "2026/2027"
    }
  ]
}
```

---

## Field Definitions

### 1. Student Record (`students[]`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string (email) | Yes | Institutional academic email (.ac.ke or .edu). Natural key. |
| `full_name` | string | Yes | Student official full name. |
| `registration_number` | string | Yes | University enrollment registration identifier. |
| `faculty` | string | Yes | School or Faculty affiliation. |
| `department` | string | Yes | Department affiliation. |
| `year_of_study` | integer (1-7) | Yes | Current undergraduate or graduate study year. |
| `campus_code` | string | No | Campus code matching university campus records (defaults to primary campus). |
| `initial_password` | string (>=8 chars) | No | Optional initial password. When omitted, a unique random temporary password (`crypto.randomUUID()`) is generated per student. Students must reset their password on first login. |

### 2. Course Unit Record (`course_units[]`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `code` | string | Yes | Official course unit code (e.g. COMP 211). Natural key. |
| `name` | string | Yes | Complete title of the course unit. |
| `faculty` | string | Yes | School or Faculty hosting the unit. |
| `department` | string | Yes | Department offering the unit. |
| `year_of_study` | integer (1-7) | Yes | Target curriculum year. |
| `semester` | integer (1-3) | Yes | Academic term (1, 2, or 3). |
| `credit_hours` | integer (1-10) | No | Academic credit hours (defaults to 3). |

### 3. Timetable Schedule Record (`timetables[]`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `course_code` | string | Yes | References `code` in course units. |
| `campus_code` | string | No | References target campus code. |
| `day_of_week` | integer (1-7) | Yes | ISO standard: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday. |
| `start_time` | string (HH:MM) | Yes | Session start time in 24-hour format. |
| `end_time` | string (HH:MM) | Yes | Session conclusion time (must be after start_time). |
| `venue` | string | Yes | Physical lecture hall, theater, or laboratory. |
| `lecturer_name` | string | Yes | Assigned faculty instructor. |
| `semester` | integer (1-3) | Yes | Target semester. |
| `academic_year` | string | Yes | Academic year string (e.g. 2026/2027). |

---

## Response Payload

```json
{
  "success": true,
  "dry_run": false,
  "counts": {
    "students_processed": 150,
    "students_inserted": 120,
    "students_updated": 30,
    "course_units_processed": 18,
    "course_units_inserted": 2,
    "course_units_updated": 16,
    "timetables_processed": 42,
    "timetables_inserted": 42,
    "timetables_updated": 0
  },
  "message": "UAMS sync executed: 150 students, 18 course units, and 42 timetable entries synced."
}
```

---

## Student Authentication Bridging Architecture

### Context and Decision
Because public self-registration (`/register`) was eliminated in favor of an institutional single-university model, student identities cannot self-register. Students are provisioned directly from UAMS records.

### Implementation Choice: Service Role Provisioning
During synchronization, student authentication accounts are bridged via the Supabase Service Role client (`createAdminClient`):
1. **Identity Resolution**: For each student email, the system checks whether a user already exists in `public.user_profiles` or Supabase Auth.
2. **Account Provisioning**: If no account exists, the action invokes `supabaseAdmin.auth.admin.createUser` with:
   - Institutional email (`st.email`)
   - Pre-confirmed email status (`email_confirm: true`)
   - Unique unshared temporary password (`crypto.randomUUID()` per student, or custom `initial_password`) to avoid shared password vulnerability
   - User metadata containing full name, registration number, and `must_reset_password: true`
3. **Existing Account Linking (Paginated)**: If the email already exists in Supabase Auth, the user's UUID is resolved across all paginated pages using `supabaseAdmin.auth.admin.listUsers` with pagination (`page`, `perPage`) and an in-memory batch cache.
4. **Profile and Membership Binding**: The resolved auth UUID is written into `public.user_profiles` (satisfying the foreign key constraint on `auth.users(id)`) and linked to `public.university_memberships` with `verification_status = 'verified'`.
5. **Student Access & Password Reset**: Because random temporary passwords are generated rather than a shared static password, students must reset their password on first login via `/forgot-password` (or via institutional credential issuance). Upon signing in, middleware intercepts their session and guides them through mandatory interest selection.

