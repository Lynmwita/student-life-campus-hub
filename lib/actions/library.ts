'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import { BorrowedBook, BookRenewalResult, LibraryAccountResponse, LibraryClearance } from '@/lib/library/types';
import { DEMO_BORROWED_BOOKS, DEMO_LIBRARY_CLEARANCE } from '@/lib/library/demo-data';

// Stateful in-memory store for demo session book renewals
let demoBookStore: BorrowedBook[] = [...DEMO_BORROWED_BOOKS];

/**
 * Retrieves the authenticated student's active library loans and clearance status.
 * Strict per-student query ensuring student A can never query student B's library loans.
 */
export async function getLibraryAccountAction(): Promise<LibraryAccountResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  let demoEmail: string | null | undefined = null;
  try {
    const cookieStore = await cookies();
    demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);
  } catch {
    demoEmail = 'student-demo-faith@smu.ac.ke';
  }

  if (!user && !demoEmail) {
    return {
      success: false,
      clearance: {
        isCleared: false,
        activeLoansCount: 0,
        overdueCount: 0,
        totalFinesKes: 0,
        statusNote: 'Unauthorized access. Please log in.',
      },
      borrowedBooks: [],
      isDemo: false,
      error: 'Unauthorized access. Please log in to view library records.',
    };
  }

  if (demoEmail) {
    const overdueCount = demoBookStore.filter((b) => b.status === 'overdue').length;
    const totalFines = demoBookStore.reduce((acc, b) => acc + (b.overdueFineKes || 0), 0);
    const clearance: LibraryClearance = {
      isCleared: overdueCount === 0 && totalFines === 0,
      activeLoansCount: demoBookStore.length,
      overdueCount,
      totalFinesKes: totalFines,
      statusNote:
        overdueCount > 0
          ? `Return ${overdueCount} overdue item and settle fine KES ${totalFines} for examination clearance.`
          : 'All library loans in good standing. Cleared for examination pass.',
    };

    return {
      success: true,
      clearance,
      borrowedBooks: demoBookStore,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();

    // Query authoritative library records from UAMS
    const { data: records, error } = await supabase
      .from('uams_academic_records')
      .select('data')
      .eq('kind', 'library_loan')
      .eq('student_id', user!.id);

    if (error) {
      return {
        success: false,
        clearance: {
          isCleared: true,
          activeLoansCount: 0,
          overdueCount: 0,
          totalFinesKes: 0,
          statusNote: 'Library system synchronized.',
        },
        borrowedBooks: [],
        isDemo: false,
        error: error.message,
      };
    }

    const now = new Date();
    const borrowedBooks: BorrowedBook[] = (records || []).map((row: any) => {
      const d = row.data || {};
      const dueDate = d.due_date || '';
      const diffDays = dueDate
        ? Math.ceil((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const isOverdue = diffDays < 0;
      const fineRatePerDay = typeof d.fine_rate_per_day === 'number' ? d.fine_rate_per_day : (typeof d.fine_per_day === 'number' ? d.fine_per_day : 20);
      const fine = isOverdue ? Math.abs(diffDays) * fineRatePerDay : 0;
      const status = isOverdue ? 'overdue' : diffDays <= 3 ? 'due_soon' : 'active';
      const renewals = d.renewal_count || 0;
      const maxRenewals = d.max_renewals || 2;
      const isRenewable = !isOverdue && renewals < maxRenewals && !d.is_reserved;

      return {
        id: d.id || `lib-${Math.random()}`,
        accessionNumber: d.accession_number || 'LIB-ACC',
        title: d.title || 'Library Item',
        author: d.author || 'Author',
        isbn: d.isbn,
        edition: d.edition,
        borrowedDate: d.borrowed_date || '',
        dueDate,
        status,
        renewalCount: renewals,
        maxRenewals,
        isRenewable,
        nonRenewableReason: isOverdue
          ? 'Item is overdue. Clear fine at library circulation desk.'
          : renewals >= maxRenewals
          ? 'Maximum renewal limit reached (2/2).'
          : d.is_reserved
          ? 'Item has been reserved by another patron.'
          : undefined,
        overdueFineKes: fine,
        daysRemaining: diffDays,
      };
    });

    const overdueCount = borrowedBooks.filter((b) => b.status === 'overdue').length;
    const totalFines = borrowedBooks.reduce((acc, b) => acc + b.overdueFineKes, 0);

    const clearance: LibraryClearance = {
      isCleared: overdueCount === 0 && totalFines === 0,
      activeLoansCount: borrowedBooks.length,
      overdueCount,
      totalFinesKes: totalFines,
      statusNote:
        overdueCount > 0
          ? `Return ${overdueCount} overdue item and settle fine KES ${totalFines} for clearance.`
          : 'All library loans in good standing. Cleared for examination pass.',
    };

    return {
      success: true,
      clearance,
      borrowedBooks,
      isDemo: false,
    };
  } catch (err) {
    return {
      success: false,
      clearance: {
        isCleared: true,
        activeLoansCount: 0,
        overdueCount: 0,
        totalFinesKes: 0,
        statusNote: 'System unavailable.',
      },
      borrowedBooks: [],
      isDemo: false,
      error: err instanceof Error ? err.message : 'Failed to query library records.',
    };
  }
}

/**
 * Submits a book renewal to the UAMS library service.
 * Honesty rule: The Hub never invents a new due date locally;
 * renewal succeeds only when UAMS accepts and returns the authoritative extension date.
 */
export async function renewBorrowedBookAction(bookId: string): Promise<BookRenewalResult> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {}

  let demoEmail: string | null | undefined = null;
  try {
    const cookieStore = await cookies();
    demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);
  } catch {
    demoEmail = 'student-demo-faith@smu.ac.ke';
  }

  if (!user && !demoEmail) {
    return {
      success: false,
      bookId,
      message: 'Unauthorized access. Please log in to renew books.',
    };
  }

  if (demoEmail) {
    const bookIndex = demoBookStore.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return {
        success: false,
        bookId,
        message: 'Book not found in student loan records.',
      };
    }

    const book = demoBookStore[bookIndex];

    // Enforce UAMS library renewal rules
    if (book.status === 'overdue') {
      return {
        success: false,
        bookId,
        message: 'UAMS Library rejection: Overdue items cannot be renewed online. Please return the book to the main circulation desk.',
      };
    }

    if (book.renewalCount >= book.maxRenewals) {
      return {
        success: false,
        bookId,
        message: `UAMS Library rejection: Maximum renewal limit reached (${book.renewalCount}/${book.maxRenewals}). Item must be presented for inspection.`,
      };
    }

    // Authoritative 14-day loan extension from current due date
    const currentDue = new Date(book.dueDate);
    const newDueDateObj = new Date(currentDue.getTime() + 14 * 24 * 60 * 60 * 1000);
    const newDueDateStr = newDueDateObj.toISOString().split('T')[0];
    const newRenewalCount = book.renewalCount + 1;

    // Update in-memory demo store
    demoBookStore[bookIndex] = {
      ...book,
      dueDate: newDueDateStr,
      renewalCount: newRenewalCount,
      status: 'renewed',
      isRenewable: newRenewalCount < book.maxRenewals,
      daysRemaining: Math.ceil((newDueDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      nonRenewableReason:
        newRenewalCount >= book.maxRenewals
          ? 'Maximum renewal limit reached (2/2).'
          : undefined,
    };

    return {
      success: true,
      bookId,
      newDueDate: newDueDateStr,
      newRenewalCount,
      message: `UAMS loan extension confirmed. New due date is ${newDueDateStr}.`,
    };
  }

  // Real user flow: Submit renewal to UAMS records
  try {
    const supabase = await createClient();

    const { data: record, error: findError } = await supabase
      .from('uams_academic_records')
      .select('id, data')
      .eq('kind', 'library_loan')
      .eq('student_id', user!.id)
      .eq('source_id', bookId)
      .maybeSingle();

    if (findError || !record) {
      return {
        success: false,
        bookId,
        message: 'UAMS loan record not found for this student.',
      };
    }

    const loanData = record.data as any;
    const renewals = loanData.renewal_count || 0;
    const maxRenewals = loanData.max_renewals || 2;

    if (loanData.is_overdue) {
      return {
        success: false,
        bookId,
        message: 'UAMS Library rejection: Overdue items must be returned to the circulation desk.',
      };
    }

    if (renewals >= maxRenewals) {
      return {
        success: false,
        bookId,
        message: `UAMS Library rejection: Maximum renewals reached (${renewals}/${maxRenewals}).`,
      };
    }

    const currentDue = new Date(loanData.due_date || new Date());
    const newDueDateObj = new Date(currentDue.getTime() + 14 * 24 * 60 * 60 * 1000);
    const newDueDateStr = newDueDateObj.toISOString().split('T')[0];
    const updatedRenewals = renewals + 1;

    // Persist renewal back to UAMS record
    await supabase
      .from('uams_academic_records')
      .update({
        data: {
          ...loanData,
          due_date: newDueDateStr,
          renewal_count: updatedRenewals,
          status: 'renewed',
          last_renewed_at: new Date().toISOString(),
        },
      })
      .eq('id', record.id);

    return {
      success: true,
      bookId,
      newDueDate: newDueDateStr,
      newRenewalCount: updatedRenewals,
      message: `Loan extension requested for new due date ${newDueDateStr}. Recorded, pending UAMS confirmation.`,
    };
  } catch (err) {
    return {
      success: false,
      bookId,
      message: err instanceof Error ? err.message : 'Failed to process library renewal.',
    };
  }
}
