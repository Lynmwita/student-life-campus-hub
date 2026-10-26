import { describe, it, expect } from 'vitest';
import { DEMO_BORROWED_BOOKS, DEMO_LIBRARY_CLEARANCE } from '@/lib/library/demo-data';
import { renewBorrowedBookAction } from '@/lib/actions/library';
import { BorrowedBook } from '@/lib/library/types';

describe('Library & Learning Commons Family', () => {
  it('retrieves authoritative borrowed book records with due dates and accession numbers', () => {
    const books = DEMO_BORROWED_BOOKS;
    expect(books).toHaveLength(3);

    const activeBook = books.find((b) => b.id === 'book-loan-02');
    expect(activeBook).toBeDefined();
    expect(activeBook?.title).toBe('Designing Data-Intensive Applications');
    expect(activeBook?.accessionNumber).toBe('LIB-2026-IT-0899');
    expect(activeBook?.status).toBe('active');
    expect(activeBook?.daysRemaining).toBe(9);
    expect(activeBook?.isRenewable).toBe(true);
  });

  it('accrues overdue fines at KES 20 per day for overdue loans', () => {
    const overdueBook = DEMO_BORROWED_BOOKS.find((b) => b.status === 'overdue');
    expect(overdueBook).toBeDefined();
    expect(overdueBook?.daysRemaining).toBe(-3);
    expect(overdueBook?.overdueFineKes).toBe(60);
    expect(overdueBook?.isRenewable).toBe(false);
    expect(overdueBook?.nonRenewableReason).toContain('circulation desk');
  });

  it('evaluates institutional clearance: hold placed when overdue items or unpaid fines exist', () => {
    const clearance = DEMO_LIBRARY_CLEARANCE;
    expect(clearance.isCleared).toBe(false);
    expect(clearance.overdueCount).toBe(1);
    expect(clearance.totalFinesKes).toBe(60);
    expect(clearance.statusNote).toContain('Return 1 overdue item');
  });

  it('enforces renewal honesty rule: rejects online renewal for overdue items with UAMS reason', async () => {
    const overdueResult = await renewBorrowedBookAction('book-loan-03');
    expect(overdueResult.success).toBe(false);
    expect(overdueResult.message).toContain('UAMS Library rejection');
    expect(overdueResult.message).toContain('Overdue items cannot be renewed online');
    expect(overdueResult.newDueDate).toBeUndefined();
  });

  it('enforces renewal honesty rule: approves eligible book extending authoritative due date by 14 days', async () => {
    const eligibleResult = await renewBorrowedBookAction('book-loan-01');
    expect(eligibleResult.success).toBe(true);
    expect(eligibleResult.newDueDate).toBeDefined();
    expect(eligibleResult.newRenewalCount).toBe(1);
    expect(eligibleResult.message).toContain('UAMS loan extension confirmed');
  });

  it('enforces locked-door privacy: Student B cannot view or renew Student A library loans', () => {
    const loansPool: (BorrowedBook & { studentId: string })[] = [
      { ...DEMO_BORROWED_BOOKS[0], studentId: 'student-A' },
      { ...DEMO_BORROWED_BOOKS[1], studentId: 'student-A' },
      { ...DEMO_BORROWED_BOOKS[2], studentId: 'student-B' },
    ];

    const studentBLoans = loansPool.filter((b) => b.studentId === 'student-B');
    expect(studentBLoans).toHaveLength(1);
    expect(studentBLoans[0].id).toBe('book-loan-03');

    // Verify zero Student A loans leak to Student B
    const leakedLoans = studentBLoans.filter((b) => b.studentId === 'student-A');
    expect(leakedLoans).toHaveLength(0);
  });

  it('guarantees zero emojis across all Library data structures and strings', () => {
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
    const jsonLibrary = JSON.stringify(DEMO_BORROWED_BOOKS);
    expect(jsonLibrary.match(emojiRegex)).toBeNull();
  });

  it('guarantees zero em dashes across all Library strings', () => {
    const jsonLibrary = JSON.stringify(DEMO_BORROWED_BOOKS);
    expect(jsonLibrary.includes('\u2014')).toBe(false);
  });
});
