import * as React from 'react';
import { CheckCircle2, ShieldCheck, TrendingUp, Info } from 'lucide-react';

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
  if (totalBilled <= 0) return null;

  const effectivePaidByStudent = paidByStudent !== undefined ? paidByStudent : Math.max(0, totalPaid - fundingApplied);
  const totalSettled = Math.min(totalBilled, totalPaid);

  const percentSettled = Math.min(100, Math.round((totalSettled / totalBilled) * 100));
  const percentStudent = Math.min(100, Math.round((effectivePaidByStudent / totalBilled) * 100));
  const percentFunding = Math.min(100 - percentStudent, Math.round((fundingApplied / totalBilled) * 100));
  const percentRemaining = Math.max(0, 100 - (percentStudent + percentFunding));

  function formatMoney(amount: number): string {
    return `${currency} ${amount.toLocaleString('en-KE')}`;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Semester Payment Progress</span>
          <span className="font-mono font-bold text-[#0B1D33]">{percentSettled}% Cleared</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex border border-slate-200">
          <div
            style={{ width: `${percentStudent}%` }}
            className="bg-emerald-600 h-full transition-all duration-500"
            title={`Paid by Student: ${percentStudent}%`}
          />
          <div
            style={{ width: `${percentFunding}%` }}
            className="bg-indigo-600 h-full transition-all duration-500"
            title={`Funding / HELB: ${percentFunding}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatMoney(totalSettled)} cleared</span>
          <span>{formatMoney(Math.max(0, totalBilled - totalSettled))} due</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Top Title & Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0B1D33] text-[#FCD34D] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1D33]">
              {percentSettled >= 100
                ? 'Semester Fees 100% Cleared'
                : `You have cleared ${percentSettled}% of this semester`}
            </h3>
            <p className="text-xs text-slate-500">
              {formatMoney(totalSettled)} cleared of {formatMoney(totalBilled)} total billing assessment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {percentSettled >= 100 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Fully Cleared
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-[#0B1D33] border border-slate-200">
              {percentSettled}% of 100%
            </span>
          )}
        </div>
      </div>

      {/* The Progress Bar with Milestone Markers */}
      <div className="space-y-1.5 pt-1">
        <div className="relative w-full bg-slate-100 rounded-full h-4 overflow-hidden flex border border-slate-200 shadow-inner">
          {/* Segment 1: Paid by Student */}
          <div
            style={{ width: `${percentStudent}%` }}
            className="bg-emerald-600 h-full transition-all duration-500 relative"
            title={`Paid by Student: ${percentStudent}% (${formatMoney(effectivePaidByStudent)})`}
          />
          {/* Segment 2: Funding / HELB */}
          <div
            style={{ width: `${percentFunding}%` }}
            className="bg-indigo-600 h-full transition-all duration-500 relative"
            title={`Funding / HELB: ${percentFunding}% (${formatMoney(fundingApplied)})`}
          />
        </div>

        {/* Milestone Indicator Ticks */}
        <div className="relative w-full flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
          <span>0%</span>
          <span className="text-center pl-4">50% Midterm Guideline</span>
          <span className="text-right">100% Exam Pass</span>
        </div>
      </div>

      {/* Progress Breakdown Legend */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
            <span className="text-slate-600">
              Paid by You: <strong className="text-slate-900 font-mono">{formatMoney(effectivePaidByStudent)}</strong> ({percentStudent}%)
            </span>
          </div>

          {fundingApplied > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
              <span className="text-slate-600">
                HELB / Sponsor: <strong className="text-slate-900 font-mono">{formatMoney(fundingApplied)}</strong> ({percentFunding}%)
              </span>
            </div>
          )}

          {percentRemaining > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
              <span className="text-slate-600">
                Balance Due: <strong className="text-slate-900 font-mono">{formatMoney(totalBilled - totalSettled)}</strong> ({percentRemaining}%)
              </span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          {percentSettled >= 100
            ? 'Exam clearance criteria met'
            : `${100 - percentSettled}% remaining for full clearance`}
        </div>
      </div>
    </div>
  );
}
