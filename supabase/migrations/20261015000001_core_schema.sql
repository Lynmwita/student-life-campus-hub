-- ==============================================================================
-- Migration: 20261015000001_core_schema.sql
-- Description: Core relational schema for multi-tenant Student Life & Campus Hub
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Universities (Tenants)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    domain TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. Campuses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_campuses_university_code UNIQUE (university_id, code)
);

CREATE INDEX IF NOT EXISTS idx_campuses_university ON public.campuses(university_id);

-- ------------------------------------------------------------------------------
-- 3. User Profiles (Extends auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. University Memberships (Links User -> University Tenant + Role + Verification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.university_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin', 'super_admin')),
    registration_number TEXT,
    staff_id TEXT,
    faculty TEXT,
    department TEXT,
    program_of_study TEXT,
    year_of_study INT CHECK (year_of_study BETWEEN 1 AND 7),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'requires_review', 'suspended')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    verification_notes TEXT,
    id_document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_membership_user_university UNIQUE (user_id, university_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.university_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_university ON public.university_memberships(university_id);
CREATE INDEX IF NOT EXISTS idx_memberships_campus ON public.university_memberships(campus_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.university_memberships(verification_status);
CREATE INDEX IF NOT EXISTS idx_memberships_reg_no ON public.university_memberships(university_id, registration_number);

-- ------------------------------------------------------------------------------
-- 5. Announcements (Official Campus Bulletins)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'P4' CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
    target_scope TEXT NOT NULL DEFAULT 'all' CHECK (target_scope IN ('all', 'campus', 'faculty', 'department', 'year')),
    target_faculty TEXT,
    target_department TEXT,
    target_year INT CHECK (target_year BETWEEN 1 AND 7),
    is_published BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_announcements_university ON public.announcements(university_id);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON public.announcements(university_id, target_scope, target_faculty, target_year);

-- ------------------------------------------------------------------------------
-- 6. Announcement Reads (Tracking Read/Dismiss States)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_announcement_user_read UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON public.announcement_reads(user_id);

-- ------------------------------------------------------------------------------
-- 7. Help Requests (Student Inquiries & Tickets)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT NOT NULL UNIQUE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    assigned_staff_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('academic', 'facilities', 'welfare', 'finance_aid', 'hostel', 'general')),
    priority TEXT NOT NULL DEFAULT 'P3' CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'closed')),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_help_requests_university ON public.help_requests(university_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_student ON public.help_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_assigned ON public.help_requests(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(university_id, status);
CREATE INDEX IF NOT EXISTS idx_help_requests_reference ON public.help_requests(reference_no);

-- ------------------------------------------------------------------------------
-- 8. Help Request Updates (Timeline & Communication Thread)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.help_request_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    help_request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    status_from TEXT,
    status_to TEXT,
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_help_request_updates_req ON public.help_request_updates(help_request_id);
