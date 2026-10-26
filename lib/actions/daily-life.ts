'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import { ClassChangeAlert, MorningCardBrief } from '@/lib/daily-life/types';
import { DEMO_CLASS_CHANGE_ALERTS, DEMO_MORNING_CARD_BRIEF } from '@/lib/daily-life/demo-data';
import { getStudentTodayScheduleAction, TimetableEntry } from '@/lib/actions/academics';
import { getStudentFeeStatementsAction } from '@/lib/actions/fees';
import { getPrimaryFeeDeadlineAlert } from '@/lib/finance/deadline-alerts';

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
 * Strictly queries the student's actual timetable for today, true next class, and authoritative fee deadline.
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

    // 1. Fetch student profile and verified membership
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

    const admissionNumber =
      membership?.registration_number ||
      `REG/${user!.id.substring(0, 5).toUpperCase()}/2026`;
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

    // 2. Query today's actual lectures from the student's weekly timetable (NOT exam schedule)
    const todayRes = await getStudentTodayScheduleAction();
    const todayLectures: TimetableEntry[] = todayRes.success ? todayRes.entries : [];
    const classesCount = todayLectures.length;

    // Resolve true next upcoming lecture by time comparison
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let nextClass: MorningCardBrief['nextClass'] = null;

    if (todayLectures.length > 0) {
      // Sort chronologically by start_time
      const sorted = [...todayLectures].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const upcoming = sorted.find((entry) => {
        const [h, m] = entry.endTime.split(':').map((p) => parseInt(p, 10));
        const entryEndMinutes = (isNaN(h) ? 23 : h) * 60 + (isNaN(m) ? 59 : m);
        return entryEndMinutes >= currentMinutes;
      });

      const selectedEntry = upcoming || null;
      if (selectedEntry) {
        nextClass = {
          code: selectedEntry.code,
          name: selectedEntry.name,
          time: selectedEntry.startTime,
          venue: selectedEntry.venue,
          lecturerName: selectedEntry.lecturerName,
        };
      }
    }

    // 3. Query fee statements and resolve real deadline from deadline alert library
    let urgentDeadline: MorningCardBrief['urgentDeadline'] = null;
    const feeRes = await getStudentFeeStatementsAction();
    if (feeRes.success && feeRes.statements && feeRes.statements.length > 0) {
      const latestStatement = feeRes.statements[0];
      if (latestStatement.balance > 0) {
        const deadlineAlert = getPrimaryFeeDeadlineAlert({ statement: latestStatement });
        if (deadlineAlert) {
          urgentDeadline = {
            title: deadlineAlert.headline,
            detail: deadlineAlert.message,
            dueDateFormatted: deadlineAlert.formattedDueDate,
            category: 'fee',
            actionHref: '/fees',
            actionLabel: 'View Statement',
          };
        }
      }
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
 * Strictly filters by the student's enrolled course units.
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

    // 1. Discover the student's enrolled courses from academic records
    const { data: academicRows } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('student_id', user!.id)
      .in('kind', ['grade', 'exam_schedule']);

    const enrolledCodes = new Set<string>();
    for (const row of academicRows || []) {
      const code = (row.data as any)?.course_code;
      if (typeof code === 'string' && code.trim().length > 0) {
        enrolledCodes.add(code.trim().toUpperCase());
      }
    }

    // Also include courses from the student's weekly timetable
    const todayRes = await getStudentTodayScheduleAction();
    if (todayRes.success) {
      for (const entry of todayRes.entries) {
        if (entry.code) {
          enrolledCodes.add(entry.code.trim().toUpperCase());
        }
      }
    }

    if (enrolledCodes.size === 0) {
      return { success: true, alerts: [], isDemo: false };
    }

    // 2. Query announcements matching enrolled courses
    const { data: rows } = await supabase
      .from('announcements')
      .select('id, title, body, category, priority, created_at')
      .in('category', ['academic', 'timetable', 'class_change'])
      .order('created_at', { ascending: false })
      .limit(20);

    const alerts: ClassChangeAlert[] = [];
    for (const row of rows || []) {
      const titleUpper = row.title.toUpperCase();
      const bodyUpper = row.body.toUpperCase();

      // Check if this notice references any of the student's enrolled courses
      let matchedCode: string | null = null;
      for (const code of enrolledCodes) {
        if (titleUpper.includes(code) || bodyUpper.includes(code)) {
          matchedCode = code;
          break;
        }
      }

      if (matchedCode) {
        // Detect change type strictly from announcement text
        const isVenue = titleUpper.includes('VENUE') || titleUpper.includes('MOVED') || titleUpper.includes('ROOM') || bodyUpper.includes('VENUE');
        const isReschedule = titleUpper.includes('RESCHEDULE') || titleUpper.includes('TIME') || bodyUpper.includes('RESCHEDULE');
        const isCancelled = titleUpper.includes('CANCEL') || bodyUpper.includes('CANCEL');

        const changeType = isVenue ? 'venue_change' : isReschedule ? 'reschedule' : isCancelled ? 'cancelled' : 'venue_change';

        alerts.push({
          id: row.id,
          courseCode: matchedCode,
          courseName: 'Registered Unit Notice',
          changeType,
          title: row.title,
          message: row.body,
          originalDetail: 'Scheduled Session',
          newDetail: 'See Notice Details',
          effectiveDate: row.created_at.split('T')[0],
          effectiveTime: 'Refer to timetable',
          lecturerName: 'Course Lecturer',
          postedAt: row.created_at,
          isUrgent: row.priority === 'P1',
        });
      }
    }

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
