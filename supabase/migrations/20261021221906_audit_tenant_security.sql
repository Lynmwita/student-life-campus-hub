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
