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
