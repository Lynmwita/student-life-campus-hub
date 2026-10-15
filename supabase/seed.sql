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





-- ------------------------------------------------------------------------------
-- 6. Seed Course Units, Timetables, Clubs & Campus Life (Phase 5 Pilot)
-- ------------------------------------------------------------------------------
-- Course Units for Summit Metropolitan University (School of Computing & Informatics)
INSERT INTO public.course_units (id, university_id, code, name, faculty, department, year_of_study, semester, credit_hours)
VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'COMP 211', 'Object-Oriented Analysis & Design', 'School of Computing & Informatics', 'Computer Science', 2, 1, 3),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'COMP 214', 'Database Systems & Architecture', 'School of Computing & Informatics', 'Computer Science', 2, 1, 3),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'COMP 216', 'Computer Networks & Data Communications', 'School of Computing & Informatics', 'Computer Science', 2, 1, 3),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'MATH 201', 'Discrete Mathematics for Computing', 'School of Computing & Informatics', 'Computer Science', 2, 1, 3)
ON CONFLICT (university_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  faculty = EXCLUDED.faculty,
  department = EXCLUDED.department,
  year_of_study = EXCLUDED.year_of_study;

-- Timetable Schedules (Monday through Friday for Main Campus Westlands)
INSERT INTO public.timetables (id, university_id, campus_id, course_unit_id, day_of_week, start_time, end_time, venue, lecturer_name, semester, academic_year, is_active)
VALUES
  ('40000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000001', 1, '08:30:00', '11:30:00', 'Computing Lab 3 (Westlands)', 'Dr. Evans Ochieng', 1, '2026/2027', true),
  ('40000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000002', 1, '13:00:00', '16:00:00', 'Lecture Hall 4B', 'Prof. Catherine Ndung''u', 1, '2026/2027', true),
  ('40000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000003', 2, '09:00:00', '12:00:00', 'Networks & Cisco Lab', 'Eng. Samuel Koech', 1, '2026/2027', true),
  ('40000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000004', 3, '10:00:00', '13:00:00', 'Science Complex LT 1', 'Dr. Mary Wambui', 1, '2026/2027', true),
  ('40000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000002', 4, '14:00:00', '17:00:00', 'Software Engineering Studio', 'Prof. Catherine Ndung''u', 1, '2026/2027', true),
  ('40000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000003', 5, '09:00:00', '12:00:00', 'Systems Lab 2', 'Eng. Samuel Koech', 1, '2026/2027', true)
ON CONFLICT (id) DO UPDATE SET
  venue = EXCLUDED.venue,
  lecturer_name = EXCLUDED.lecturer_name,
  is_active = EXCLUDED.is_active;

-- Clubs & Communities
INSERT INTO public.clubs_communities (id, university_id, campus_id, name, slug, description, category, patron_name, is_active)
VALUES
  ('40000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'SMU Tech Innovators & GDSC', 'smu-tech-innovators', 'Student developer community focusing on web, mobile, AI, and open-source software solutions.', 'technology', 'Dr. Evans Ochieng', true),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'SMU Computing Students Association', 'smu-cssa', 'Official departmental academic student association uniting all Computing & Informatics majors.', 'academic', 'Prof. Catherine Ndung''u', true),
  ('40000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Kenya Red Cross SMU Chapter', 'smu-red-cross', 'First aid training, blood donation drives, disaster relief volunteering and community service.', 'community_service', 'Ms. Janet Korir', true)
ON CONFLICT (university_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  patron_name = EXCLUDED.patron_name;

-- Campus Events
INSERT INTO public.events (id, university_id, campus_id, club_id, organizer_id, title, description, venue, event_date, start_time, end_time, category, is_published)
VALUES
  ('40000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000100', 'Annual Inter-Campus Hackathon 2026', 'A 48-hour buildathon addressing fintech and civic tech challenges. Mentors from Safaricom and Microsoft ADC.', 'Main Auditorium & Innovation Lab', '2026-10-24', '08:00:00', '18:00:00', 'hackathon', true),
  ('40000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000100', 'Cloud Architecture & DevOps Masterclass', 'Hands-on practical training deploying Next.js and Supabase workloads on managed cloud infrastructure.', 'Computing Lab 3', '2026-10-28', '14:00:00', '17:00:00', 'workshop', true),
  ('40000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', NULL, '00000000-0000-0000-0000-000000000100', 'Dean''s Academic Excellence Awards', 'Celebrating top-performing undergraduate scholars across all faculties with merit certificates and book prizes.', 'Main Campus Auditorium', '2026-11-05', '10:00:00', '13:00:00', 'academic', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  venue = EXCLUDED.venue,
  event_date = EXCLUDED.event_date;
