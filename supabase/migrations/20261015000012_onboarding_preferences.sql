-- ==============================================================================
-- Migration: 20261015000012_onboarding_preferences.sql
-- Description: Student notification preferences and career alert tracks table
--              with RLS policies and updated_at trigger.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    style TEXT NOT NULL DEFAULT 'smart_digest' CHECK (style IN ('smart_digest', 'immediate_all', 'academic_priority')),
    career_tracks TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_notification_preferences UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON public.notification_preferences(user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Students can view, insert, and update their own notification preferences
DROP POLICY IF EXISTS "Students can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Students can manage own notification preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Staff and administrators can view notification preferences within their university
DROP POLICY IF EXISTS "Staff can view notification preferences in university" ON public.notification_preferences;
CREATE POLICY "Staff can view notification preferences in university"
    ON public.notification_preferences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.university_memberships sm
            JOIN public.university_memberships stm ON stm.university_id = sm.university_id
            WHERE sm.user_id = notification_preferences.user_id
              AND stm.user_id = auth.uid()
              AND stm.role IN ('staff', 'admin', 'super_admin')
        )
    );

-- Updated at trigger
DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER set_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
