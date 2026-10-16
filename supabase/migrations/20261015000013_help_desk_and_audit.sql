-- ==============================================================================
-- Migration: 20261015000013_help_desk_and_audit.sql
-- Description: Step 5 Help Desk with Reference Numbers, Status Timelines,
--              Sensitive-Complaint Privacy (assigned staff + admins only),
--              and University Staff Audit Logs.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Extend Help Requests with Privacy & Category Columns
-- ------------------------------------------------------------------------------
ALTER TABLE public.help_requests
    ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.help_requests
    ADD COLUMN IF NOT EXISTS sensitive_type TEXT;

-- Update categories to include sensitive complaint & lecturer conduct
ALTER TABLE public.help_requests
    DROP CONSTRAINT IF EXISTS help_requests_category_check;

ALTER TABLE public.help_requests
    ADD CONSTRAINT help_requests_category_check
    CHECK (category IN (
        'academic',
        'facilities',
        'welfare',
        'finance_aid',
        'hostel',
        'it_support',
        'lecturer_conduct',
        'sensitive_complaint',
        'general'
    ));

CREATE INDEX IF NOT EXISTS idx_help_requests_sensitive
    ON public.help_requests(university_id, is_sensitive);

-- ------------------------------------------------------------------------------
-- 2. Reference Number Generator Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_help_request_reference_no()
RETURNS TRIGGER AS $$
DECLARE
    random_suffix TEXT;
BEGIN
    IF NEW.reference_no IS NULL OR NEW.reference_no = '' THEN
        random_suffix := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
        NEW.reference_no := 'HD-2026-' || random_suffix;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_help_request_reference_no ON public.help_requests;
CREATE TRIGGER trg_help_request_reference_no
    BEFORE INSERT ON public.help_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_help_request_reference_no();

-- ------------------------------------------------------------------------------
-- 3. Strict Privacy RLS Policies on Help Requests
-- ------------------------------------------------------------------------------
-- Drop existing staff view policy to partition non-sensitive vs sensitive complaints
DROP POLICY IF EXISTS "Staff can view help requests in university" ON public.help_requests;

-- Non-sensitive tickets: viewable by all university staff
CREATE POLICY "Staff can view non-sensitive help requests in university"
    ON public.help_requests
    FOR SELECT
    USING (
        is_sensitive = false
        AND public.is_university_staff(auth.uid(), university_id)
    );

-- Sensitive complaints (e.g. lecturer conduct, harassment):
-- Viewable ONLY by assigned staff member, university admins, or super admins
CREATE POLICY "Only assigned staff and admins can view sensitive help requests"
    ON public.help_requests
    FOR SELECT
    USING (
        is_sensitive = true
        AND (
            auth.uid() = assigned_staff_id
            OR public.is_university_admin(auth.uid(), university_id)
            OR public.is_super_admin(auth.uid())
        )
    );

-- ------------------------------------------------------------------------------
-- 4. Strict Privacy RLS Policies on Help Request Updates / Timeline
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view all updates in university" ON public.help_request_updates;

CREATE POLICY "Staff can view updates on non-sensitive requests"
    ON public.help_request_updates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_updates.help_request_id
              AND hr.is_sensitive = false
              AND public.is_university_staff(auth.uid(), hr.university_id)
        )
    );

CREATE POLICY "Only assigned staff and admins can view updates on sensitive requests"
    ON public.help_request_updates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_updates.help_request_id
              AND hr.is_sensitive = true
              AND (
                  auth.uid() = hr.assigned_staff_id
                  OR public.is_university_admin(auth.uid(), hr.university_id)
                  OR public.is_super_admin(auth.uid())
              )
        )
    );

-- ------------------------------------------------------------------------------
-- 5. Audit Logs Table & Policies
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_university ON public.audit_logs(university_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(university_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and Super Admins can view audit logs
CREATE POLICY "Admins can view university audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        public.is_university_admin(auth.uid(), university_id)
        OR public.is_super_admin(auth.uid())
    );

-- Authorized staff and admins can record audit events
CREATE POLICY "Staff can insert audit log entries"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = actor_id
        AND (
            public.is_university_staff(auth.uid(), university_id)
            OR public.is_super_admin(auth.uid())
        )
    );
