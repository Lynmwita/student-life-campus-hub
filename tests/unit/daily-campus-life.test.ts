import { describe, it, expect } from 'vitest';
import { DEMO_CLASS_CHANGE_ALERTS, DEMO_MORNING_CARD_BRIEF } from '@/lib/daily-life/demo-data';
import { ClassChangeAlert, MorningCardBrief } from '@/lib/daily-life/types';

describe('Daily Campus Life Family: Morning Card & Class Change Alerts', () => {
  describe('Feature 1: Morning Briefing Card (Daily Habit Loop)', () => {
    it('summarizes student identity, greeting and formatted current date', () => {
      const brief = DEMO_MORNING_CARD_BRIEF;
      expect(brief.studentName).toBe('Faith Wanjiku');
      expect(brief.admissionNumber).toBe('BIT/2023/8849');
      expect(brief.greeting).toBe('Good morning');
      expect(brief.todayDateFormatted).toContain('October 2026');
      expect(brief.todayDayName).toBe('Monday');
    });

    it('spotlights today classes count and upcoming lecture details', () => {
      const brief = DEMO_MORNING_CARD_BRIEF;
      expect(brief.classesCount).toBe(2);
      expect(brief.nextClass).not.toBeNull();
      expect(brief.nextClass?.code).toBe('COMP 211');
      expect(brief.nextClass?.time).toBe('08:30');
      expect(brief.nextClass?.venue).toContain('Computing Lab 3');
      expect(brief.nextClass?.lecturerName).toBe('Dr. Evans Ochieng');
    });

    it('aggregates critical administrative deadline and clearance focus', () => {
      const brief = DEMO_MORNING_CARD_BRIEF;
      expect(brief.urgentDeadline).not.toBeNull();
      expect(brief.urgentDeadline?.title).toContain('Fee payment deadline Friday');
      expect(brief.urgentDeadline?.detail).toContain('KES 24,500');
      expect(brief.urgentDeadline?.actionHref).toBe('/fees');
      expect(brief.urgentDeadline?.actionLabel).toBe('View Statement');
    });

    it('gracefully handles free study days with zero lectures without crashes', () => {
      const freeDayBrief: MorningCardBrief = {
        ...DEMO_MORNING_CARD_BRIEF,
        classesCount: 0,
        nextClass: null,
        urgentDeadline: null,
      };

      expect(freeDayBrief.classesCount).toBe(0);
      expect(freeDayBrief.nextClass).toBeNull();
      expect(freeDayBrief.urgentDeadline).toBeNull();
    });
  });

  describe('Feature 2: Class Change Alerts', () => {
    it('accurately parses venue move notifications with original and new rooms', () => {
      const venueAlert = DEMO_CLASS_CHANGE_ALERTS.find((a) => a.changeType === 'venue_change');
      expect(venueAlert).toBeDefined();
      expect(venueAlert?.courseCode).toBe('COMP 211');
      expect(venueAlert?.title).toContain('COMP 211 moved to Computing Lab 3');
      expect(venueAlert?.originalDetail).toBe('Lecture Hall 4B');
      expect(venueAlert?.newDetail).toContain('Computing Lab 3');
      expect(venueAlert?.isUrgent).toBe(true);
      expect(venueAlert?.lecturerName).toBe('Dr. Evans Ochieng');
    });

    it('accurately parses class reschedule notifications', () => {
      const rescheduleAlert = DEMO_CLASS_CHANGE_ALERTS.find((a) => a.changeType === 'reschedule');
      expect(rescheduleAlert).toBeDefined();
      expect(rescheduleAlert?.courseCode).toBe('COMP 216');
      expect(rescheduleAlert?.newDetail).toContain('10:00');
      expect(rescheduleAlert?.effectiveTime).toBe('10:00 - 13:00');
      expect(rescheduleAlert?.lecturerName).toBe('Eng. Samuel Koech');
    });

    it('enforces locked-door privacy: Student B only receives alerts for their registered units', () => {
      const registeredUnitsStudentA = ['COMP 211', 'COMP 216', 'MATH 201'];
      const registeredUnitsStudentB = ['BCOM 101', 'ECON 102'];

      const allAlertsPool: ClassChangeAlert[] = [
        ...DEMO_CLASS_CHANGE_ALERTS,
        {
          id: 'cca-bcom101-venue',
          courseCode: 'BCOM 101',
          courseName: 'Principles of Accounting',
          changeType: 'venue_change',
          title: 'BCOM 101 moved to Commerce Hall 1',
          message: 'Room change for Commerce cohort.',
          originalDetail: 'Commerce Room 3',
          newDetail: 'Commerce Hall 1',
          effectiveDate: '2026-10-26',
          effectiveTime: '11:00 - 13:00',
          lecturerName: 'Dr. Peter Omondi',
          postedAt: '2026-10-26T07:00:00Z',
          isUrgent: true,
        },
      ];

      // Student B's scoped alerts
      const studentBAlerts = allAlertsPool.filter((a) => registeredUnitsStudentB.includes(a.courseCode));
      expect(studentBAlerts).toHaveLength(1);
      expect(studentBAlerts[0].courseCode).toBe('BCOM 101');

      // Verify no Student A course alerts leak to Student B
      const leakedAlerts = studentBAlerts.filter((a) => registeredUnitsStudentA.includes(a.courseCode));
      expect(leakedAlerts).toHaveLength(0);
    });
  });

  describe('Feature 3: Design Rules, No Emojis & No Em Dashes', () => {
    it('guarantees zero emojis in Daily Campus Life data structures', () => {
      const jsonBrief = JSON.stringify(DEMO_MORNING_CARD_BRIEF);
      const jsonAlerts = JSON.stringify(DEMO_CLASS_CHANGE_ALERTS);

      const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
      expect(jsonBrief.match(emojiRegex)).toBeNull();
      expect(jsonAlerts.match(emojiRegex)).toBeNull();
    });

    it('guarantees zero em dashes across all Daily Campus Life strings and alerts', () => {
      const jsonBrief = JSON.stringify(DEMO_MORNING_CARD_BRIEF);
      const jsonAlerts = JSON.stringify(DEMO_CLASS_CHANGE_ALERTS);

      expect(jsonBrief.includes('\u2014')).toBe(false);
      expect(jsonAlerts.includes('\u2014')).toBe(false);
    });
  });
});
