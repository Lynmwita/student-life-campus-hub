-- ==============================================================================
-- Migration: 20261015000003_row_level_security.sql
-- Description: Strict Row-Level Security (RLS) policies enforcing multi-tenant isolation
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_request_updates ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Universities Policies
-- ------------------------------------------------------------------------------
-- Anyone (including onboarding users) can view active universities
CREATE POLICY "Public can view active universities"
    ON public.universities
    FOR SELECT
    USING (is_active = true);

-- Only super_admins can modify universities
CREATE POLICY "Super admins can manage universities"
    ON public.universities
    FOR ALL
    USING (public.is_super_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- 3. Campuses Policies
-- ------------------------------------------------------------------------------
-- Anyone can view active campuses
CREATE POLICY "Public can view active campuses"
    ON public.campuses
    FOR SELECT
    USING (is_active = true);

-- University admins can manage campuses for their university
CREATE POLICY "University admins can manage campuses"
    ON public.campuses
    FOR ALL
    USING (public.is_university_admin(auth.uid(), university_id));

-- ------------------------------------------------------------------------------
-- 4. User Profiles Policies
-- ------------------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Staff can view profiles of members in their university
CREATE POLICY "Staff can view member profiles in their university"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.university_memberships m
            WHERE m.user_id = user_profiles.id
              AND m.university_id IN (SELECT university_id FROM public.get_user_university_ids(auth.uid()))
              AND public.is_university_staff(auth.uid(), m.university_id)
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 5. University Memberships Policies
-- ------------------------------------------------------------------------------
-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
    ON public.university_memberships
    FOR SELECT
    USING (auth.uid() = user_id);

-- University staff/admin can view all memberships in their university (verification queue)
CREATE POLICY "Staff can view memberships for their university"
    ON public.university_memberships
    FOR SELECT
    USING (public.is_university_staff(auth.uid(), university_id));

-- Authenticated users can create an onboarding membership for themselves
CREATE POLICY "Users can create own membership application"
    ON public.university_memberships
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND role = 'student'
        AND verification_status = 'pending'
    );

-- Students can update their pending application details
CREATE POLICY "Students can update pending application"
    ON public.university_memberships
    FOR UPDATE
    USING (
        auth.uid() = user_id
        AND verification_status IN ('pending', 'requires_review')
    )
    WITH CHECK (
        auth.uid() = user_id
        AND verification_status IN ('pending', 'requires_review')
    );

-- University staff/admin can verify, update, or reject memberships in their university
CREATE POLICY "Staff can manage university memberships"
    ON public.university_memberships
    FOR UPDATE
    USING (public.is_university_staff(auth.uid(), university_id))
    WITH CHECK (public.is_university_staff(auth.uid(), university_id));

-- ------------------------------------------------------------------------------
-- 6. Announcements Policies
-- ------------------------------------------------------------------------------
-- Verified students can view published announcements scoped to them
CREATE POLICY "Verified members can view targeted announcements"
    ON public.announcements
    FOR SELECT
    USING (
        is_published = true
        AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
        AND public.is_verified_member(auth.uid(), university_id)
        AND (
            target_scope = 'all'
            OR (
                target_scope = 'campus' AND campus_id IN (
                    SELECT m.campus_id FROM public.university_memberships m
                    WHERE m.user_id = auth.uid() AND m.university_id = announcements.university_id
                )
            )
            OR (
                target_scope = 'faculty' AND target_faculty IN (
                    SELECT m.faculty FROM public.university_memberships m
                    WHERE m.user_id = auth.uid() AND m.university_id = announcements.university_id
                )
            )
            OR (
                target_scope = 'year' AND target_year IN (
                    SELECT m.year_of_study FROM public.university_memberships m
                    WHERE m.user_id = auth.uid() AND m.university_id = announcements.university_id
                )
            )
        )
    );

-- Staff/admin can view all announcements in their university (including drafts)
CREATE POLICY "Staff can view all announcements in university"
    ON public.announcements
    FOR SELECT
    USING (public.is_university_staff(auth.uid(), university_id));

-- Staff/admin can create announcements for their university
CREATE POLICY "Staff can insert announcements for university"
    ON public.announcements
    FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND public.is_university_staff(auth.uid(), university_id)
    );

-- Staff/admin can update/delete announcements for their university
CREATE POLICY "Staff can update announcements for university"
    ON public.announcements
    FOR UPDATE
    USING (public.is_university_staff(auth.uid(), university_id))
    WITH CHECK (public.is_university_staff(auth.uid(), university_id));

CREATE POLICY "Staff can delete announcements for university"
    ON public.announcements
    FOR DELETE
    USING (public.is_university_staff(auth.uid(), university_id));

-- ------------------------------------------------------------------------------
-- 7. Announcement Reads Policies
-- ------------------------------------------------------------------------------
-- Users can view their read notices
CREATE POLICY "Users can view own read status"
    ON public.announcement_reads
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can mark notices as read
CREATE POLICY "Users can mark notices as read"
    ON public.announcement_reads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. Help Requests Policies
-- ------------------------------------------------------------------------------
-- Students can view their own submitted help requests
CREATE POLICY "Students can view own help requests"
    ON public.help_requests
    FOR SELECT
    USING (auth.uid() = student_id);

-- Staff can view all help requests for their university
CREATE POLICY "Staff can view help requests in university"
    ON public.help_requests
    FOR SELECT
    USING (public.is_university_staff(auth.uid(), university_id));

-- Verified students can submit help requests to their verified university
CREATE POLICY "Students can submit help requests"
    ON public.help_requests
    FOR INSERT
    WITH CHECK (
        auth.uid() = student_id
        AND public.is_verified_member(auth.uid(), university_id)
    );

-- Students can update their request if still submitted (e.g. withdraw/add notes)
CREATE POLICY "Students can update active help requests"
    ON public.help_requests
    FOR UPDATE
    USING (auth.uid() = student_id AND status = 'submitted')
    WITH CHECK (auth.uid() = student_id);

-- Staff can manage help requests (assign, update status, resolve)
CREATE POLICY "Staff can manage help requests in university"
    ON public.help_requests
    FOR UPDATE
    USING (public.is_university_staff(auth.uid(), university_id))
    WITH CHECK (public.is_university_staff(auth.uid(), university_id));

-- ------------------------------------------------------------------------------
-- 9. Help Request Updates Policies
-- ------------------------------------------------------------------------------
-- Students can view non-internal updates on their own tickets
CREATE POLICY "Students can view public updates on own requests"
    ON public.help_request_updates
    FOR SELECT
    USING (
        is_internal = false
        AND EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_updates.help_request_id
              AND hr.student_id = auth.uid()
        )
    );

-- Staff can view all updates (including internal notes)
CREATE POLICY "Staff can view all updates in university"
    ON public.help_request_updates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_updates.help_request_id
              AND public.is_university_staff(auth.uid(), hr.university_id)
        )
    );

-- Students can add updates/replies to their own requests
CREATE POLICY "Students can post updates to own requests"
    ON public.help_request_updates
    FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND is_internal = false
        AND EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_updates.help_request_id
              AND hr.student_id = auth.uid()
        )
    );

-- Staff can post updates to university requests
CREATE POLICY "Staff can post updates to university requests"
    ON public.help_request_updates
    FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.help_requests hr
            WHERE hr.id = help_request_updates.help_request_id
              AND public.is_university_staff(auth.uid(), hr.university_id)
        )
    );
