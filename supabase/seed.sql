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

-- ------------------------------------------------------------------------------
-- 3. Super Admin & Initial Admin Bootstrapping Documentation
-- ------------------------------------------------------------------------------
-- Note: The very first super_admin cannot be created through the public API because
-- the security guard restricts role promotion to existing super admins.
--
-- Production / Staging Bootstrap Guide:
-- 1. Create a user via Supabase Auth Dashboard or API (e.g. root@studenthub.ac.ke).
-- 2. Run the following snippet in the Supabase SQL Console (runs as postgres/service_role):
--
--    INSERT INTO public.university_memberships (
--        user_id,
--        university_id,
--        role,
--        verification_status
--    )
--    SELECT
--        u.id,
--        '00000000-0000-0000-0000-000000000001',
--        'super_admin',
--        'verified'
--    FROM auth.users u
--    WHERE u.email = 'root@studenthub.ac.ke'
--    ON CONFLICT (user_id, university_id)
--    DO UPDATE SET role = 'super_admin', verification_status = 'verified';

-- ------------------------------------------------------------------------------
-- 4. Seed Official Staff Author for Broadcasts
-- ------------------------------------------------------------------------------
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
) VALUES (
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'registrar@summit.ac.ke',
    crypt('StaffPassword123!', gen_salt('bf')),
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"SMU Registrar & Academic Affairs"}',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, email, full_name)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'registrar@summit.ac.ke',
    'SMU Registrar & Academic Affairs'
) ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name;

INSERT INTO public.university_memberships (
    id,
    user_id,
    university_id,
    campus_id,
    role,
    faculty,
    department,
    verification_status
) VALUES (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'staff',
    'Academic Affairs',
    'Registrar Office',
    'verified'
) ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role,
    verification_status = EXCLUDED.verification_status;

-- ------------------------------------------------------------------------------
-- 5. Seed Real Pilot Announcements (Summit Metropolitan University)
-- ------------------------------------------------------------------------------
INSERT INTO public.announcements (
    id,
    university_id,
    campus_id,
    author_id,
    title,
    content,
    priority,
    target_scope,
    target_faculty,
    target_department,
    target_year,
    is_published,
    published_at
) VALUES
(
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000100',
    'Urgent: Campus Shuttle Service Rerouted Due to Road Maintenance',
    'All Westlands Campus shuttles will pick up and drop off students at Gate 3 along Ring Road until Friday 5:00 PM. Please plan extra 15 minutes of transit time.',
    'P1',
    'campus',
    NULL,
    NULL,
    NULL,
    true,
    timezone('utc'::text, now()) - interval '2 hours'
),
(
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    '00000000-0000-0000-0000-000000000100',
    'End of Semester Examination Draft Timetable Released',
    'The finalized draft timetable for School of Computing & Informatics is now uploaded. Review your unit codes and report any exam clash to the department coordinator before Oct 20.',
    'P2',
    'faculty',
    'School of Computing & Informatics',
    NULL,
    NULL,
    true,
    timezone('utc'::text, now()) - interval '1 day'
),
(
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    '00000000-0000-0000-0000-000000000100',
    'Annual Tech Innovation & Hackathon Registrations Open',
    'Form teams of 2 to 4 students. Mentors from Safaricom and Microsoft ADC will be hosting workshops next week. Cash prizes and internship fast-tracks for winners.',
    'P3',
    'all',
    NULL,
    NULL,
    NULL,
    true,
    timezone('utc'::text, now()) - interval '2 days'
),
(
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    '00000000-0000-0000-0000-000000000100',
    'Main Library Extended Revision Hours for Exam Period',
    'Starting next Monday, the main campus digital library will remain open until 11:00 PM on weekdays with high-speed Wi-Fi and power stations accessible to all verified students.',
    'P4',
    'all',
    NULL,
    NULL,
    NULL,
    true,
    timezone('utc'::text, now()) - interval '3 days'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    priority = EXCLUDED.priority,
    target_scope = EXCLUDED.target_scope,
    is_published = EXCLUDED.is_published;
