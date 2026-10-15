-- ==============================================================================
-- Migration: 20261015000004_security_hardening.sql
-- Description: Role escalation prevention, search_path enforcement, and verification checks
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Harden Helper Functions (Explicit search_path + Active verification check)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_university_staff(user_uuid UUID, univ_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.university_memberships m
        WHERE m.user_id = user_uuid
          AND m.university_id = univ_id
          AND m.role IN ('staff', 'admin', 'super_admin')
          AND m.verification_status = 'verified'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_university_admin(user_uuid UUID, univ_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.university_memberships m
        WHERE m.user_id = user_uuid
          AND m.university_id = univ_id
          AND m.role IN ('admin', 'super_admin')
          AND m.verification_status = 'verified'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.university_memberships m
        WHERE m.user_id = user_uuid
          AND m.role = 'super_admin'
          AND m.verification_status = 'verified'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_member(user_uuid UUID, univ_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.university_memberships m
        WHERE m.user_id = user_uuid
          AND m.university_id = univ_id
          AND m.verification_status = 'verified'
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_university_ids(user_uuid UUID)
RETURNS TABLE (university_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT m.university_id
    FROM public.university_memberships m
    WHERE m.user_id = user_uuid
      AND m.verification_status = 'verified';
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- ------------------------------------------------------------------------------
-- 2. Role Escalation & Self-Verification Prevention Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_membership_security_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    caller_id UUID := auth.uid();
BEGIN
    -- Allow system/service_role operations (caller_id is null)
    IF caller_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Block any user from verifying themselves
    IF OLD.verification_status IS DISTINCT FROM NEW.verification_status AND caller_id = NEW.user_id THEN
        RAISE EXCEPTION 'Users cannot alter their own verification status';
    END IF;

    -- Block any user from changing their own role (self-promotion)
    IF OLD.role IS DISTINCT FROM NEW.role AND caller_id = NEW.user_id THEN
        RAISE EXCEPTION 'Users cannot modify their own role';
    END IF;

    -- Role alteration security checks
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Only super_admin can assign or revoke super_admin
        IF (NEW.role = 'super_admin' OR OLD.role = 'super_admin') THEN
            IF NOT public.is_super_admin(caller_id) THEN
                RAISE EXCEPTION 'Only super administrators can assign or alter the super_admin role';
            END IF;
        END IF;

        -- Only university admins or super admins can assign or modify staff/admin roles
        IF (NEW.role IN ('staff', 'admin') OR OLD.role IN ('staff', 'admin')) THEN
            IF NOT (public.is_university_admin(caller_id, NEW.university_id) OR public.is_super_admin(caller_id)) THEN
                RAISE EXCEPTION 'Only university administrators can grant or alter staff or admin roles';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_membership_security_trigger ON public.university_memberships;
CREATE TRIGGER guard_membership_security_trigger
    BEFORE UPDATE ON public.university_memberships
    FOR EACH ROW EXECUTE FUNCTION public.enforce_membership_security_guard();

-- ------------------------------------------------------------------------------
-- 3. Replace Overly Permissive Membership RLS Update Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can manage university memberships" ON public.university_memberships;

-- A. Staff can verify or reject student applications (cannot touch staff/admin roles)
CREATE POLICY "Staff can verify student memberships"
    ON public.university_memberships
    FOR UPDATE
    USING (
        public.is_university_staff(auth.uid(), university_id)
        AND role = 'student'
    )
    WITH CHECK (
        public.is_university_staff(auth.uid(), university_id)
        AND role = 'student'
    );

-- B. University Admins can manage all memberships within their university (except super_admin)
CREATE POLICY "Admins can manage university roles and memberships"
    ON public.university_memberships
    FOR UPDATE
    USING (
        public.is_university_admin(auth.uid(), university_id)
        AND role != 'super_admin'
    )
    WITH CHECK (
        public.is_university_admin(auth.uid(), university_id)
        AND role != 'super_admin'
    );

-- C. Super Admins can manage all memberships across all universities
CREATE POLICY "Super admins can manage all memberships"
    ON public.university_memberships
    FOR UPDATE
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));
