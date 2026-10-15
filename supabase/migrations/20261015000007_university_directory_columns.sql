-- ==============================================================================
-- Migration: 20261015000007_university_directory_columns.sql
-- Description: Add county and ownership columns to public.universities so the
--              Kenyan university directory seed can tag every institution by
--              county and public/private ownership.
-- ==============================================================================

ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS county TEXT;

ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS ownership TEXT
    CHECK (ownership IN ('public', 'private'));

CREATE INDEX IF NOT EXISTS idx_universities_county ON public.universities(county);
CREATE INDEX IF NOT EXISTS idx_universities_ownership ON public.universities(ownership);
