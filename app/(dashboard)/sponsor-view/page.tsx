import { getSponsorViewSummaryAction } from '@/lib/actions/graduation';
import { AppHeader } from '@/components/shared/app-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Receipt, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Parent & Sponsor Statement | Summit Metropolitan University',
  description: 'Verified fee balances, payment instructions, and academic progress for university sponsors.',
};

export default async function SponsorViewPage() {
  const { summary, isDemo } = await getSponsorViewSummaryAction();

  if (!summary) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-slate-600 text-sm">Unable to load sponsor statement. Please log in or verify reference.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {isDemo && (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C59B27]" />
              <span>
                <strong>Demo Session:</strong> Displaying verified sponsor view for Faith Wanjiku (BIT/2023/8849).
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              SPONSOR PORTAL
            </span>
          </div>
        )}

        <div className="border-b border-[#C59B27]/20 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0B1D33] font-semibold">Parent &amp; Sponsor View</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#C59B27]" />
            Official Parent &amp; Sponsor Statement
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Certified statement of fees, payment account numbers, and current academic standing.
          </p>
        </div>

        {/* Student Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Student Name</span>
            <strong className="text-sm text-[#0B1D33] block pt-1">
              {summary.studentName}
            </strong>
            <span className="font-mono text-xs text-slate-500 block">
              {summary.admissionNumber}
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Programme</span>
            <strong className="text-xs text-[#0B1D33] block pt-1">
              {summary.programme}
            </strong>
            <span className="text-[11px] text-slate-500 block">
              {summary.faculty}
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Academic Standing</span>
            <strong className="text-xs text-emerald-800 block pt-1">
              {summary.academicStanding}
            </strong>
            <span className="text-[11px] text-slate-500 block">
              Semester {summary.currentSemester} · {summary.academicYear}
            </span>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Outstanding Balance</span>
            <strong
              className={`text-xl font-bold font-serif block pt-1 ${
                summary.feeSummary.balance > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              KES {summary.feeSummary.balance.toLocaleString()}
            </strong>
            <span className="text-[11px] text-slate-500 block">
              Due Date: {summary.feeSummary.dueDate}
            </span>
          </Card>
        </div>

        {/* Payment Channels */}
        <Card className="p-6 bg-white border border-[#C59B27]/40 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-base text-[#0B1D33] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#C59B27]" />
            <span>Official University Payment Channels</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Safaricom M-Pesa Paybill
              </span>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Business Paybill Number:</span>
                  <strong className="font-mono text-[#0B1D33] text-sm">
                    {summary.feeSummary.paybillNumber}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <strong className="font-mono text-[#0B1D33] text-sm">
                    {summary.feeSummary.accountNumber}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="text-slate-700">Student Admission Number</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Bank Deposit / Wire
              </span>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank:</span>
                  <span className="text-slate-700">{summary.feeSummary.bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="text-slate-700">{summary.feeSummary.bankDetails.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <strong className="font-mono text-[#0B1D33]">
                    {summary.feeSummary.bankDetails.accountNumber}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
