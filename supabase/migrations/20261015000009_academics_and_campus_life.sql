-- ==============================================================================
-- Migration: 20261015000009_academics_and_campus_life.sql
-- Description: Core tables, RLS policies, and triggers for academic timetables,
--              course units, campus clubs, and student events.
-- ==============================================================================

-- 1. Course Units
CREATE TABLE IF NOT EXISTS public.course_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    faculty TEXT NOT NULL,
    department TEXT NOT NULL,
    year_of_study INT NOT NULL CHECK (year_of_study BETWEEN 1 AND 7),
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 3),
    credit_hours INT DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_course_units_code UNIQUE (university_id, code)
);

CREATE INDEX IF NOT EXISTS idx_course_units_univ_dept ON public.course_units(university_id, department, year_of_study);

-- 2. Timetable Schedules
CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    course_unit_id UUID NOT NULL REFERENCES public.course_units(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL,
    lecturer_name TEXT NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 3),
    academic_year TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_timetable_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_timetables_lookup ON public.timetables(university_id, campus_id, day_of_week);

-- 3. Clubs & Communities
CREATE TABLE IF NOT EXISTS public.clubs_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technology', 'academic', 'arts', 'sports', 'faith', 'leadership', 'community_service')),
    patron_name TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_club_slug UNIQUE (university_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_clubs_university ON public.clubs_communities(university_id, category);

-- 4. Campus Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    club_id UUID REFERENCES public.clubs_communities(id) ON DELETE SET NULL,
    organizer_id UUID REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    venue TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    category TEXT NOT NULL CHECK (category IN ('academic', 'career', 'social', 'sports', 'hackathon', 'workshop')),
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(university_id, event_date);

-- 5. Timestamps Triggers
DROP TRIGGER IF EXISTS set_course_units_updated_at ON public.course_units;
CREATE TRIGGER set_course_units_updated_at
    BEFORE UPDATE ON public.course_units
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_timetables_updated_at ON public.timetables;
CREATE TRIGGER set_timetables_updated_at
    BEFORE UPDATE ON public.timetables
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_clubs_updated_at ON public.clubs_communities;
CREATE TRIGGER set_clubs_updated_at
    BEFORE UPDATE ON public.clubs_communities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row-Level Security
ALTER TABLE public.course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Verified members can view course units in their university
DROP POLICY IF EXISTS "Verified members can view university course units" ON public.course_units;
CREATE POLICY "Verified members can view university course units"
    ON public.course_units FOR SELECT
    USING (public.is_verified_member(auth.uid(), university_id));

DROP POLICY IF EXISTS "Staff can manage university course units" ON public.course_units;
CREATE POLICY "Staff can manage university course units"
    ON public.course_units FOR ALL
    USING (public.is_university_staff(auth.uid(), university_id))
    WITH CHECK (public.is_university_staff(auth.uid(), university_id));

-- Verified members can view timetables in their university
DROP POLICY IF EXISTS "Verified students can view relevant timetables" ON public.timetables;
CREATE POLICY "Verified students can view relevant timetables"
    ON public.timetables FOR SELECT
    USING (
        is_active = true
        AND public.is_verified_member(auth.uid(), university_id)
        AND (
            campus_id IS NULL OR campus_id IN (
                SELECT m.campus_id FROM public.university_memberships m
                WHERE m.user_id = auth.uid() AND m.university_id = timetables.university_id
            )
        )
    );

DROP POLICY IF EXISTS "Staff can manage university timetables" ON public.timetables;
CREATE POLICY "Staff can manage university timetables"
    ON public.timetables FOR ALL
    USING (public.is_university_staff(auth.uid(), university_id))
    WITH CHECK (public.is_university_staff(auth.uid(), university_id));

-- Verified members can view clubs in their university
DROP POLICY IF EXISTS "Verified members can view university clubs" ON public.clubs_communities;
CREATE POLICY "Verified members can view university clubs"
    ON public.clubs_communities FOR SELECT
    USING (public.is_verified_member(auth.uid(), university_id));

DROP POLICY IF EXISTS "Staff can manage university clubs" ON public.clubs_communities;
CREATE POLICY "Staff can manage university clubs"
    ON public.clubs_communities FOR ALL
    USING (public.is_university_staff(auth.uid(), university_id))
    WITH CHECK (public.is_university_staff(auth.uid(), university_id));

-- Verified members can view published events in their university
DROP POLICY IF EXISTS "Verified members can view university events" ON public.events;
CREATE POLICY "Verified members can view university events"
    ON public.events FOR SELECT
    USING (is_published = true AND public.is_verified_member(auth.uid(), university_id));

DROP POLICY IF EXISTS "Staff can manage university events" ON public.events;
CREATE POLICY "Staff can manage university events"
    ON public.events FOR ALL
    USING (public.is_university_staff(auth.uid(), university_id))
    WITH CHECK (public.is_university_staff(auth.uid(), university_id));
