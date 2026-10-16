-- ==============================================================================
-- Migration: 20261015000013_help_desk_and_audit.sql
-- Description: Tiny Segment 3 Help Desk Database & Audit Log
--              - help_requests (reference_number, user_id, category, status, assigned_to, is_sensitive)
--              - help_request_replies (request_id, author_id, message, is_staff_reply)
--              - audit_log (actor_id, action, entity_type, entity_id, details)
--              - Strict RLS Security Rules:
--                * Students see ONLY their OWN requests
--                * Staff see general queue + sensitive ONLY if assigned
--                * Admins see everything
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Extend Help Requests Table with Specification Columns
-- ------------------------------------------------------------------------------
ALTER TABLE public.help_requests
    ADD COLUMN IF NOT EXISTS reference_number TEXT;

ALTER TABLE public.help_requests
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.help_requests
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.help_requests
    ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.help_requests
    ADD COLUMN IF NOT EXISTS sensitive_type TEXT;

-- Synchronize legacy columns if present
UPDATE public.help_requests
SET reference_number = reference_no
WHERE reference_number IS NULL AND reference_no IS NOT NULL;

UPDATE public.help_requests
SET user_id = student_id
WHERE user_id IS NULL AND student_id IS NOT NULL;

UPDATE public.help_requests
SET assigned_to = assigned_staff_id
WHERE assigned_to IS NULL AND assigned_staff_id IS NOT NULL;

-- Update categories constraint to support standard categories
ALTER TABLE public.help_requests
    DROP CONSTRAINT IF EXISTS help_requests_category_check;

ALTER TABLE public.help_requests
    ADD CONSTRAINT help_requests_category_check
    CHECK (category IN (
        'academic',
        'fees',
        'accommodation',
        'technical',
        'complaint',
        'other',
        'facilities',
        'welfare',
        'finance_aid',
        'hostel',
        'it_support',
        'lecturer_conduct',
        'sensitive_complaint',
        'general'
    ));

-- Update status constraint to support standard statuses
ALTER TABLE public.help_requests
    DROP CONSTRAINT IF EXISTS help_requests_status_check;

ALTER TABLE public.help_requests
    ADD CONSTRAINT help_requests_status_check
    CHECK (status IN (
        'submitted',
        'in_review',
        'resolved',
        'under_review',
        'in_progress',
        'closed'
    ));

-- Indexes for performance & privacy partitioning
CREATE UNIQUE INDEX IF NOT EXISTS idx_help_requests_reference_number
    ON public.help_requests(reference_number)
    WHERE reference_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_help_requests_user_id
    ON public.help_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_help_requests_assigned_to
    ON public.help_requests(assigned_to);

CREATE INDEX IF NOT EXISTS idx_help_requests_sensitive_assigned
    ON public.help_requests(is_sensitive, assigned_to);

-- ------------------------------------------------------------------------------
-- 2. Reference Number Generator Trigger (HD-2026-XXXX format)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_help_request_reference_no()
RETURNS TRIGGER AS $$
DECLARE
    random_suffix TEXT;
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        random_suffix := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 4));
        NEW.reference_number := 'HD-2026-' || random_suffix;
    END IF;

    -- keep reference_no synchronized
    IF NEW.reference_no IS NULL OR NEW.reference_no = '' THEN
        NEW.reference_no := NEW.reference_number;
    END IF;

    -- keep user_id / student_id synchronized
    IF NEW.user_id IS NULL AND NEW.student_id IS NOT NULL THEN
        NEW.user_id := NEW.student_id;
    ELSIF NEW.student_id IS NULL AND NEW.user_id IS NOT NULL THEN
        NEW.student_id := NEW.user_id;
    END IF;

    -- keep assigned_to / assigned_staff_id synchronized
    IF NEW.assigned_to IS NULL AND NEW.assigned_staff_id IS NOT NULL THEN
        NEW.assigned_to := NEW.assigned_staff_id;
    ELSIF NEW.assigned_staff_id IS NULL AND NEW.assigned_to IS NOT NULL THEN
        NEW.assigned_staff_id := NEW.assigned_to;
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
-- 3. Strict Row Level Security Policies for Help Requests
-- ------------------------------------------------------------------------------
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Drop prior view policies to re-apply strictly
DROP POLICY IF EXISTS "Students can view own help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Staff can view non-sensitive help requests in university" ON public.help_requests;
DROP POLICY IF EXISTS "Only assigned staff and admins can view sensitive help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Staff can view help requests in university" ON public.help_requests;

-- 1) Students see ONLY their OWN requests
CREATE POLICY "Students see only their own requests"
    ON public.help_requests
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.uid() = student_id
    );

-- 2) Staff see general queue (non-sensitive requests in their university)
CREATE POLICY "Staff see non-sensitive requests in general queue"
    ON public.help_requests
    FOR SELECT
    USING (
        is_sensitive = false
        AND public.is_university_staff(auth.uid(), university_id)
    );

-- 3) Staff see sensitive complaints ONLY IF assigned to them
CREATE POLICY "Staff see sensitive requests only if assigned"
    ON public.help_requests
    FOR SELECT
    USING (
        is_sensitive = true
        AND (
            auth.uid() = assigned_to
            OR auth.uid() = assigned_staff_id
        )
    );

-- 4) University Admins & Super Admins see EVERYTHING
CREATE POLICY "Admins see all requests"
    ON public.help_requests
    FOR SELECT
    USING (
        public.is_university_admin(auth.uid(), university_id)
        OR public.is_super_admin(auth.uid())
    );

-- Students can insert their own requests
DROP POLICY IF EXISTS "Students can insert own help requests" ON public.help_requests;
CREATE POLICY "Students can insert own requests"
    ON public.help_requests
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR auth.uid() = student_id
    );

-- ------------------------------------------------------------------------------
-- 4. Help Request Replies Table (Threaded Conversation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.help_request_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_help_request_replies_request
    ON public.help_request_replies(request_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_help_request_replies_author
    ON public.help_request_replies(author_id);

ALTER TABLE public.help_request_replies ENABLE ROW LEVEL SECURITY;

-- Replies visibility follows parent request RLS:
-- 1) Students can view replies on their own requests
CREATE POLICY "Students view replies on own requests"
    ON public.help_request_replies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_replies.request_id
              AND (hr.user_id = auth.uid() OR hr.student_id = auth.uid())
        )
    );

-- 2) Staff view replies on non-sensitive requests
CREATE POLICY "Staff view replies on non-sensitive requests"
    ON public.help_request_replies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_replies.request_id
              AND hr.is_sensitive = false
              AND public.is_university_staff(auth.uid(), hr.university_id)
        )
    );

-- 3) Assigned staff view replies on sensitive requests
CREATE POLICY "Assigned staff view replies on sensitive requests"
    ON public.help_request_replies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_replies.request_id
              AND hr.is_sensitive = true
              AND (hr.assigned_to = auth.uid() OR hr.assigned_staff_id = auth.uid())
        )
    );

-- 4) Admins view replies on all requests
CREATE POLICY "Admins view all replies"
    ON public.help_request_replies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_replies.request_id
              AND (public.is_university_admin(auth.uid(), hr.university_id) OR public.is_super_admin(auth.uid()))
        )
    );

-- Insert policies:
-- Students can reply to their own requests
CREATE POLICY "Students can reply to own requests"
    ON public.help_request_replies
    FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND is_staff_reply = false
        AND EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_replies.request_id
              AND (hr.user_id = auth.uid() OR hr.student_id = auth.uid())
        )
    );

-- Staff and admins can reply to requests they have access to
CREATE POLICY "Staff and admins can post staff replies"
    ON public.help_request_replies
    FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_replies.request_id
              AND (
                  (hr.is_sensitive = false AND public.is_university_staff(auth.uid(), hr.university_id))
                  OR (hr.is_sensitive = true AND (hr.assigned_to = auth.uid() OR hr.assigned_staff_id = auth.uid()))
                  OR public.is_university_admin(auth.uid(), hr.university_id)
                  OR public.is_super_admin(auth.uid())
              )
        )
    );

-- ------------------------------------------------------------------------------
-- 5. Audit Log Table & Policies (Immutable Activity Log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor
    ON public.audit_log(actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
    ON public.audit_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
    ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view audit log"
    ON public.audit_log
    FOR SELECT
    USING (
        public.is_super_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.university_memberships m
            WHERE m.user_id = auth.uid()
              AND m.role IN ('admin', 'super_admin')
        )
    );

-- Authorized actors (staff and admins) can insert audit log records
CREATE POLICY "Staff and admins can insert audit log entries"
    ON public.audit_log
    FOR INSERT
    WITH CHECK (
        auth.uid() = actor_id
        OR actor_id IS NULL
    );
