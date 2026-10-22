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
