-- ==============================================================================
-- Seed Script: supabase/seed.sql
-- Pilot Institutions: Summit Metropolitan University (SMU) & Zetech University
-- ==============================================================================

-- 1. Pilot Universities
INSERT INTO public.universities (id, name, slug, code, domain, logo_url, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Summit Metropolitan University', 'summit-metropolitan-university', 'SMU', 'summit.ac.ke', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150', true),
    ('00000000-0000-0000-0000-000000000002', 'Zetech University', 'zetech-university', 'ZU', 'zetech.ac.ke', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150', true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    code = EXCLUDED.code,
    domain = EXCLUDED.domain;

-- 2. Campuses
INSERT INTO public.campuses (id, university_id, name, code, location, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Main Campus', 'SMU-MAIN', 'Westlands, Nairobi', true),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'City Campus', 'SMU-CITY', 'Nairobi CBD', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', 'Technology Park Campus', 'ZU-TECH', 'Mang''u, Kiambu', true),
    ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002', 'Ruiru Campus', 'ZU-RUIRU', 'Ruiru, Kiambu', true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    code = EXCLUDED.code,
    location = EXCLUDED.location;
