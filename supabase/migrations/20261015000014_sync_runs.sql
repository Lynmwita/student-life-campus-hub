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
