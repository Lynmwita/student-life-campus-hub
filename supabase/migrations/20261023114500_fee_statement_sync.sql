-- Migration: Add fee_statement and payment_record support to uams_academic_records
-- Author: Antigravity Pairing
-- Date: 2026-10-23

ALTER TABLE public.uams_academic_records
  DROP CONSTRAINT IF EXISTS uams_academic_records_kind_check,
  DROP CONSTRAINT IF EXISTS uams_academic_records_check;

ALTER TABLE public.uams_academic_records
  ADD CONSTRAINT uams_academic_records_kind_check CHECK (kind IN ('grade', 'event', 'date', 'fee_statement', 'payment_record')),
  ADD CONSTRAINT uams_academic_records_check CHECK ((kind IN ('grade', 'fee_statement', 'payment_record')) = (student_id IS NOT NULL));

CREATE OR REPLACE FUNCTION public.sync_uams_academic_records(p_university_id uuid,p_records jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_catalog AS $$
DECLARE
  r jsonb;
  previous public.uams_academic_records%ROWTYPE;
  student uuid;
  inserted_count int := 0;
  updated_count int := 0;
  unchanged_count int := 0;
BEGIN
  IF jsonb_typeof(p_records) <> 'array' OR jsonb_array_length(p_records) > 3000 THEN
    RAISE EXCEPTION 'Invalid records';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM public.universities WHERE id = p_university_id AND is_active) THEN
    RAISE EXCEPTION 'Unknown tenant';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('uams-academics:' || p_university_id::text, 0));

  FOR r IN SELECT * FROM jsonb_array_elements(p_records) LOOP
    IF r->>'kind' NOT IN ('grade', 'event', 'date', 'fee_statement', 'payment_record')
       OR coalesce(length(r->>'source_id'), 0) = 0
       OR r->>'updated_at' IS NULL
       OR jsonb_typeof(r->'is_published') <> 'boolean' THEN
      RAISE EXCEPTION 'Invalid source record';
    END IF;

    student := NULL;
    IF r->>'kind' IN ('grade', 'fee_statement', 'payment_record') THEN
      SELECT p.id INTO student
      FROM public.user_profiles p
      JOIN public.university_memberships m ON m.user_id = p.id
      WHERE m.university_id = p_university_id
        AND lower(p.email) = lower(r->>'student_email')
        AND m.role = 'student';

      IF student IS NULL THEN
        RAISE EXCEPTION '% references unknown enrolled student', r->>'kind';
      END IF;
    END IF;

    SELECT * INTO previous
    FROM public.uams_academic_records
    WHERE university_id = p_university_id
      AND kind = r->>'kind'
      AND source_id = r->>'source_id';

    IF FOUND AND previous.source_updated_at >= (r->>'updated_at')::timestamptz THEN
      unchanged_count := unchanged_count + 1;
      CONTINUE;
    END IF;

    IF previous.id IS NULL THEN
      inserted_count := inserted_count + 1;
    ELSE
      updated_count := updated_count + 1;
    END IF;

    INSERT INTO public.uams_academic_records(
      university_id,
      kind,
      source_id,
      student_id,
      data,
      source_updated_at
    ) VALUES (
      p_university_id,
      r->>'kind',
      r->>'source_id',
      student,
      r,
      (r->>'updated_at')::timestamptz
    )
    ON CONFLICT (university_id, kind, source_id)
    DO UPDATE SET
      data = excluded.data,
      student_id = excluded.student_id,
      source_updated_at = excluded.source_updated_at;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', jsonb_array_length(p_records),
    'inserted', inserted_count,
    'updated', updated_count,
    'unchanged', unchanged_count
  );
END $$;

REVOKE ALL ON FUNCTION public.sync_uams_academic_records(uuid, jsonb) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.sync_uams_academic_records(uuid, jsonb) TO service_role;
