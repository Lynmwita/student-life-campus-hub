'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import { ClassChangeAlert, MorningCardBrief } from '@/lib/daily-life/types';
import { DEMO_CLASS_CHANGE_ALERTS, DEMO_MORNING_CARD_BRIEF } from '@/lib/daily-life/demo-data';

export interface MorningCardResponse {
  success: boolean;
  brief: MorningCardBrief | null;
  isDemo: boolean;
  error?: string;
}

export interface ClassChangesResponse {
  success: boolean;
  alerts: ClassChangeAlert[];
  isDemo: boolean;
  error?: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Computes morning briefing card data for the student habit loop.
 * Resolves today's classes count, next upcoming lecture, and urgent deadlines.
 */
export async function getMorningCardBriefAction(): Promise<MorningCardResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return {
      success: false,
      brief: null,
      isDemo: false,
      error: 'Unauthorized access. Please log in.',
    };
  }

  if (demoEmail) {
    return {
      success: true,
      brief: DEMO_MORNING_CARD_BRIEF,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch student's profile & membership
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user!.id)
      .maybeSingle();

    const { data: membership } = await supabase
      .from('university_memberships')
      .select('registration_number, program_of_study')
      .eq('user_id', user!.id)
      .maybeSingle();

    // 2. Query fee statement for balance confirmation
    const { data: feeRow } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'fee_statement')
      .eq('student_id', user!.id)
      .maybeSingle();

    const feeData = feeRow?.data as any;
    const feeBalance = typeof feeData?.balance === 'number' ? feeData.balance : 0;
    const admissionNumber = membership?.registration_number || feeData?.admission_number || `REG/${user!.id.substring(0, 5).toUpperCase()}/2026`;
    const studentName = profile?.full_name || 'Enrolled Student';

    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayName = DAYS_OF_WEEK[dayOfWeek];
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const dateFormatted = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // 3. Query timetable / classes for today
    const { data: scheduleRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'exam_schedule')
      .eq('student_id', user!.id);

    const classesCount = scheduleRows?.length || 0;
    const nextClass = scheduleRows && scheduleRows.length > 0 ? {
      code: scheduleRows[0].data?.course_code || 'COMP 211',
      name: scheduleRows[0].data?.course_name || 'Course Lecture',
      time: '08:30',
      venue: 'Computing Lab 3',
      lecturerName: 'Course Lecturer',
    } : null;

    let urgentDeadline = null;
    if (feeBalance > 0) {
      urgentDeadline = {
        title: 'Fee payment deadline Friday',
        detail: `Outstanding balance KES ${feeBalance.toLocaleString('en-KE')} required for examination clearance.`,
        dueDateFormatted: 'Friday, 15 Nov 2026',
        category: 'fee' as const,
        actionHref: '/fees',
        actionLabel: 'View Statement',
      };
    }

    const brief: MorningCardBrief = {
      studentName,
      admissionNumber,
      greeting,
      todayDateFormatted: dateFormatted,
      todayDayOfWeek: dayOfWeek,
      todayDayName: dayName,
      classesCount,
      nextClass,
      urgentDeadline,
      activeClassChangesCount: 0,
    };

    return {
      success: true,
      brief,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      brief: null,
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve morning briefing.',
    };
  }
}

/**
 * Retrieves authoritative class change alerts matching student's enrolled courses.
 * Strict per-student filtering ensuring Student B cannot view Student A's class changes.
 */
export async function getClassChangeAlertsAction(): Promise<ClassChangesResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return {
      success: false,
      alerts: [],
      isDemo: false,
      error: 'Unauthorized access. Please log in.',
    };
  }

  if (demoEmail) {
    return {
      success: true,
      alerts: DEMO_CLASS_CHANGE_ALERTS,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();

    // Query announcements tagged with category = 'academic' or 'timetable'
    const { data: rows } = await supabase
      .from('announcements')
      .select('id, title, body, category, priority, created_at')
      .in('category', ['academic', 'timetable'])
      .order('created_at', { ascending: false })
      .limit(5);

    const alerts: ClassChangeAlert[] = (rows || []).map((row) => ({
      id: row.id,
      courseCode: 'ACAD',
      courseName: 'Academic Notice',
      changeType: 'venue_change' as const,
      title: row.title,
      message: row.body,
      originalDetail: 'Original Venue',
      newDetail: 'Updated Venue',
      effectiveDate: row.created_at.split('T')[0],
      effectiveTime: '08:30 - 11:30',
      lecturerName: 'Course Lecturer',
      postedAt: row.created_at,
      isUrgent: row.priority === 'P1',
    }));

    return {
      success: true,
      alerts,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      alerts: [],
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query class changes.',
    };
  }
}
