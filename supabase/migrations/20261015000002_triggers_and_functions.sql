-- ==============================================================================
-- Migration: 20261015000002_triggers_and_functions.sql
-- Description: Automated triggers, helper functions, and security evaluation
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Automatic Timestamp Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS set_universities_updated_at ON public.universities;
CREATE TRIGGER set_universities_updated_at
    BEFORE UPDATE ON public.universities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_campuses_updated_at ON public.campuses;
CREATE TRIGGER set_campuses_updated_at
    BEFORE UPDATE ON public.campuses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_university_memberships_updated_at ON public.university_memberships;
CREATE TRIGGER set_university_memberships_updated_at
    BEFORE UPDATE ON public.university_memberships
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_help_requests_updated_at ON public.help_requests;
CREATE TRIGGER set_help_requests_updated_at
    BEFORE UPDATE ON public.help_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 2. Auth User Synchronizer (Creates User Profile on Sign Up)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE WHEN user_profiles.full_name IS NULL OR user_profiles.full_name = '' THEN EXCLUDED.full_name ELSE user_profiles.full_name END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------------------------
-- 3. Help Request Reference Generator (REQ-YYYY-XXXX)
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.help_request_seq;

CREATE OR REPLACE FUNCTION public.set_help_request_reference_no()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    next_seq_val INT;
BEGIN
    IF NEW.reference_no IS NULL OR NEW.reference_no = '' THEN
        current_year := to_char(CURRENT_DATE, 'YYYY');
        next_seq_val := nextval('public.help_request_seq');
        NEW.reference_no := 'REQ-' || current_year || '-' || LPAD(next_seq_val::text, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_help_request_ref_trigger ON public.help_requests;
CREATE TRIGGER set_help_request_ref_trigger
    BEFORE INSERT ON public.help_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_help_request_reference_no();

-- ------------------------------------------------------------------------------
-- 4. Multi-Tenant Role & Permission Helpers (SECURITY DEFINER for RLS)
-- ------------------------------------------------------------------------------

-- Returns all university IDs where user has a membership
CREATE OR REPLACE FUNCTION public.get_user_university_ids(user_uuid UUID)
RETURNS TABLE (university_id UUID) AS $$
    SELECT m.university_id
    FROM public.university_memberships m
    WHERE m.user_id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if a user has staff or admin role in a given university
CREATE OR REPLACE FUNCTION public.is_university_staff(user_uuid UUID, univ_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.university_memberships m
        WHERE m.user_id = user_uuid
          AND m.university_id = univ_id
          AND m.role IN ('staff', 'admin', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if a user is an admin of a university
CREATE OR REPLACE FUNCTION public.is_university_admin(user_uuid UUID, univ_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.university_memberships m
        WHERE m.user_id = user_uuid
          AND m.university_id = univ_id
          AND m.role IN ('admin', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.university_memberships m
        WHERE m.user_id = user_uuid
          AND m.role = 'super_admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checks if user is a verified member of a university
CREATE OR REPLACE FUNCTION public.is_verified_member(user_uuid UUID, univ_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.university_memberships m
        WHERE m.user_id = user_uuid
          AND m.university_id = univ_id
          AND m.verification_status = 'verified'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
