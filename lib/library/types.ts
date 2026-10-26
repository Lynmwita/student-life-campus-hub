export type LoanStatus = 'active' | 'due_soon' | 'overdue' | 'renewed' | 'returned';

export interface BorrowedBook {
  id: string;
  accessionNumber: string;
  title: string;
  author: string;
  isbn?: string;
  edition?: string;
  borrowedDate: string; // ISO date 'YYYY-MM-DD'
  dueDate: string; // ISO date 'YYYY-MM-DD'
  status: LoanStatus;
  renewalCount: number;
  maxRenewals: number;
  isRenewable: boolean;
  nonRenewableReason?: string;
  overdueFineKes: number;
  daysRemaining: number;
}

export interface LibraryClearance {
  isCleared: boolean;
  activeLoansCount: number;
  overdueCount: number;
  totalFinesKes: number;
  statusNote: string;
}

export interface BookRenewalResult {
  success: boolean;
  bookId: string;
  newDueDate?: string;
  newRenewalCount?: number;
  message: string;
}

export interface LibraryAccountResponse {
  success: boolean;
  clearance: LibraryClearance;
  borrowedBooks: BorrowedBook[];
  isDemo: boolean;
  error?: string;
}
