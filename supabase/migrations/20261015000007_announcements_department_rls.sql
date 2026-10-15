-- ==============================================================================
-- Migration: 20261015000007_announcements_department_rls.sql
-- Description: Add department audience scoping to announcements RLS policy
-- ==============================================================================

DROP POLICY IF EXISTS "Verified members can view targeted announcements" ON public.announcements;

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
                target_scope = 'department' AND target_department IN (
                    SELECT m.department FROM public.university_memberships m
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
