-- ==============================================================================
-- Migration: 20261015000006_storage_delete_policy.sql
-- Description: Owner-only DELETE policy on storage.objects for student verification documents
-- ==============================================================================

DROP POLICY IF EXISTS "Students can delete own verification documents" ON storage.objects;

CREATE POLICY "Students can delete own verification documents"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'student-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
