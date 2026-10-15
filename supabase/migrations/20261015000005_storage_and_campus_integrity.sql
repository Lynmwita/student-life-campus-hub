-- ==============================================================================
-- Migration: 20261015000005_storage_and_campus_integrity.sql
-- Description: Campus-university affinity integrity and private storage bucket for student documents
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Campus-University Affinity Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_membership_campus_university()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.campus_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.campuses c
            WHERE c.id = NEW.campus_id AND c.university_id = NEW.university_id
        ) THEN
            RAISE EXCEPTION 'Selected campus does not belong to the selected university';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_membership_campus_university ON public.university_memberships;
CREATE TRIGGER trg_check_membership_campus_university
    BEFORE INSERT OR UPDATE ON public.university_memberships
    FOR EACH ROW EXECUTE FUNCTION public.check_membership_campus_university();

-- ------------------------------------------------------------------------------
-- 2. Private Storage Bucket for Student Verification Documents (PII Protection)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-documents',
    'student-documents',
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- RLS: Students can upload only to their own directory: student-documents/{user_id}/*
DROP POLICY IF EXISTS "Students can upload own verification documents" ON storage.objects;
CREATE POLICY "Students can upload own verification documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'student-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS: Students can read their own documents
DROP POLICY IF EXISTS "Students can view own verification documents" ON storage.objects;
CREATE POLICY "Students can view own verification documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'student-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS: University staff can view documents of students registered in their university
DROP POLICY IF EXISTS "Staff can view verification documents in their university" ON storage.objects;
CREATE POLICY "Staff can view verification documents in their university"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'student-documents'
        AND EXISTS (
            SELECT 1 FROM public.university_memberships m
            WHERE m.user_id::text = (storage.foldername(name))[1]
              AND public.is_university_staff(auth.uid(), m.university_id)
        )
    );
