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
-- WARNING: The credentials below (e.g. StaffPassword123!) are strictly for local
-- development and automated integration testing. NEVER use hardcoded or default
-- passwords in a production or public staging database.
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


-- ==============================================================================
-- Seed: Kenyan University Directory
--
-- Inserts every CUE-accredited chartered university in Kenya (public + private)
-- plus the Open University of Kenya (public, student-facing virtual university),
-- each tagged with county and ownership (public/private).
--
-- Source: Commission for University Education approved-universities list
-- (as at 30 Jul 2026, cue.or.ke), cross-checked against Wikipedia's
-- 'List of universities and colleges in Kenya' (citing CUE, 12 Mar 2026)
-- and the May 2026 CUE list (tuko.co.ke).
--
-- REQUIRES migration 20261015000008_university_directory_columns.sql
--
-- Pilot rows are PRESERVED:
--   * Summit Metropolitan University (fictional pilot) is NOT in this file
--     and is left untouched (county/ownership stay NULL).
--   * Zetech University IS in this file with its existing slug
--     ('zetech-university'); ON CONFLICT (slug) merges the directory data
--     into the existing pilot row instead of duplicating it.
-- ==============================================================================

INSERT INTO public.universities (id, name, slug, code, county, ownership, domain, logo_url, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'University of Nairobi', 'university-of-nairobi', 'UON', 'Nairobi', 'public', 'uonbi.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000002', 'Moi University', 'moi-university', 'MU', 'Uasin Gishu', 'public', 'mu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000003', 'Kenyatta University', 'kenyatta-university', 'KU', 'Nairobi', 'public', 'ku.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000004', 'Egerton University', 'egerton-university', 'EU', 'Nakuru', 'public', 'egerton.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000005', 'Jomo Kenyatta University of Agriculture and Technology', 'jomo-kenyatta-university-of-agriculture-and-technology', 'JKUAT', 'Kiambu', 'public', 'jkuat.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000006', 'Maseno University', 'maseno-university', 'MSU', 'Kisumu', 'public', 'maseno.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000007', 'Masinde Muliro University of Science and Technology', 'masinde-muliro-university-of-science-and-technology', 'MMUST', 'Kakamega', 'public', 'mmust.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000008', 'Dedan Kimathi University of Technology', 'dedan-kimathi-university-of-technology', 'DeKUT', 'Nyeri', 'public', 'dekut.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000009', 'Chuka University', 'chuka-university', 'CU', 'Tharaka Nithi', 'public', 'chuka.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000010', 'Technical University of Kenya', 'technical-university-of-kenya', 'TUK', 'Nairobi', 'public', 'tuk.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000011', 'Technical University of Mombasa', 'technical-university-of-mombasa', 'TUM', 'Mombasa', 'public', 'tum.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000012', 'Pwani University', 'pwani-university', 'PU', 'Kilifi', 'public', 'pwani.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000013', 'Kisii University', 'kisii-university', 'KSU', 'Kisii', 'public', 'kisiiuniversity.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000014', 'University of Eldoret', 'university-of-eldoret', 'UoE', 'Uasin Gishu', 'public', 'uoeld.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000015', 'Maasai Mara University', 'maasai-mara-university', 'MARA', 'Narok', 'public', 'mmarau.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000016', 'Jaramogi Oginga Odinga University of Science and Technology', 'jaramogi-oginga-odinga-university-of-science-and-technology', 'JOOUST', 'Siaya', 'public', 'jooust.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000017', 'Laikipia University', 'laikipia-university', 'LU', 'Laikipia', 'public', 'laikipia.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000018', 'South Eastern Kenya University', 'south-eastern-kenya-university', 'SEKU', 'Kitui', 'public', 'seku.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000019', 'Meru University of Science and Technology', 'meru-university-of-science-and-technology', 'MUST', 'Meru', 'public', 'must.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000020', 'Multimedia University of Kenya', 'multimedia-university-of-kenya', 'MMU', 'Nairobi', 'public', 'mmu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000021', 'University of Kabianga', 'university-of-kabianga', 'UoK', 'Kericho', 'public', 'kabianga.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000022', 'Karatina University', 'karatina-university', 'KarU', 'Nyeri', 'public', 'karu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000023', 'Kibabii University', 'kibabii-university', 'KIBU', 'Bungoma', 'public', 'kibu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000024', 'Rongo University', 'rongo-university', 'RU', 'Migori', 'public', NULL, NULL, true),
  ('30000000-0000-0000-0000-000000000025', 'The Co-operative University of Kenya', 'co-operative-university-of-kenya', 'CUK', 'Nairobi', 'public', 'cuk.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000026', 'Taita Taveta University', 'taita-taveta-university', 'TTU', 'Taita-Taveta', 'public', 'ttu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000027', 'Murang''a University of Technology', 'muranga-university-of-technology', 'MUT', 'Murang''a', 'public', 'mut.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000028', 'University of Embu', 'university-of-embu', 'UoEm', 'Embu', 'public', 'embu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000029', 'Machakos University', 'machakos-university', 'MKSU', 'Machakos', 'public', 'machakos.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000030', 'Kirinyaga University', 'kirinyaga-university', 'KYU', 'Kirinyaga', 'public', 'kyu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000031', 'Garissa University', 'garissa-university', 'GaU', 'Garissa', 'public', 'gau.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000032', 'Alupe University', 'alupe-university', 'AU', 'Busia', 'public', 'au.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000033', 'Kaimosi Friends University', 'kaimosi-friends-university', 'KAFU', 'Vihiga', 'public', 'kafu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000034', 'Tom Mboya University', 'tom-mboya-university', 'TMU', 'Homa Bay', 'public', 'tmu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000035', 'Tharaka University', 'tharaka-university', 'TU', 'Tharaka Nithi', 'public', 'tharaka.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000036', 'Bomet University', 'bomet-university', 'BU', 'Bomet', 'public', 'bomet.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000037', 'Open University of Kenya', 'open-university-of-kenya', 'OUK', 'Machakos', 'public', 'ouk.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000038', 'University of Eastern Africa, Baraton', 'university-of-eastern-africa-baraton', 'UEAB', 'Nandi', 'private', 'ueab.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000039', 'Catholic University of Eastern Africa', 'catholic-university-of-eastern-africa', 'CUEA', 'Nairobi', 'private', 'cuea.edu', NULL, true),
  ('30000000-0000-0000-0000-000000000040', 'Daystar University', 'daystar-university', 'DU', 'Machakos', 'private', 'daystar.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000041', 'Scott Christian University', 'scott-christian-university', 'SCU', 'Machakos', 'private', 'scott.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000042', 'United States International University', 'united-states-international-university', 'USIU', 'Nairobi', 'private', 'usiu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000043', 'Africa Nazarene University', 'africa-nazarene-university', 'ANU', 'Kajiado', 'private', 'anu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000044', 'Kenya Methodist University', 'kenya-methodist-university', 'KeMU', 'Meru', 'private', 'kemu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000045', 'St. Paul''s University', 'st-pauls-university', 'SPU', 'Kiambu', 'private', 'spu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000046', 'Pan Africa Christian University', 'pan-africa-christian-university', 'PAC', 'Nairobi', 'private', NULL, NULL, true),
  ('30000000-0000-0000-0000-000000000047', 'Strathmore University', 'strathmore-university', 'SU', 'Nairobi', 'private', 'strathmore.edu', NULL, true),
  ('30000000-0000-0000-0000-000000000048', 'Kabarak University', 'kabarak-university', 'KABU', 'Nakuru', 'private', 'kabarak.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000049', 'Mount Kenya University', 'mount-kenya-university', 'MKU', 'Kiambu', 'private', 'mku.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000050', 'Africa International University', 'africa-international-university', 'AIU', 'Nairobi', 'private', 'aiu.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000051', 'Kenya Highlands Evangelical University', 'kenya-highlands-evangelical-university', 'KHEU', 'Kericho', 'private', NULL, NULL, true),
  ('30000000-0000-0000-0000-000000000052', 'Great Lakes University of Kisumu', 'great-lakes-university-of-kisumu', 'GLUK', 'Kisumu', 'private', 'gluk.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000053', 'KCA University', 'kca-university', 'KCAU', 'Nairobi', 'private', 'kcau.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000054', 'Adventist University of Africa', 'adventist-university-of-africa', 'AUA', 'Kajiado', 'private', 'aua.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000055', 'KAG EAST University', 'kag-east-university', 'KAGEU', 'Kajiado', 'private', 'east.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000056', 'Umma University', 'umma-university', 'UU', 'Kiambu', 'private', 'umma.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000057', 'Presbyterian University of East Africa', 'presbyterian-university-of-east-africa', 'PUEA', 'Kiambu', 'private', 'puea.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000058', 'Aga Khan University', 'aga-khan-university', 'AKU', 'Nairobi', 'private', 'aku.edu', NULL, true),
  ('30000000-0000-0000-0000-000000000059', 'Kiriri Women''s University of Science and Technology', 'kiriri-womens-university-of-science-and-technology', 'KWUST', 'Nairobi', 'private', 'kwust.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000060', 'The East African University', 'the-east-african-university', 'TEAU', 'Kajiado', 'private', 'teau.ac.ke', NULL, true),
  ('00000000-0000-0000-0000-000000000002', 'Zetech University', 'zetech-university', 'ZU', 'Kiambu', 'private', 'zetech.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000062', 'Lukenya University', 'lukenya-university', 'LUKU', 'Makueni', 'private', 'lukenyauniversity.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000063', 'Management University of Africa', 'management-university-of-africa', 'MUA', 'Nairobi', 'private', NULL, NULL, true),
  ('30000000-0000-0000-0000-000000000064', 'Tangaza University', 'tangaza-university', 'TANU', 'Nairobi', 'private', 'tangaza.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000065', 'Islamic University of Kenya', 'islamic-university-of-kenya', 'IUK', 'Kajiado', 'private', 'iuk.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000066', 'Riara University', 'riara-university', 'RIARA', 'Nairobi', 'private', 'riarauniversity.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000067', 'Uzima University', 'uzima-university', 'UZIMA', 'Kisumu', 'private', NULL, NULL, true),
  ('30000000-0000-0000-0000-000000000068', 'Gretsa University', 'gretsa-university', 'GU', 'Kiambu', 'private', 'gretsa.ac.ke', NULL, true),
  ('30000000-0000-0000-0000-000000000069', 'Amref International University', 'amref-international-university', 'AMIU', 'Nairobi', 'private', NULL, NULL, true)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  county = EXCLUDED.county,
  ownership = EXCLUDED.ownership,
  domain = EXCLUDED.domain,
  is_active = EXCLUDED.is_active;
