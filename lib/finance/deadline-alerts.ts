import { FeeItem, FeeStatementData } from './types';

export type DeadlineAlertWindow = '7_day' | '3_day' | 'today' | 'overdue';

export interface FeeDeadlineAlert {
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  dueDate: string; // 'YYYY-MM-DD'
  formattedDueDate: string; // e.g. '15 Nov'
  daysRemaining: number;
  window: DeadlineAlertWindow;
  windowKey: string; // unique identifier for per-window dismissal, e.g. 'item-01:7_day'
  isOverdue: boolean;
  headline: string;
  message: string;
  smsMessage: string;
}

/**
 * Format a 'YYYY-MM-DD' date into a concise day + short month (e.g., '15 Nov', '28 Oct').
 */
export function formatShortDueDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(Date.UTC(year, month, day));
    const dayNum = d.getUTCDate();
    const monthName = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    return `${dayNum} ${monthName}`;
  }
  return dateStr;
}

/**
 * Calculate difference in calendar days between referenceDate and target dueDate ('YYYY-MM-DD').
 */
export function calculateDaysRemaining(dueDateStr: string, referenceDate: Date = new Date()): number {
  const dueParts = dueDateStr.split('-');
  const dueYear = parseInt(dueParts[0], 10);
  const dueMonth = parseInt(dueParts[1], 10) - 1;
  const dueDay = parseInt(dueParts[2], 10);
  const dueUtc = Date.UTC(dueYear, dueMonth, dueDay);

  const refUtc = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dueUtc - refUtc) / msPerDay);
}

/**
 * Determine the alert window for a given number of days remaining.
 * Windows:
 * - 7 days to 4 days: '7_day'
 * - 3 days to 1 day: '3_day'
 * - 0 days: 'today'
 * - < 0 days: 'overdue'
 * Returns null if daysRemaining > 7 (nothing shows at 8 days or more).
 */
export function determineAlertWindow(daysRemaining: number): DeadlineAlertWindow | null {
  if (daysRemaining > 7) {
    return null;
  }
  if (daysRemaining >= 4) {
    return '7_day';
  }
  if (daysRemaining >= 1) {
    return '3_day';
  }
  if (daysRemaining === 0) {
    return 'today';
  }
  return 'overdue';
}

/**
 * Format SMS message for the upcoming fee deadline (UAMS A3 engine ready).
 */
export function formatFeeDeadlineSmsAlert(
  alert: Omit<FeeDeadlineAlert, 'smsMessage'>,
  universityName = 'SMU'
): string {
  return `${universityName} Finance: ${alert.message} Pay via official university bank channels.`;
}

export interface GetFeeDeadlineAlertsParams {
  statement?: FeeStatementData | null;
  items?: FeeItem[];
  balance?: number;
  currency?: string;
  referenceDate?: Date;
}

/**
 * Scans fee items and statement balance for upcoming deadlines.
 * Rules:
 * - Only alerts if statement balance > 0
 * - Only alerts on items with status !== 'settled'
 * - Only alerts within active windows (<= 7 days, <= 3 days, today, overdue)
 * - Returns alerts sorted with the most urgent (lowest daysRemaining) first.
 */
export function getFeeDeadlineAlerts({
  statement,
  items: directItems,
  balance: directBalance,
  currency: directCurrency,
  referenceDate = new Date(),
}: GetFeeDeadlineAlertsParams): FeeDeadlineAlert[] {
  const effectiveBalance = directBalance !== undefined
    ? directBalance
    : (statement?.balance ?? 0);

  // Rule: Zero balance never alerts
  if (effectiveBalance <= 0) {
    return [];
  }

  const items = directItems || statement?.items || [];
  const currency = directCurrency || statement?.currency || 'KES';

  const alerts: FeeDeadlineAlert[] = [];

  for (const item of items) {
    // Rule: Settled items never alert
    if (item.status === 'settled') {
      continue;
    }

    if (!item.due_date) {
      continue;
    }

    const daysRemaining = calculateDaysRemaining(item.due_date, referenceDate);
    const window = determineAlertWindow(daysRemaining);

    // Rule: Nothing shows outside active windows (> 7 days)
    if (!window) {
      continue;
    }

    const isOverdue = daysRemaining < 0;
    const formattedDueDate = formatShortDueDate(item.due_date);
    const formattedAmount = `${currency} ${item.amount.toLocaleString('en-KE')}`;

    let headline: string;
    if (isOverdue) {
      headline = 'Fee deadline passed';
    } else if (daysRemaining === 0) {
      headline = 'Fee deadline today';
    } else if (daysRemaining === 1) {
      headline = 'Fee deadline tomorrow';
    } else {
      headline = `Fee deadline in ${daysRemaining} days`;
    }

    const message = `${headline}: ${item.title}, ${formattedAmount} due ${formattedDueDate}.`;
    const windowKey = `${item.id}:${window}`;

    const alertBase = {
      itemId: item.id,
      itemTitle: item.title,
      amount: item.amount,
      currency,
      dueDate: item.due_date,
      formattedDueDate,
      daysRemaining,
      window,
      windowKey,
      isOverdue,
      headline,
      message,
    };

    alerts.push({
      ...alertBase,
      smsMessage: formatFeeDeadlineSmsAlert(alertBase),
    });
  }

  // Sort by urgency: earliest due date / lowest days remaining first
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Returns the single most urgent fee deadline alert, or null if none active.
 */
export function getPrimaryFeeDeadlineAlert(params: GetFeeDeadlineAlertsParams): FeeDeadlineAlert | null {
  const alerts = getFeeDeadlineAlerts(params);
  return alerts.length > 0 ? alerts[0] : null;
}
