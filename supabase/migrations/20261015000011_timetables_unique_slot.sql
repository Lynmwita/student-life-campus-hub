-- ==============================================================================
-- Migration: 20261015000011_timetables_unique_slot.sql
-- Description: Add unique constraint on timetable schedule slots to prevent
-- duplicate class records upon repeated synchronization runs.
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_timetable_schedule_slot'
    ) THEN
        ALTER TABLE public.timetables
        ADD CONSTRAINT uq_timetable_schedule_slot
        UNIQUE (university_id, course_unit_id, campus_id, day_of_week, start_time, academic_year, semester);
    END IF;
END $$;
