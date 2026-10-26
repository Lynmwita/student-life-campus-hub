'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Info,
  Barcode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BorrowedBook, LibraryClearance } from '@/lib/library/types';
import { renewBorrowedBookAction } from '@/lib/actions/library';

interface LibraryClientProps {
  initialClearance: LibraryClearance;
  initialBooks: BorrowedBook[];
  isDemo: boolean;
}

export function LibraryClient({ initialClearance, initialBooks, isDemo }: LibraryClientProps) {
  const [clearance, setClearance] = React.useState<LibraryClearance>(initialClearance);
  const [books, setBooks] = React.useState<BorrowedBook[]>(initialBooks);
  const [renewingId, setRenewingId] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleRenew = async (bookId: string) => {
    setRenewingId(bookId);
    setActionMessage(null);

    try {
      const res = await renewBorrowedBookAction(bookId);
      if (res.success && res.newDueDate) {
        setBooks((prev) =>
          prev.map((b) =>
            b.id === bookId
              ? {
                  ...b,
                  dueDate: res.newDueDate!,
                  renewalCount: res.newRenewalCount ?? b.renewalCount + 1,
                  status: 'renewed',
                  isRenewable: (res.newRenewalCount ?? b.renewalCount + 1) < b.maxRenewals,
                  nonRenewableReason:
                    (res.newRenewalCount ?? b.renewalCount + 1) >= b.maxRenewals
                      ? 'Maximum renewal limit reached (2/2).'
                      : undefined,
                  daysRemaining: Math.ceil(
                    (new Date(res.newDueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  ),
                }
              : b
          )
        );
        setActionMessage({
          type: 'success',
          text: res.message,
        });
      } else {
        setActionMessage({
          type: 'error',
          text: res.message || 'Renewal was declined by the UAMS library service.',
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to communicate with library circulation service.',
      });
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Badge */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C59B27]" />
            <span>
              <strong>Demo Session:</strong> Displaying simulated library circulation records for Faith Wanjiku (BIT/2023/8849).
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            UAMS SYNC MOCK
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C59B27]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0B1D33] font-semibold">Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#C59B27]" />
            University Library & Learning Commons
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Authoritative circulation loans, due-date countdowns, renewal requests, and institutional clearance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="info">{books.length} Active Loans</Badge>
          <Badge variant="default">Main Library</Badge>
        </div>
      </div>

      {/* Library Clearance Status Card */}
      <Card
        className={`p-5 sm:p-6 border ${
          clearance.isCleared
            ? 'bg-emerald-50/70 border-emerald-300'
            : 'bg-amber-50/80 border-amber-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                clearance.isCleared
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0B1D33] text-[#FCD34D]'
              }`}
            >
              {clearance.isCleared ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#0B1D33]">
                  {clearance.isCleared
                    ? 'Library Clearance: In Good Standing'
                    : 'Library Clearance: Attention Required'}
                </h3>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    clearance.isCleared
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {clearance.isCleared ? 'Cleared' : 'Hold Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                {clearance.statusNote}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
            <div className="text-center px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200">
              <span className="block text-xs text-slate-500 font-medium">Overdue</span>
              <span
                className={`text-base font-bold ${
                  clearance.overdueCount > 0 ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                {clearance.overdueCount}
              </span>
            </div>
            <div className="text-center px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200">
              <span className="block text-xs text-slate-500 font-medium">Fines Accrued</span>
              <span
                className={`text-base font-bold ${
                  clearance.totalFinesKes > 0 ? 'text-rose-600 font-mono' : 'text-slate-700'
                }`}
              >
                KES {clearance.totalFinesKes.toLocaleString('en-KE')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-[11px] font-semibold underline shrink-0 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif font-bold text-lg text-[#0B1D33] flex items-center gap-2">
          <span>Active Borrowed Items</span>
          <span className="text-xs font-sans font-normal text-slate-500">
            ({books.length} items on loan)
          </span>
        </h2>
        <span className="text-xs text-slate-500">Standard Loan Duration: 14 Days</span>
      </div>

      {/* Books List */}
      {books.length === 0 ? (
        <Card className="p-8 text-center bg-white border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-base text-[#0B1D33]">No Active Book Loans</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            You currently have no borrowed items registered under your library account. Visit the circulation desk or online catalogue to borrow course materials.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {books.map((book) => {
            const isOverdue = book.status === 'overdue';
            const isDueSoon = book.status === 'due_soon';
            const isRenewed = book.status === 'renewed';

            return (
              <Card
                key={book.id}
                className={`p-5 bg-white border transition shadow-xs ${
                  isOverdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : isDueSoon
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Book Metadata */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl shrink-0 ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isDueSoon
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-[#0B1D33] text-[#FCD34D]'
                      }`}
                    >
                      <BookOpen className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          {book.accessionNumber}
                        </span>
                        {book.edition && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {book.edition}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                            Overdue
                          </span>
                        )}
                        {isDueSoon && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
                            Due Soon
                          </span>
                        )}
                        {isRenewed && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                            Renewed
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif font-bold text-base text-[#0B1D33] pt-0.5">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        By {book.author}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Borrowed: {book.borrowedDate}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span>
                            <strong>Due: {book.dueDate}</strong>
                          </span>
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-700">
                          Renewals: {book.renewalCount} / {book.maxRenewals}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action / Due Countdown Area */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      {isOverdue ? (
                        <div className="space-y-0.5">
                          <span className="block text-xs font-bold text-rose-600">
                            {Math.abs(book.daysRemaining)} days overdue
                          </span>
                          <span className="block font-mono text-xs font-bold text-rose-700">
                            Fine: KES {book.overdueFineKes}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span
                            className={`block text-xs font-bold ${
                              isDueSoon ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {book.daysRemaining === 0
                              ? 'Due Today'
                              : `${book.daysRemaining} days remaining`}
                          </span>
                          <span className="block text-[11px] text-slate-500 font-mono">
                            Return by 17:00
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Button
                        variant={book.isRenewable ? 'primary' : 'outline'}
                        size="sm"
                        disabled={!book.isRenewable || renewingId === book.id}
                        onClick={() => handleRenew(book.id)}
                        className={`text-xs h-8 px-3 font-semibold ${
                          book.isRenewable
                            ? 'bg-[#0B1D33] hover:bg-[#06101E] text-white border border-[#C59B27]/40'
                            : 'opacity-60 cursor-not-allowed text-slate-500'
                        }`}
                      >
                        <RotateCw
                          className={`w-3.5 h-3.5 mr-1.5 ${
                            renewingId === book.id ? 'animate-spin text-[#FCD34D]' : ''
                          }`}
                        />
                        <span>{renewingId === book.id ? 'Renewing...' : 'Renew Book'}</span>
                      </Button>

                      {book.nonRenewableReason && (
                        <span className="text-[10px] text-slate-500 text-right max-w-[200px] leading-tight">
                          {book.nonRenewableReason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Library Info and Opening Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <Card className="p-4 bg-slate-50 border-slate-200">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#0B1D33] mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
            Circulation & Service Hours
          </h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li className="flex justify-between">
              <span>Monday - Friday:</span>
              <strong className="text-slate-800">08:00 - 21:00</strong>
            </li>
            <li className="flex justify-between">
              <span>Saturday:</span>
              <strong className="text-slate-800">09:00 - 17:00</strong>
            </li>
            <li className="flex justify-between">
              <span>Sundays & Public Holidays:</span>
              <span className="text-slate-500">Closed (Digital access open)</span>
            </li>
          </ul>
        </Card>

        <Card className="p-4 bg-slate-50 border-slate-200">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#0B1D33] mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#C59B27]" />
            Circulation Policy Summary
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Undergraduate students may borrow up to 4 items for a 14-day loan period. Items can be renewed up to 2 times provided they have not been placed on hold by another patron. Overdue fines accrue at KES 20 per day per overdue volume.
          </p>
        </Card>
      </div>
    </div>
  );
}
