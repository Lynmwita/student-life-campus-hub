export type ClassChangeType = 'venue_change' | 'reschedule' | 'cancelled' | 'online_mode';

export interface ClassChangeAlert {
  id: string;
  courseCode: string;
  courseName: string;
  changeType: ClassChangeType;
  title: string;
  message: string;
  originalDetail: string;
  newDetail: string;
  effectiveDate: string;
  effectiveTime: string;
  lecturerName: string;
  postedAt: string;
  isUrgent: boolean;
}

export interface MorningCardBrief {
  studentName: string;
  admissionNumber: string;
  greeting: string;
  todayDateFormatted: string;
  todayDayOfWeek: number;
  todayDayName: string;
  classesCount: number;
  nextClass: {
    code: string;
    name: string;
    time: string;
    venue: string;
    lecturerName: string;
  } | null;
  urgentDeadline: {
    title: string;
    detail: string;
    dueDateFormatted: string;
    category: 'fee' | 'exam' | 'hostel';
    actionHref: string;
    actionLabel: string;
  } | null;
  activeClassChangesCount: number;
}
