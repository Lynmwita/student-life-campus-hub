import { describe, it, expect } from 'vitest';
import { DEMO_FEE_STATEMENTS } from '@/lib/finance/demo-data';

describe('Item 3: Payment Progress Bar Mathematics & Thresholds', () => {
  it('accurately calculates semester clearance percentages and segments', () => {
    const stmt = DEMO_FEE_STATEMENTS[0];
    const totalBilled = stmt.total_billed; // 69,500
    const fundingApplied = stmt.funding_applied; // 25,000
    const paidByStudent = stmt.paid_by_student; // 20,000
    const totalSettled = fundingApplied + paidByStudent; // 45,000

    const percentSettled = Math.min(100, Math.round((totalSettled / totalBilled) * 100));
    const percentStudent = Math.min(100, Math.round((paidByStudent / totalBilled) * 100));
    const percentFunding = Math.min(100 - percentStudent, Math.round((fundingApplied / totalBilled) * 100));
    const percentRemaining = Math.max(0, 100 - (percentStudent + percentFunding));

    expect(percentSettled).toBe(65);
    expect(percentStudent).toBe(29);
    expect(percentFunding).toBe(36);
    expect(percentRemaining).toBe(35);
    expect(percentStudent + percentFunding + percentRemaining).toBe(100);
  });

  it('handles fully settled semesters at exactly 100%', () => {
    const totalBilled = 52500;
    const totalSettled = 52500;
    const percentSettled = Math.min(100, Math.round((totalSettled / totalBilled) * 100));
    expect(percentSettled).toBe(100);
  });

  it('prevents progress overflow when account has excess credit balance', () => {
    const totalBilled = 69500;
    const totalSettled = 80000; // Overpayment / bursary excess
    const percentSettled = Math.min(100, Math.round((totalSettled / totalBilled) * 100));
    expect(percentSettled).toBe(100);
  });

  it('handles 0% initial billing before payments or funding', () => {
    const totalBilled = 69500;
    const totalSettled = 0;
    const percentSettled = Math.min(100, Math.round((totalSettled / totalBilled) * 100));
    expect(percentSettled).toBe(0);
  });
});
