"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const DEMO_TIMETABLE: TimetableEntry[] = [
  {
    id: "40000000-0000-0000-0000-000000000101",
    courseUnitId: "40000000-0000-0000-0000-000000000001",
    code: "COMP 211",
    name: "Object-Oriented Analysis & Design",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    yearOfStudy: 2,
    creditHours: 3,
    dayOfWeek: 1,
    startTime: "08:30",
    endTime: "11:30",
    venue: "Computing Lab 3 (Westlands)",
    lecturerName: "Dr. Evans Ochieng",
    campusName: "Main Campus (Westlands)",
    academicYear: "2026/2027",
    semester: 1,
  },
  {
    id: "40000000-0000-0000-0000-000000000102",
    courseUnitId: "40000000-0000-0000-0000-000000000002",
    code: "COMP 214",
    name: "Database Systems & Architecture",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    yearOfStudy: 2,
    creditHours: 3,
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "16:00",
    venue: "Lecture Hall 4B",
    lecturerName: "Prof. Catherine Ndung'u",
    campusName: "Main Campus (Westlands)",
    academicYear: "2026/2027",
    semester: 1,
  },
  {
    id: "40000000-0000-0000-0000-000000000103",
    courseUnitId: "40000000-0000-0000-0000-000000000003",
    code: "COMP 216",
    name: "Computer Networks & Data Communications",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    yearOfStudy: 2,
    creditHours: 3,
    dayOfWeek: 2,
    startTime: "09:00",
    endTime: "12:00",
    venue: "Networks & Cisco Lab",
    lecturerName: "Eng. Samuel Koech",
    campusName: "Main Campus (Westlands)",
    academicYear: "2026/2027",
    semester: 1,
  },
  {
    id: "40000000-0000-0000-0000-000000000104",
    courseUnitId: "40000000-0000-0000-0000-000000000004",
    code: "MATH 201",
    name: "Discrete Mathematics for Computing",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    yearOfStudy: 2,
    creditHours: 3,
    dayOfWeek: 3,
    startTime: "10:00",
    endTime: "13:00",
    venue: "Science Complex LT 1",
    lecturerName: "Dr. Mary Wambui",
    campusName: "Main Campus (Westlands)",
    academicYear: "2026/2027",
    semester: 1,
  },
  {
    id: "40000000-0000-0000-0000-000000000105",
    courseUnitId: "40000000-0000-0000-0000-000000000002",
    code: "COMP 214",
    name: "Database Systems & Architecture",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    yearOfStudy: 2,
    creditHours: 3,
    dayOfWeek: 4,
    startTime: "14:00",
    endTime: "17:00",
    venue: "Software Engineering Studio",
    lecturerName: "Prof. Catherine Ndung'u",
    campusName: "Main Campus (Westlands)",
    academicYear: "2026/2027",
    semester: 1,
  },
  {
    id: "40000000-0000-0000-0000-000000000106",
    courseUnitId: "40000000-0000-0000-0000-000000000003",
    code: "COMP 216",
    name: "Computer Networks & Data Communications",
    faculty: "School of Computing & Informatics",
    department: "Computer Science",
    yearOfStudy: 2,
    creditHours: 3,
    dayOfWeek: 5,
    startTime: "09:00",
    endTime: "12:00",
    venue: "Systems Lab 2",
    lecturerName: "Eng. Samuel Koech",
    campusName: "Main Campus (Westlands)",
    academicYear: "2026/2027",
    semester: 1,
  },
];

const DEMO_CLUBS: ClubItem[] = [
  {
    id: "40000000-0000-0000-0000-000000000201",
    name: "SMU Tech Innovators & GDSC",
    slug: "smu-tech-innovators",
    description: "Student developer community focusing on web, mobile, AI, and open-source software solutions.",
    category: "technology",
    patronName: "Dr. Evans Ochieng",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000002",
    name: "SMU Computing Students Association",
    slug: "smu-cssa",
    description: "Official departmental academic student association uniting all Computing & Informatics majors.",
    category: "academic",
    patronName: "Prof. Catherine Ndung'u",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000203",
    name: "Kenya Red Cross SMU Chapter",
    slug: "smu-red-cross",
    description: "First aid training, blood donation drives, disaster relief volunteering and community service.",
    category: "community_service",
    patronName: "Ms. Janet Korir",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000204",
    name: "SMU Christian Union (FOCUS Kenya)",
    slug: "smu-cu",
    description: "Inter-denominational evangelical fellowship organizing weekday Bible study, Sunday services, and outreach.",
    category: "faith",
    patronName: "Rev. Dr. Isaac Mutisya",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000205",
    name: "SMU Varsity Rugby Football Club",
    slug: "smu-rugby-rfc",
    description: "Premier university rugby team competing in Impala Floodlit circuit and KUSA varsity league.",
    category: "sports",
    patronName: "Coach Dan Kiprop",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000206",
    name: "Traveling Theater & Drama Troupe",
    slug: "smu-theater-troupe",
    description: "Stage plays, spoken word poetry, and Kenya National Drama Festival competitive performances.",
    category: "arts",
    patronName: "Ms. Linda Moraa",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000207",
    name: "Rotaract Club of Summit Metropolitan",
    slug: "smu-rotaract",
    description: "Community development, sanitation drives, career mentoring, and youth leadership summits.",
    category: "leadership",
    patronName: "Dr. Peter Kamau",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000208",
    name: "Cyber Security & PwnZone CTF Guild",
    slug: "smu-cybersec-pwnzone",
    description: "Ethical hacking labs, reverse engineering, and regional inter-university CTF competitions.",
    category: "technology",
    patronName: "Eng. Samuel Koech",
    campusName: "Main Campus",
  },
];

const DEMO_EVENTS: EventItem[] = [
  {
    id: "40000000-0000-0000-0000-000000000301",
    title: "Annual Inter-Campus Hackathon 2026",
    description: "A 48-hour buildathon addressing fintech and civic tech challenges. Mentors from Safaricom and Microsoft ADC.",
    venue: "Main Auditorium & Innovation Lab",
    eventDate: "Oct 24, 2026",
    rawDate: "2026-10-24",
    startTime: "08:00",
    endTime: "18:00",
    category: "hackathon",
    clubName: "SMU Tech Innovators & GDSC",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000302",
    title: "Cloud Architecture & DevOps Masterclass",
    description: "Hands-on practical training deploying Next.js and Supabase workloads on managed cloud infrastructure.",
    venue: "Computing Lab 3",
    eventDate: "Oct 28, 2026",
    rawDate: "2026-10-28",
    startTime: "14:00",
    endTime: "17:00",
    category: "workshop",
    clubName: "SMU Tech Innovators & GDSC",
    campusName: "Main Campus",
  },
  {
    id: "40000000-0000-0000-0000-000000000303",
    title: "Dean's Academic Excellence Awards",
    description: "Celebrating top-performing undergraduate scholars across all faculties with merit certificates and book prizes.",
    venue: "Main Campus Auditorium",
    eventDate: "Nov 5, 2026",
    rawDate: "2026-11-05",
    startTime: "10:00",
    endTime: "13:00",
    category: "academic",
    clubName: null,
    campusName: "Main Campus",
  },
];

export interface TimetableEntry {
  id: string;
  courseUnitId: string;
  code: string;
  name: string;
  faculty: string;
  department: string;
  yearOfStudy: number;
  creditHours: number;
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday
  startTime: string; // formatted HH:MM
  endTime: string;   // formatted HH:MM
  venue: string;
  lecturerName: string;
  campusName?: string;
  academicYear: string;
  semester: number;
}

export interface ClubItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "technology" | "academic" | "arts" | "sports" | "faith" | "leadership" | "community_service" | string;
  patronName: string | null;
  campusName?: string | null;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  eventDate: string;
  rawDate: string;
  startTime: string;
  endTime?: string | null;
  category: "academic" | "career" | "social" | "sports" | "hackathon" | "workshop" | string;
  clubName?: string | null;
  campusName?: string | null;
}

export interface TodayScheduleResponse {
  success: boolean;
  message?: string;
  dayOfWeek: number;
  dayName: string;
  universityName?: string;
  campusName?: string;
  entries: TimetableEntry[];
}

export interface WeeklyTimetableResponse {
  success: boolean;
  message?: string;
  universityName?: string;
  campusName?: string;
  entries: TimetableEntry[];
}

export interface CampusLifeResponse {
  success: boolean;
  message?: string;
  universityName?: string;
  clubs: ClubItem[];
  events: EventItem[];
}

const DAYS_OF_WEEK: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

/**
 * Fetches the student's scheduled lectures for today based on real timetable data.
 */
export async function getStudentTodayScheduleAction(): Promise<TodayScheduleResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  // Convert JS day (0=Sunday, 1=Monday..6=Saturday) to ISO day (1=Monday..7=Sunday)
  const jsDay = new Date().getDay();
  const isoDay = jsDay === 0 ? 7 : jsDay;
  const dayName = DAYS_OF_WEEK[isoDay] || "Today";

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  if (!user && demoEmail) {
    const dayEntries = DEMO_TIMETABLE.filter((e) => e.dayOfWeek === isoDay);
    return {
      success: true,
      dayOfWeek: isoDay,
      dayName,
      universityName: "Summit Metropolitan University",
      campusName: "Main Campus (Westlands)",
      entries: dayEntries,
    };
  }

  if (!user) {
    return {
      success: false,
      message: "Not authenticated",
      dayOfWeek: isoDay,
      dayName,
      entries: [],
    };
  }

  const supabase = await createClient();

  // Get student's verified membership for university & campus context
  const { data: memberships } = await supabase
    .from("university_memberships")
    .select(`
      university_id,
      campus_id,
      universities (name),
      campuses (name)
    `)
    .eq("user_id", user.id)
    .eq("verification_status", "verified")
    .limit(1);

  const activeMembership = memberships && memberships.length > 0 ? memberships[0] : null;
  const universityName =
    (activeMembership?.universities as unknown as { name?: string } | null)?.name ||
    "Summit Metropolitan University";
  const campusName =
    (activeMembership?.campuses as unknown as { name?: string } | null)?.name ||
    "Main Campus";

  // Query timetables for current day
  const { data: records, error } = await supabase
    .from("timetables")
    .select(`
      id,
      course_unit_id,
      day_of_week,
      start_time,
      end_time,
      venue,
      lecturer_name,
      academic_year,
      semester,
      campuses (name),
      course_units (
        code,
        name,
        faculty,
        department,
        year_of_study,
        credit_hours
      )
    `)
    .eq("day_of_week", isoDay)
    .eq("is_active", true)
    .order("start_time", { ascending: true });

  if (error || !records || records.length === 0) {
    const dayEntries = DEMO_TIMETABLE.filter((e) => e.dayOfWeek === isoDay);
    return {
      success: true,
      dayOfWeek: isoDay,
      dayName,
      universityName,
      campusName,
      entries: dayEntries,
    };
  }

  const entries: TimetableEntry[] = records.map((r) => {
    const cu = r.course_units as unknown as {
      code: string;
      name: string;
      faculty: string;
      department: string;
      year_of_study: number;
      credit_hours: number;
    } | null;

    const camp = r.campuses as unknown as { name: string } | null;

    return {
      id: r.id,
      courseUnitId: r.course_unit_id,
      code: cu?.code || "UNIT",
      name: cu?.name || "Course Unit",
      faculty: cu?.faculty || "",
      department: cu?.department || "",
      yearOfStudy: cu?.year_of_study || 1,
      creditHours: cu?.credit_hours || 3,
      dayOfWeek: r.day_of_week,
      startTime: formatTime(r.start_time),
      endTime: formatTime(r.end_time),
      venue: r.venue,
      lecturerName: r.lecturer_name,
      campusName: camp?.name || campusName,
      academicYear: r.academic_year,
      semester: r.semester,
    };
  });

  const seenTodayKeys = new Set<string>();
  const deduplicatedToday: TimetableEntry[] = [];
  for (const entry of entries) {
    const key = `${entry.code}-${entry.startTime}-${entry.venue}`.toLowerCase();
    if (!seenTodayKeys.has(key)) {
      seenTodayKeys.add(key);
      deduplicatedToday.push(entry);
    }
  }

  return {
    success: true,
    dayOfWeek: isoDay,
    dayName,
    universityName,
    campusName,
    entries: deduplicatedToday,
  };
}

/**
 * Fetches the full weekly timetable for the student's enrolled campus & university.
 */
export async function getStudentWeeklyTimetableAction(): Promise<WeeklyTimetableResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  if (!user && demoEmail) {
    return {
      success: true,
      universityName: "Summit Metropolitan University",
      campusName: "Main Campus (Westlands)",
      entries: DEMO_TIMETABLE,
    };
  }

  if (!user) {
    return {
      success: false,
      message: "Not authenticated",
      entries: [],
    };
  }

  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("university_memberships")
    .select(`
      university_id,
      campus_id,
      universities (name),
      campuses (name)
    `)
    .eq("user_id", user.id)
    .eq("verification_status", "verified")
    .limit(1);

  const activeMembership = memberships && memberships.length > 0 ? memberships[0] : null;
  const universityName =
    (activeMembership?.universities as unknown as { name?: string } | null)?.name ||
    "Summit Metropolitan University";
  const campusName =
    (activeMembership?.campuses as unknown as { name?: string } | null)?.name ||
    "Main Campus";

  const { data: records, error } = await supabase
    .from("timetables")
    .select(`
      id,
      course_unit_id,
      day_of_week,
      start_time,
      end_time,
      venue,
      lecturer_name,
      academic_year,
      semester,
      campuses (name),
      course_units (
        code,
        name,
        faculty,
        department,
        year_of_study,
        credit_hours
      )
    `)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error || !records || records.length === 0) {
    return {
      success: true,
      universityName,
      campusName,
      entries: DEMO_TIMETABLE,
    };
  }

  const entries: TimetableEntry[] = records.map((r) => {
    const cu = r.course_units as unknown as {
      code: string;
      name: string;
      faculty: string;
      department: string;
      year_of_study: number;
      credit_hours: number;
    } | null;

    const camp = r.campuses as unknown as { name: string } | null;

    return {
      id: r.id,
      courseUnitId: r.course_unit_id,
      code: cu?.code || "UNIT",
      name: cu?.name || "Course Unit",
      faculty: cu?.faculty || "",
      department: cu?.department || "",
      yearOfStudy: cu?.year_of_study || 1,
      creditHours: cu?.credit_hours || 3,
      dayOfWeek: r.day_of_week,
      startTime: formatTime(r.start_time),
      endTime: formatTime(r.end_time),
      venue: r.venue,
      lecturerName: r.lecturer_name,
      campusName: camp?.name || campusName,
      academicYear: r.academic_year,
      semester: r.semester,
    };
  });

  const seenWeeklyKeys = new Set<string>();
  const deduplicatedWeekly: TimetableEntry[] = [];
  for (const entry of entries) {
    const key = `${entry.code}-${entry.dayOfWeek}-${entry.startTime}-${entry.venue}`.toLowerCase();
    if (!seenWeeklyKeys.has(key)) {
      seenWeeklyKeys.add(key);
      deduplicatedWeekly.push(entry);
    }
  }

  return {
    success: true,
    universityName,
    campusName,
    entries: deduplicatedWeekly,
  };
}

/**
 * Fetches active clubs/communities and published campus events.
 */
export async function getCampusLifeAction(): Promise<CampusLifeResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // offline
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("smu_demo_session")?.value;

  if (!user && demoEmail) {
    return {
      success: true,
      universityName: "Summit Metropolitan University",
      clubs: DEMO_CLUBS,
      events: DEMO_EVENTS,
    };
  }

  if (!user) {
    return {
      success: false,
      message: "Not authenticated",
      clubs: [],
      events: [],
    };
  }

  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("university_memberships")
    .select("university_id, universities (name)")
    .eq("user_id", user.id)
    .eq("verification_status", "verified")
    .limit(1);

  const activeMembership = memberships && memberships.length > 0 ? memberships[0] : null;
  const universityName =
    (activeMembership?.universities as unknown as { name?: string } | null)?.name ||
    "Summit Metropolitan University";

  // Query clubs
  const { data: clubsData } = await supabase
    .from("clubs_communities")
    .select(`
      id,
      name,
      slug,
      description,
      category,
      patron_name,
      campuses (name)
    `)
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Query published events
  const { data: eventsData } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      venue,
      event_date,
      start_time,
      end_time,
      category,
      clubs_communities (name),
      campuses (name)
    `)
    .eq("is_published", true)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  const clubs: ClubItem[] = (clubsData || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    category: c.category,
    patronName: c.patron_name,
    campusName: (c.campuses as unknown as { name?: string } | null)?.name || null,
  }));

  const events: EventItem[] = (eventsData || []).map((e) => {
    const rawDate = e.event_date;
    const parsed = new Date(rawDate);
    const dateFormatted = !isNaN(parsed.getTime())
      ? parsed.toLocaleDateString("en-KE", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : rawDate;

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      venue: e.venue,
      eventDate: dateFormatted,
      rawDate,
      startTime: formatTime(e.start_time),
      endTime: e.end_time ? formatTime(e.end_time) : null,
      category: e.category,
      clubName: (e.clubs_communities as unknown as { name?: string } | null)?.name || null,
      campusName: (e.campuses as unknown as { name?: string } | null)?.name || null,
    };
  });

  return {
    success: true,
    universityName,
    clubs: clubs.length > 0 ? clubs : DEMO_CLUBS,
    events: events.length > 0 ? events : DEMO_EVENTS,
  };
}
