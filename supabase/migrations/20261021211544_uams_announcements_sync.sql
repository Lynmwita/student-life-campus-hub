-- Additive source metadata; local author-owned notices retain their existing rules.
-- Rollback: stop the importer and keep the rows/metadata. Do not drop source IDs
-- while imports or read receipts depend on their stable identity.
ALTER TABLE public.announcements
  ALTER COLUMN author_id DROP NOT NULL,
  ADD COLUMN source_system text,
  ADD COLUMN source_id text,
  ADD COLUMN source_updated_at timestamptz,
  ADD CONSTRAINT announcement_source_identity CHECK (
    CASE WHEN source_system IS NULL THEN source_id IS NULL AND source_updated_at IS NULL AND author_id IS NOT NULL
    ELSE source_system = 'uams' AND source_id IS NOT NULL AND length(trim(source_id)) BETWEEN 1 AND 200 AND source_updated_at IS NOT NULL END
  ),
  ADD CONSTRAINT announcement_source_unique UNIQUE (university_id, source_system, source_id);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.announcements TO service_role;

-- Existing tenant-targeting SELECT policies still govern imported notices.
-- Staff browser sessions cannot forge source identity or edit imported records.
CREATE POLICY "Local announcement inserts only" ON public.announcements AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (source_system IS NULL AND author_id = (SELECT auth.uid()));
CREATE POLICY "Local announcement updates only" ON public.announcements AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (source_system IS NULL) WITH CHECK (source_system IS NULL);
CREATE POLICY "Local announcement deletes only" ON public.announcements AS RESTRICTIVE
  FOR DELETE TO authenticated USING (source_system IS NULL);

CREATE OR REPLACE FUNCTION public.sync_uams_announcements(p_university_id uuid, p_announcements jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public AS $$
DECLARE
  notice jsonb;
  previous public.announcements%ROWTYPE;
  campus uuid;
  scope text;
  source_version timestamptz;
  inserted_count integer := 0;
  updated_count integer := 0;
  unchanged_count integer := 0;
BEGIN
  IF jsonb_typeof(p_announcements) IS DISTINCT FROM 'array' OR jsonb_array_length(p_announcements) > 1000 THEN
    RAISE EXCEPTION 'Expected at most 1000 announcements';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.universities WHERE id = p_university_id AND is_active) THEN
    RAISE EXCEPTION 'Unknown or inactive sync university';
  END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(p_announcements)) <>
     (SELECT count(DISTINCT item->>'source_id') FROM jsonb_array_elements(p_announcements) item) THEN
    RAISE EXCEPTION 'Duplicate or missing announcement source IDs';
  END IF;
  -- Serialize concurrent imports for this tenant, including initially absent rows.
  PERFORM pg_advisory_xact_lock(hashtextextended('uams-announcements:' || p_university_id::text, 0));
  FOR notice IN SELECT * FROM jsonb_array_elements(p_announcements) LOOP
    IF coalesce(length(trim(notice->>'title')), 0) NOT BETWEEN 1 AND 200
      OR coalesce(length(trim(notice->>'content')), 0) NOT BETWEEN 1 AND 10000
      OR coalesce(notice->>'priority', '') NOT IN ('P1','P2','P3','P4') THEN
      RAISE EXCEPTION 'Invalid announcement content or priority';
    END IF;
    scope := notice->>'target_scope';
    IF scope IS NULL OR scope NOT IN ('all','campus','faculty','department','year') THEN
      RAISE EXCEPTION 'Invalid announcement target scope';
    END IF;
    IF (scope = 'faculty' AND coalesce(length(trim(notice->>'target_faculty')),0) = 0)
      OR (scope = 'department' AND coalesce(length(trim(notice->>'target_department')),0) = 0)
      OR (scope = 'year' AND coalesce((notice->>'target_year')::integer, 0) NOT BETWEEN 1 AND 7) THEN
      RAISE EXCEPTION 'Missing announcement target';
    END IF;
    campus := NULL;
    IF scope = 'campus' THEN
      SELECT id INTO campus FROM public.campuses
        WHERE university_id = p_university_id AND code = notice->>'campus_code' AND is_active;
      IF campus IS NULL THEN RAISE EXCEPTION 'Unknown campus for announcement'; END IF;
    END IF;
    source_version := (notice->>'updated_at')::timestamptz;
    IF source_version IS NULL THEN RAISE EXCEPTION 'Missing announcement version'; END IF;
    SELECT * INTO previous FROM public.announcements
      WHERE university_id = p_university_id AND source_system = 'uams' AND source_id = notice->>'source_id' FOR UPDATE;
    IF previous.id IS NOT NULL AND previous.source_updated_at >= source_version THEN
      unchanged_count := unchanged_count + 1;
      CONTINUE;
    END IF;
    INSERT INTO public.announcements (
      university_id, campus_id, author_id, title, content, priority, target_scope,
      target_faculty, target_department, target_year, is_published, published_at,
      expires_at, source_system, source_id, source_updated_at
    ) VALUES (
      p_university_id, campus, NULL, notice->>'title', notice->>'content', notice->>'priority', scope,
      CASE WHEN scope = 'faculty' THEN notice->>'target_faculty' END,
      CASE WHEN scope = 'department' THEN notice->>'target_department' END,
      CASE WHEN scope = 'year' THEN (notice->>'target_year')::integer END,
      coalesce((notice->>'is_published')::boolean, true), (notice->>'published_at')::timestamptz,
      (notice->>'expires_at')::timestamptz, 'uams', notice->>'source_id', source_version
    ) ON CONFLICT (university_id, source_system, source_id) DO UPDATE SET
      campus_id = EXCLUDED.campus_id, title = EXCLUDED.title, content = EXCLUDED.content,
      priority = EXCLUDED.priority, target_scope = EXCLUDED.target_scope,
      target_faculty = EXCLUDED.target_faculty, target_department = EXCLUDED.target_department,
      target_year = EXCLUDED.target_year, is_published = EXCLUDED.is_published,
      published_at = EXCLUDED.published_at, expires_at = EXCLUDED.expires_at,
      source_updated_at = EXCLUDED.source_updated_at;
    IF previous.id IS NULL THEN inserted_count := inserted_count + 1;
    ELSE updated_count := updated_count + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('processed', jsonb_array_length(p_announcements),
    'inserted', inserted_count, 'updated', updated_count, 'unchanged', unchanged_count);
END;
$$;
REVOKE ALL ON FUNCTION public.sync_uams_announcements(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_uams_announcements(uuid, jsonb) TO service_role;
