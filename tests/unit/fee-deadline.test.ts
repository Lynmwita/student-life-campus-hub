import { describe, it, expect } from 'vitest';
import {
  calculateDaysRemaining,
  determineAlertWindow,
  formatShortDueDate,
  formatFeeDeadlineSmsAlert,
  getFeeDeadlineAlerts,
  getPrimaryFeeDeadlineAlert,
  FeeDeadlineAlert,
} from '@/lib/finance/deadline-alerts';
import { FeeItem } from '@/lib/finance/types';

describe('Item 4: Fee Deadline Alerts — Window Logic & Calculations', () => {
  const refDate = new Date('2026-11-10T10:00:00Z'); // Reference date: 10 Nov 2026

  const baseItem: FeeItem = {
    id: 'fee-exam-01',
    category: 'examination',
    title: 'Examination Services',
    description: 'Semester examination fee',
    amount: 4000,
    status: 'billed',
    due_date: '2026-11-15', // 5 days after 10 Nov
  };

  it('formats short due date correctly without em dashes or emojis', () => {
    expect(formatShortDueDate('2026-11-15')).toBe('15 Nov');
    expect(formatShortDueDate('2026-10-28')).toBe('28 Oct');
    expect(formatShortDueDate('2026-11-01')).toBe('1 Nov');
  });

  it('accurately calculates days remaining from reference date', () => {
    expect(calculateDaysRemaining('2026-11-18', refDate)).toBe(8);
    expect(calculateDaysRemaining('2026-11-17', refDate)).toBe(7);
    expect(calculateDaysRemaining('2026-11-15', refDate)).toBe(5);
    expect(calculateDaysRemaining('2026-11-13', refDate)).toBe(3);
    expect(calculateDaysRemaining('2026-11-10', refDate)).toBe(0);
    expect(calculateDaysRemaining('2026-11-08', refDate)).toBe(-2);
  });

  describe('Window Trigger Logic', () => {
    it('shows NOTHING at 8 days or more', () => {
      const window = determineAlertWindow(8);
      expect(window).toBeNull();

      const alerts = getFeeDeadlineAlerts({
        items: [{ ...baseItem, due_date: '2026-11-18' }],
        balance: 4000,
        referenceDate: refDate,
      });
      expect(alerts).toHaveLength(0);
    });

    it('shows in the 7-day window at 7 days and 5 days', () => {
      expect(determineAlertWindow(7)).toBe('7_day');
      expect(determineAlertWindow(5)).toBe('7_day');
      expect(determineAlertWindow(4)).toBe('7_day');

      const alert = getPrimaryFeeDeadlineAlert({
        items: [baseItem], // due 2026-11-15, 5 days from refDate (10 Nov)
        balance: 24500,
        referenceDate: refDate,
      });

      expect(alert).not.toBeNull();
      expect(alert?.daysRemaining).toBe(5);
      expect(alert?.window).toBe('7_day');
      expect(alert?.windowKey).toBe('fee-exam-01:7_day');
      expect(alert?.headline).toBe('Fee deadline in 5 days');
      // Exact copy check
      expect(alert?.message).toBe('Fee deadline in 5 days: Examination Services, KES 4,000 due 15 Nov.');
    });

    it('shows in the 3-day window at 3 days', () => {
      expect(determineAlertWindow(3)).toBe('3_day');
      expect(determineAlertWindow(1)).toBe('3_day');

      const alert = getPrimaryFeeDeadlineAlert({
        items: [{ ...baseItem, due_date: '2026-11-13' }], // 3 days from 10 Nov
        balance: 4000,
        referenceDate: refDate,
      });

      expect(alert).not.toBeNull();
      expect(alert?.daysRemaining).toBe(3);
      expect(alert?.window).toBe('3_day');
      expect(alert?.windowKey).toBe('fee-exam-01:3_day');
      expect(alert?.headline).toBe('Fee deadline in 3 days');
      expect(alert?.message).toBe('Fee deadline in 3 days: Examination Services, KES 4,000 due 13 Nov.');
    });

    it('shows on the day (0 days remaining)', () => {
      expect(determineAlertWindow(0)).toBe('today');

      const alert = getPrimaryFeeDeadlineAlert({
        items: [{ ...baseItem, due_date: '2026-11-10' }], // today
        balance: 4000,
        referenceDate: refDate,
      });

      expect(alert).not.toBeNull();
      expect(alert?.daysRemaining).toBe(0);
      expect(alert?.window).toBe('today');
      expect(alert?.windowKey).toBe('fee-exam-01:today');
      expect(alert?.headline).toBe('Fee deadline today');
      expect(alert?.message).toBe('Fee deadline today: Examination Services, KES 4,000 due 10 Nov.');
    });

    it('shows overdue state when deadline has passed in calm, deeper tone', () => {
      expect(determineAlertWindow(-2)).toBe('overdue');

      const alert = getPrimaryFeeDeadlineAlert({
        items: [{ ...baseItem, due_date: '2026-11-08' }], // 2 days overdue
        balance: 4000,
        referenceDate: refDate,
      });

      expect(alert).not.toBeNull();
      expect(alert?.daysRemaining).toBe(-2);
      expect(alert?.isOverdue).toBe(true);
      expect(alert?.window).toBe('overdue');
      expect(alert?.windowKey).toBe('fee-exam-01:overdue');
      expect(alert?.headline).toBe('Fee deadline passed');
      expect(alert?.message).toBe('Fee deadline passed: Examination Services, KES 4,000 due 8 Nov.');
    });
  });

  describe('Exclusions & Edge Cases', () => {
    it('NEVER alerts for settled items', () => {
      const settledItem: FeeItem = {
        ...baseItem,
        status: 'settled',
        due_date: '2026-11-15', // would be in 5 days, but it is settled
      };

      const alerts = getFeeDeadlineAlerts({
        items: [settledItem],
        balance: 10000,
        referenceDate: refDate,
      });

      expect(alerts).toHaveLength(0);
    });

    it('NEVER alerts when statement balance is zero', () => {
      const alerts = getFeeDeadlineAlerts({
        items: [baseItem], // billed item
        balance: 0, // balance is 0 (cleared account)
        referenceDate: refDate,
      });

      expect(alerts).toHaveLength(0);
    });

    it('alerts for partial items while balance remains', () => {
      const partialItem: FeeItem = {
        ...baseItem,
        status: 'partial',
        amount: 14000,
        due_date: '2026-11-15',
      };

      const alert = getPrimaryFeeDeadlineAlert({
        items: [partialItem],
        balance: 5000,
        referenceDate: refDate,
      });

      expect(alert).not.toBeNull();
      expect(alert?.window).toBe('7_day');
    });

    it('prioritizes the most urgent deadline when multiple items are due', () => {
      const itemFar: FeeItem = {
        id: 'item-far',
        category: 'library',
        title: 'Library Digital Fee',
        description: 'Lib',
        amount: 2500,
        status: 'billed',
        due_date: '2026-11-17', // 7 days
      };
      const itemSoon: FeeItem = {
        id: 'item-soon',
        category: 'examination',
        title: 'Examination Services',
        description: 'Exam',
        amount: 4000,
        status: 'billed',
        due_date: '2026-11-13', // 3 days
      };

      const primary = getPrimaryFeeDeadlineAlert({
        items: [itemFar, itemSoon],
        balance: 6500,
        referenceDate: refDate,
      });

      expect(primary?.itemId).toBe('item-soon');
      expect(primary?.daysRemaining).toBe(3);
    });
  });

  describe('SMS Alert Formatting (UAMS A3 Ready)', () => {
    it('formats a clean SMS alert under 160 characters without emojis', () => {
      const alert = getPrimaryFeeDeadlineAlert({
        items: [baseItem],
        balance: 4000,
        referenceDate: refDate,
      });

      expect(alert).not.toBeNull();
      const sms = formatFeeDeadlineSmsAlert(alert!, 'SMU');
      expect(sms).toContain('SMU Finance: Fee deadline in 5 days: Examination Services, KES 4,000 due 15 Nov.');
      expect(sms.length).toBeLessThanOrEqual(160);
      expect(sms).not.toMatch(/[—\u{1F300}-\u{1F9FF}]/u); // No em dash and no emojis
    });
  });
});
