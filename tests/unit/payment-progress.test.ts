import { describe, it, expect } from 'vitest';
import { calculatePaymentProgress } from '@/lib/finance/payment-progress';
import { DEMO_FEE_STATEMENTS } from '@/lib/finance/demo-data';

describe('Item 3: Payment Progress Bar Mathematics & Shared Calculator', () => {
  it('accurately calculates partial semester payment (demo student numbers)', () => {
    const stmt = DEMO_FEE_STATEMENTS[0];
    // Total Billed = 69,500, HELB = 25,000, Paid by Student = 20,000, Total Covered = 45,000
    const progress = calculatePaymentProgress({
      totalBilled: stmt.total_billed,
      totalPaid: stmt.total_paid,
      fundingApplied: stmt.funding_applied,
      paidByStudent: stmt.paid_by_student,
    });

    expect(progress.percentSettled).toBe(65);
    expect(progress.percentStudent).toBe(29);
    expect(progress.percentFunding).toBe(36);
    expect(progress.percentRemaining).toBe(35);
    expect(progress.balanceRemaining).toBe(24500);
    expect(progress.totalSettled).toBe(45000);
    expect(progress.isCleared).toBe(false);
  });

  it('accurately calculates fully settled semester (100% and Cleared for exams)', () => {
    const stmt = DEMO_FEE_STATEMENTS[1];
    // Total Billed = 52,500, HELB = 25,000, Paid by Student = 27,500, Total Paid = 52,500
    const progress = calculatePaymentProgress({
      totalBilled: stmt.total_billed,
      totalPaid: stmt.total_paid,
      fundingApplied: stmt.funding_applied,
      paidByStudent: stmt.paid_by_student,
    });

    expect(progress.percentSettled).toBe(100);
    expect(progress.percentRemaining).toBe(0);
    expect(progress.balanceRemaining).toBe(0);
    expect(progress.isCleared).toBe(true);
  });

  it('handles zero-billed cases safely without dividing by zero', () => {
    const progress = calculatePaymentProgress({
      totalBilled: 0,
      totalPaid: 0,
    });

    expect(progress.percentSettled).toBe(0);
    expect(progress.percentStudent).toBe(0);
    expect(progress.percentFunding).toBe(0);
    expect(progress.percentRemaining).toBe(0);
    expect(progress.balanceRemaining).toBe(0);
    expect(progress.isCleared).toBe(false);
  });

  it('caps at 100% when there is an overpayment / excess bursary credit', () => {
    const progress = calculatePaymentProgress({
      totalBilled: 69500,
      totalPaid: 85000,
      fundingApplied: 30000,
      paidByStudent: 55000,
    });

    expect(progress.percentSettled).toBe(100);
    expect(progress.totalSettled).toBe(69500);
    expect(progress.percentRemaining).toBe(0);
    expect(progress.balanceRemaining).toBe(0);
    expect(progress.isCleared).toBe(true);
  });

  it('handles 0% initial billing before payments or funding land', () => {
    const progress = calculatePaymentProgress({
      totalBilled: 69500,
      totalPaid: 0,
      fundingApplied: 0,
      paidByStudent: 0,
    });

    expect(progress.percentSettled).toBe(0);
    expect(progress.percentStudent).toBe(0);
    expect(progress.percentFunding).toBe(0);
    expect(progress.percentRemaining).toBe(100);
    expect(progress.balanceRemaining).toBe(69500);
    expect(progress.isCleared).toBe(false);
  });
});
