"use server";

import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Convert JS day (0=Sunday, 1=Monday..6=Saturday) to ISO day (1=Monday..7=Sunday)
  const jsDay = new Date().getDay();
  const isoDay = jsDay === 0 ? 7 : jsDay;
  const dayName = DAYS_OF_WEEK[isoDay] || "Today";

  if (!user) {
    return {
      success: false,
      message: "Not authenticated",
      dayOfWeek: isoDay,
      dayName,
      entries: [],
    };
  }

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

  if (error || !records) {
    return {
      success: true,
      dayOfWeek: isoDay,
      dayName,
      universityName,
      campusName,
      entries: [],
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

  return {
    success: true,
    dayOfWeek: isoDay,
    dayName,
    universityName,
    campusName,
    entries,
  };
}

/**
 * Fetches the full weekly timetable for the student's enrolled campus & university.
 */
export async function getStudentWeeklyTimetableAction(): Promise<WeeklyTimetableResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Not authenticated",
      entries: [],
    };
  }

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

  if (error || !records) {
    return {
      success: true,
      universityName,
      campusName,
      entries: [],
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

  return {
    success: true,
    universityName,
    campusName,
    entries,
  };
}

/**
 * Fetches active clubs/communities and published campus events.
 */
export async function getCampusLifeAction(): Promise<CampusLifeResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Not authenticated",
      clubs: [],
      events: [],
    };
  }

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
    clubs,
    events,
  };
}
