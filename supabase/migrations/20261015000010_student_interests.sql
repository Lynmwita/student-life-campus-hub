-- ==============================================================================
-- Migration: 20261015000010_student_interests.sql
-- Description: Student interests table and RLS policies for mandatory onboarding.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    interest TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_interest UNIQUE (user_id, interest)
);

CREATE INDEX IF NOT EXISTS idx_student_interests_user_id ON public.student_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_student_interests_interest ON public.student_interests(interest);

ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;

-- Students can select, update, and manage only their own interests
DROP POLICY IF EXISTS "Students can manage own interests" ON public.student_interests;
CREATE POLICY "Students can manage own interests"
    ON public.student_interests FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Staff and administrators can view student interests within their university for personalization
DROP POLICY IF EXISTS "Staff can view student interests in university" ON public.student_interests;
CREATE POLICY "Staff can view student interests in university"
    ON public.student_interests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.university_memberships sm
            JOIN public.university_memberships stm ON stm.university_id = sm.university_id
            WHERE sm.user_id = student_interests.user_id
              AND stm.user_id = auth.uid()
              AND stm.role IN ('staff', 'admin', 'super_admin')
        )
    );
