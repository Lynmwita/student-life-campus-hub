-- Manual Student Hub rollout. Run only in project arwshzfiiqfayzwvmyke SQL Editor.
-- Combines existing migration files unchanged; this does not register CLI migration history.
-- Run the entire file once. If any statement fails, the transaction rolls back.
BEGIN;
-- SOURCE: 20261015000014_sync_runs.sql
-- Migration: 20261015000014_sync_runs.sql
-- Description: Records automated and manual UAMS synchronization runs

CREATE TABLE IF NOT EXISTS public.sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    trigger_source TEXT NOT NULL DEFAULT 'cron' CHECK (trigger_source IN ('cron', 'manual', 'api')),
    records_changed INTEGER DEFAULT 0,
    counts JSONB DEFAULT '{}'::jsonb,
    errors JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_created_at
    ON public.sync_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_runs_status
    ON public.sync_runs(status);

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

-- Admins and staff can view sync runs
CREATE POLICY "Admins and staff can view sync runs"
    ON public.sync_runs
    FOR SELECT
    USING (
        public.is_super_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.university_memberships m
            WHERE m.user_id = auth.uid()
              AND m.role IN ('staff', 'admin', 'super_admin')
        )
    );

-- Service role and internal callers can insert/update sync runs
CREATE POLICY "Service role can manage sync runs"
    ON public.sync_runs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- SOURCE: 20261021211544_uams_announcements_sync.sql
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

-- SOURCE: 20261021214425_hub_feedback_push.sql
CREATE TABLE public.pilot_feedback (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
 university_id uuid NOT NULL REFERENCES public.universities(id), rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
 category text NOT NULL CHECK (category IN ('usability','performance','accessibility','content','other')),
 message text NOT NULL CHECK (length(trim(message)) BETWEEN 10 AND 4000),
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','planned','resolved')), staff_note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz,
 reviewed_by uuid REFERENCES public.user_profiles(id)
);
ALTER TABLE public.pilot_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pilot_feedback FROM anon, authenticated;
GRANT SELECT, INSERT ON public.pilot_feedback TO authenticated;
GRANT UPDATE (status,staff_note,reviewed_at,reviewed_by) ON public.pilot_feedback TO authenticated;
GRANT ALL ON public.pilot_feedback TO service_role;
CREATE POLICY feedback_read ON public.pilot_feedback FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_university_staff((SELECT auth.uid()),university_id));
CREATE POLICY feedback_insert ON public.pilot_feedback FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_verified_member((SELECT auth.uid()),university_id) AND status='new' AND staff_note='' AND reviewed_at IS NULL AND reviewed_by IS NULL);
CREATE POLICY feedback_review ON public.pilot_feedback FOR UPDATE TO authenticated USING (public.is_university_staff((SELECT auth.uid()),university_id)) WITH CHECK (public.is_university_staff((SELECT auth.uid()),university_id) AND reviewed_by=(SELECT auth.uid()));
CREATE TRIGGER feedback_updated BEFORE UPDATE ON public.pilot_feedback FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX feedback_inbox ON public.pilot_feedback(university_id,status,created_at DESC);

CREATE TABLE public.push_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
 endpoint text NOT NULL UNIQUE CHECK (length(endpoint) BETWEEN 10 AND 2048), p256dh text NOT NULL, auth text NOT NULL,
 priorities text[] NOT NULL DEFAULT ARRAY['P1','P2'] CHECK (cardinality(priorities) BETWEEN 1 AND 4 AND priorities <@ ARRAY['P1','P2','P3','P4']::text[]),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
CREATE POLICY push_own ON public.push_subscriptions FOR ALL TO authenticated USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));
CREATE TABLE public.push_deliveries (
 subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
 announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
 fingerprint text NOT NULL, status text NOT NULL CHECK(status IN ('sending','sent','failed')), attempted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(subscription_id,announcement_id,fingerprint)
);
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_deliveries FROM anon, authenticated;
GRANT ALL ON public.push_deliveries TO service_role;

CREATE TABLE public.event_rsvps (user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE, event_id uuid REFERENCES public.events(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,event_id));
CREATE TABLE public.club_memberships (user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE, club_id uuid REFERENCES public.clubs_communities(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,club_id));
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_rsvps,public.club_memberships FROM anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.event_rsvps,public.club_memberships TO authenticated;
GRANT ALL ON public.event_rsvps,public.club_memberships TO service_role;
CREATE POLICY rsvp_read ON public.event_rsvps FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY rsvp_insert ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.is_published AND public.is_verified_member((SELECT auth.uid()),e.university_id)));
CREATE POLICY rsvp_delete ON public.event_rsvps FOR DELETE TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY club_read ON public.club_memberships FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY club_insert ON public.club_memberships FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.clubs_communities c WHERE c.id=club_id AND c.is_active AND public.is_verified_member((SELECT auth.uid()),c.university_id)));
CREATE POLICY club_delete ON public.club_memberships FOR DELETE TO authenticated USING(user_id=(SELECT auth.uid()));

-- SOURCE: 20261021214455_uams_academic_and_support_sync.sql
ALTER TABLE public.university_memberships ADD COLUMN enrollment_source_updated_at timestamptz;
ALTER TABLE public.timetables ADD COLUMN source_id text,ADD COLUMN source_updated_at timestamptz,ADD CONSTRAINT timetable_uams_source_unique UNIQUE(university_id,source_id);
CREATE OR REPLACE FUNCTION public.sync_uams_enrollment(p_university_id uuid,p_user_id uuid,p_status text,p_updated_at timestamptz) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_catalog AS $$
BEGIN
 IF p_status NOT IN ('active','pending','suspended','withdrawn','graduated') OR p_updated_at IS NULL THEN RAISE EXCEPTION 'Invalid authoritative enrollment'; END IF;
 UPDATE public.university_memberships SET verification_status=CASE p_status WHEN 'active' THEN 'verified' WHEN 'pending' THEN 'pending' ELSE 'suspended' END,enrollment_source_updated_at=p_updated_at
 WHERE university_id=p_university_id AND user_id=p_user_id AND role='student' AND (enrollment_source_updated_at IS NULL OR enrollment_source_updated_at<p_updated_at);
END $$;
REVOKE ALL ON FUNCTION public.sync_uams_enrollment(uuid,uuid,text,timestamptz) FROM PUBLIC,authenticated,anon;
GRANT EXECUTE ON FUNCTION public.sync_uams_enrollment(uuid,uuid,text,timestamptz) TO service_role;

CREATE TABLE public.uams_academic_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),university_id uuid NOT NULL REFERENCES public.universities(id),
 kind text NOT NULL CHECK(kind IN ('grade','event','date')),source_id text NOT NULL,student_id uuid REFERENCES public.user_profiles(id),
 data jsonb NOT NULL,source_updated_at timestamptz NOT NULL,UNIQUE(university_id,kind,source_id),
 CHECK((kind='grade')=(student_id IS NOT NULL))
);
ALTER TABLE public.uams_academic_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.uams_academic_records TO authenticated;
GRANT ALL ON public.uams_academic_records TO service_role;
CREATE POLICY "Published academic records scoped to students" ON public.uams_academic_records FOR SELECT TO authenticated USING (
 (data->>'is_published')::boolean AND (student_id IS NULL OR student_id=auth.uid()) AND EXISTS(SELECT 1 FROM public.university_memberships m WHERE m.user_id=auth.uid() AND m.university_id=uams_academic_records.university_id AND m.verification_status='verified')
);
CREATE OR REPLACE FUNCTION public.sync_uams_academic_records(p_university_id uuid,p_records jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_catalog AS $$
DECLARE r jsonb; previous public.uams_academic_records%ROWTYPE; student uuid; inserted_count int:=0; updated_count int:=0; unchanged_count int:=0;
BEGIN
 IF jsonb_typeof(p_records)<>'array' OR jsonb_array_length(p_records)>3000 THEN RAISE EXCEPTION 'Invalid records'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.universities WHERE id=p_university_id AND is_active) THEN RAISE EXCEPTION 'Unknown tenant'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('uams-academics:'||p_university_id::text,0));
 FOR r IN SELECT * FROM jsonb_array_elements(p_records) LOOP
  IF r->>'kind' NOT IN ('grade','event','date') OR coalesce(length(r->>'source_id'),0)=0 OR r->>'updated_at' IS NULL OR jsonb_typeof(r->'is_published')<>'boolean' THEN RAISE EXCEPTION 'Invalid source record'; END IF;
  student:=NULL;
  IF r->>'kind'='grade' THEN
   SELECT p.id INTO student FROM public.user_profiles p JOIN public.university_memberships m ON m.user_id=p.id WHERE m.university_id=p_university_id AND lower(p.email)=lower(r->>'student_email') AND m.role='student';
   IF student IS NULL THEN RAISE EXCEPTION 'Grade references unknown enrolled student'; END IF;
  END IF;
  SELECT * INTO previous FROM public.uams_academic_records WHERE university_id=p_university_id AND kind=r->>'kind' AND source_id=r->>'source_id';
  IF FOUND AND previous.source_updated_at>=(r->>'updated_at')::timestamptz THEN unchanged_count:=unchanged_count+1;CONTINUE; END IF;
  IF previous.id IS NULL THEN inserted_count:=inserted_count+1; ELSE updated_count:=updated_count+1; END IF;
  INSERT INTO public.uams_academic_records(university_id,kind,source_id,student_id,data,source_updated_at) VALUES(p_university_id,r->>'kind',r->>'source_id',student,r,(r->>'updated_at')::timestamptz)
  ON CONFLICT(university_id,kind,source_id) DO UPDATE SET data=excluded.data,student_id=excluded.student_id,source_updated_at=excluded.source_updated_at;
 END LOOP;
 RETURN jsonb_build_object('processed',jsonb_array_length(p_records),'inserted',inserted_count,'updated',updated_count,'unchanged',unchanged_count);
END $$;
REVOKE ALL ON FUNCTION public.sync_uams_academic_records(uuid,jsonb) FROM PUBLIC,authenticated,anon;
GRANT EXECUTE ON FUNCTION public.sync_uams_academic_records(uuid,jsonb) TO service_role;

CREATE TABLE public.uams_support_deliveries(university_id uuid NOT NULL REFERENCES public.universities(id),kind text NOT NULL,source_id text NOT NULL,source_updated_at timestamptz NOT NULL,delivered_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(university_id,kind,source_id));
ALTER TABLE public.uams_support_deliveries ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.uams_support_deliveries TO service_role;
ALTER TABLE public.help_requests ADD COLUMN uams_reviewed_at timestamptz;
ALTER TABLE public.sync_runs ADD COLUMN university_id uuid REFERENCES public.universities(id);
DROP POLICY IF EXISTS "Service role can manage sync runs" ON public.sync_runs;
DROP POLICY IF EXISTS "Admins and staff can view sync runs" ON public.sync_runs;
CREATE POLICY "Service role manages sync runs" ON public.sync_runs FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY "Tenant staff reads sync runs" ON public.sync_runs FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.university_memberships m WHERE m.user_id=auth.uid() AND m.university_id=sync_runs.university_id AND m.role IN('staff','admin','super_admin')));

CREATE TABLE public.event_attendance(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.user_profiles(id),university_id uuid NOT NULL REFERENCES public.universities(id),event_id uuid NOT NULL,status text NOT NULL DEFAULT 'checked_in' CHECK(status IN('checked_in','cancelled')),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(user_id,event_id));
CREATE FUNCTION public.stamp_event_attendance() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$BEGIN IF TG_OP='INSERT' THEN NEW.created_at:=now();END IF;NEW.updated_at:=now();RETURN NEW;END$$;
CREATE TRIGGER stamp_event_attendance BEFORE INSERT OR UPDATE ON public.event_attendance FOR EACH ROW EXECUTE FUNCTION public.stamp_event_attendance();
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON public.event_attendance TO authenticated;
GRANT ALL ON public.event_attendance TO service_role;
CREATE POLICY "Students read own event attendance" ON public.event_attendance FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Verified students self check in during event" ON public.event_attendance FOR INSERT TO authenticated WITH CHECK(
 user_id=auth.uid() AND status='checked_in' AND EXISTS(SELECT 1 FROM public.university_memberships m WHERE m.user_id=auth.uid() AND m.university_id=event_attendance.university_id AND m.verification_status='verified') AND (
 EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.university_id=event_attendance.university_id AND e.is_published AND now() BETWEEN ((e.event_date+e.start_time) AT TIME ZONE 'Africa/Nairobi')-interval '30 minutes' AND ((e.event_date+coalesce(e.end_time,'23:59'::time)) AT TIME ZONE 'Africa/Nairobi')) OR
 EXISTS(SELECT 1 FROM public.uams_academic_records e WHERE e.id=event_id AND e.university_id=event_attendance.university_id AND e.kind='event' AND (e.data->>'is_published')::boolean AND now() BETWEEN (e.data->>'starts_at')::timestamptz-interval '30 minutes' AND (e.data->>'ends_at')::timestamptz)
 ));

-- SOURCE: 20261021221906_audit_tenant_security.sql
-- Audit readers must be verified staff in the event's university, and browser
-- clients cannot impersonate a null system actor. Cron writes use service_role.
DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Staff and admins can insert audit log entries" ON public.audit_log;
REVOKE ALL ON public.audit_log FROM anon,authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
CREATE POLICY audit_tenant_read ON public.audit_log FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.university_memberships m WHERE m.user_id=(SELECT auth.uid()) AND m.verification_status='verified' AND m.role IN ('staff','admin','super_admin') AND m.university_id::text=details->>'university_id')
);
-- Audit writes happen only in the internal server writer after actor derivation.
-- This prevents direct Data API callers from fabricating arbitrary audit events.
GRANT DELETE ON public.help_requests TO authenticated;
DO $$ BEGIN IF to_regclass('public.help_request_seq') IS NOT NULL THEN GRANT USAGE,SELECT ON SEQUENCE public.help_request_seq TO authenticated; END IF; END $$;
CREATE POLICY own_or_staff_ticket_withdraw ON public.help_requests FOR DELETE TO authenticated USING (
 student_id=(SELECT auth.uid()) OR user_id=(SELECT auth.uid()) OR public.is_university_staff((SELECT auth.uid()),university_id)
);

CREATE OR REPLACE FUNCTION public.enforce_help_request_security()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid := auth.uid(); staff boolean;
BEGIN
 IF current_user IN ('postgres','service_role','supabase_admin') THEN RETURN NEW; END IF;
 IF actor IS NULL THEN RAISE EXCEPTION 'Authenticated ticket actor required'; END IF;
 IF NOT public.is_verified_member(actor,NEW.university_id) THEN RAISE EXCEPTION 'Verified tenant membership required'; END IF;
 staff := public.is_university_staff(actor,NEW.university_id);
 IF TG_OP='INSERT' THEN
   IF coalesce(NEW.student_id,NEW.user_id)<>actor OR (NEW.student_id IS NOT NULL AND NEW.user_id IS NOT NULL AND NEW.student_id<>NEW.user_id)
      OR NEW.status<>'submitted' OR NEW.assigned_staff_id IS NOT NULL OR NEW.assigned_to IS NOT NULL THEN
     RAISE EXCEPTION 'Invalid ticket ownership or initial workflow';
   END IF;
 ELSE
   IF NEW.university_id IS DISTINCT FROM OLD.university_id OR NEW.student_id IS DISTINCT FROM OLD.student_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Ticket ownership is immutable'; END IF;
   IF NOT staff AND (actor<>OLD.student_id OR OLD.status<>'submitted'
      OR NEW.status IS DISTINCT FROM OLD.status OR NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id
      OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR NEW.is_sensitive IS DISTINCT FROM OLD.is_sensitive
      OR NEW.sensitive_type IS DISTINCT FROM OLD.sensitive_type OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at
      OR NEW.resolution_notes IS DISTINCT FROM OLD.resolution_notes) THEN RAISE EXCEPTION 'Staff workflow fields cannot be changed by students'; END IF;
   IF NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id THEN NEW.assigned_to:=NEW.assigned_staff_id;
   ELSIF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN NEW.assigned_staff_id:=NEW.assigned_to; END IF;
 END IF;
 IF NEW.assigned_staff_id IS NOT NULL AND NOT public.is_university_staff(NEW.assigned_staff_id,NEW.university_id) THEN RAISE EXCEPTION 'Assignee must be verified staff of the ticket university'; END IF;
 IF NEW.campus_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.campuses c WHERE c.id=NEW.campus_id AND c.university_id=NEW.university_id) THEN RAISE EXCEPTION 'Ticket campus must belong to its university'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_help_request_security() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER check_help_request_security BEFORE INSERT OR UPDATE ON public.help_requests FOR EACH ROW EXECUTE FUNCTION public.enforce_help_request_security();

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT required.table_name,
       c.oid IS NOT NULL AS exists,
       c.relrowsecurity AS rls_enabled
FROM (VALUES
 ('sync_runs'), ('pilot_feedback'), ('push_subscriptions'),
 ('push_deliveries'), ('event_rsvps'), ('club_memberships'),
 ('uams_academic_records'), ('uams_support_deliveries'), ('event_attendance')
) AS required(table_name)
LEFT JOIN pg_catalog.pg_class c
  ON c.oid = to_regclass('public.' || required.table_name)
ORDER BY required.table_name;