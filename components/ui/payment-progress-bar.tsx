import * as React from 'react';
import { calculatePaymentProgress } from '@/lib/finance/payment-progress';

export interface PaymentProgressBarProps {
  totalBilled: number;
  totalPaid: number;
  fundingApplied?: number;
  paidByStudent?: number;
  currency?: string;
  compact?: boolean;
}

export function PaymentProgressBar({
  totalBilled,
  totalPaid,
  fundingApplied = 0,
  paidByStudent,
  currency = 'KES',
  compact = false,
}: PaymentProgressBarProps) {
  // Edge case: if Total Billed is 0 or negative, hide the bar (no dividing by zero)
  if (totalBilled <= 0) {
    return null;
  }

  const {
    totalSettled,
    effectivePaidByStudent,
    percentSettled,
    percentStudent,
    percentFunding,
    percentRemaining,
    balanceRemaining,
    isCleared,
  } = calculatePaymentProgress({
    totalBilled,
    totalPaid,
    fundingApplied,
    paidByStudent,
  });

  function formatMoney(amount: number): string {
    return `${currency} ${amount.toLocaleString('en-KE')}`;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">
            {isCleared ? 'Cleared for exams' : 'Fees covered'}
          </span>
          <span className="font-mono font-bold text-[#0B1D33]">
            {percentSettled}%
          </span>
        </div>

        {/* Accessible Progress Bar: Navy Track with Solid Gold & Soft Gold Fills */}
        <div
          role="progressbar"
          aria-valuenow={percentSettled}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Fee payment progress"
          aria-valuetext={isCleared ? 'Cleared for exams' : `${percentSettled}% fees covered`}
          className="w-full bg-[#0B1D33] rounded-full h-2.5 overflow-hidden flex"
        >
          <div
            style={{ width: `${percentStudent}%` }}
            className="bg-[#C59B27] h-full transition-all duration-500"
            title={`Paid by you: ${percentStudent}%`}
          />
          <div
            style={{ width: `${percentFunding}%` }}
            className="bg-[#FCD34D] h-full transition-all duration-500"
            title={`HELB / funding: ${percentFunding}%`}
          />
        </div>

        {/* Two clean parts without em dash */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span>{formatMoney(totalSettled)} of {formatMoney(totalBilled)} covered</span>
          <span>{isCleared ? 'Cleared for exams' : `${formatMoney(balanceRemaining)} remaining`}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Top Header & Percentage */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#0B1D33]">
            {isCleared ? 'Cleared for exams' : 'Fees covered'}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {formatMoney(totalSettled)} of {formatMoney(totalBilled)} covered
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCleared ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]">
              Cleared for exams
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-[#0B1D33] border border-slate-200">
              {percentSettled}%
            </span>
          )}
        </div>
      </div>

      {/* Accessible Progress Bar: Navy Track (#0B1D33) + Solid Gold (#C59B27) + Soft Gold (#FCD34D) */}
      <div className="space-y-1.5 pt-1">
        <div
          role="progressbar"
          aria-valuenow={percentSettled}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Fee payment progress"
          aria-valuetext={isCleared ? 'Cleared for exams' : `${percentSettled}% fees covered`}
          className="relative w-full bg-[#0B1D33] rounded-full h-4 overflow-hidden flex border border-[#0B1D33]"
        >
          {/* Segment 1: Paid by You (Solid Gold #C59B27) */}
          <div
            style={{ width: `${percentStudent}%` }}
            className="bg-[#C59B27] h-full transition-all duration-500"
            title={`Paid by you: ${percentStudent}% (${formatMoney(effectivePaidByStudent)})`}
          />
          {/* Segment 2: HELB / Funding (Soft Gold #FCD34D) */}
          <div
            style={{ width: `${percentFunding}%` }}
            className="bg-[#FCD34D] h-full transition-all duration-500"
            title={`HELB / funding: ${percentFunding}% (${formatMoney(fundingApplied)})`}
          />
        </div>

        {/* Milestone Indicator Ticks */}
        <div className="relative w-full flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
          <span>0%</span>
          <span className="text-center">50% Midterm Guideline</span>
          <span className="text-right">100% Exam Pass</span>
        </div>
      </div>

      {/* Clean Details: Amounts Covered & Remaining (Two clean parts, no em dash) */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C59B27] shrink-0" />
            <span className="text-slate-700">
              Paid by you: <strong className="text-slate-900 font-mono">{formatMoney(effectivePaidByStudent)}</strong> ({percentStudent}%)
            </span>
          </div>

          {fundingApplied > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D] border border-amber-300 shrink-0" />
              <span className="text-slate-700">
                HELB / funding: <strong className="text-slate-900 font-mono">{formatMoney(fundingApplied)}</strong> ({percentFunding}%)
              </span>
            </div>
          )}

          {percentRemaining > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
              <span className="text-slate-700">
                Remaining: <strong className="text-slate-900 font-mono">{formatMoney(balanceRemaining)}</strong> ({percentRemaining}%)
              </span>
            </div>
          )}
        </div>

        <div className="text-[11px] font-medium text-slate-600">
          {isCleared
            ? 'Cleared for exams'
            : `${formatMoney(balanceRemaining)} remaining`}
        </div>
      </div>
    </div>
  );
}
