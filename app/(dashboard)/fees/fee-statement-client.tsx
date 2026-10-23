'use client';

import * as React from 'react';
import { FeeStatementData, FeeItem, FeeCategory, PaymentRecord } from '@/lib/finance/types';
import { generatePaymentReceiptPdf } from '@/lib/finance/receipt-generator';
import { PaymentProgressBar } from '@/components/ui/payment-progress-bar';
import {
  Receipt,
  BookOpen,
  Building,
  GraduationCap,
  Activity,
  Wifi,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  CreditCard,
  Info,
  History,
} from 'lucide-react';
import Link from 'next/link';

interface FeeStatementClientProps {
  statements: FeeStatementData[];
  payments?: PaymentRecord[];
  isDemo: boolean;
  errorMessage?: string;
  universityName?: string;
}

export function FeeStatementClient({
  statements,
  payments = [],
  isDemo,
  errorMessage,
  universityName = 'Summit Metropolitan University',
}: FeeStatementClientProps) {
  const [activeTab, setActiveTab] = React.useState<'statement' | 'payments'>('statement');
  const [selectedSemesterIndex, setSelectedSemesterIndex] = React.useState(0);
  const [downloadingReceiptId, setDownloadingReceiptId] = React.useState<string | null>(null);

  if (errorMessage) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h2 className="font-semibold text-sm">Unable to load financial records</h2>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStatement = statements && statements.length > 0
    ? (statements[selectedSemesterIndex] || statements[0])
    : null;
  const items = currentStatement?.items || [];

  function formatKES(amount: number): string {
    return `KES ${amount.toLocaleString('en-KE')}`;
  }

  function handleDownloadReceipt(payment: PaymentRecord) {
    setDownloadingReceiptId(payment.id);
    try {
      generatePaymentReceiptPdf(payment, universityName);
    } catch (err) {
      console.error('Failed to generate receipt PDF', err);
    } finally {
      setTimeout(() => setDownloadingReceiptId(null), 1000);
    }
  }

  function getCategoryIcon(cat: FeeCategory) {
    switch (cat) {
      case 'tuition':
        return <GraduationCap className="w-4 h-4 text-indigo-700" />;
      case 'hostel':
        return <Building className="w-4 h-4 text-emerald-700" />;
      case 'examination':
        return <FileText className="w-4 h-4 text-amber-700" />;
      case 'library':
        return <BookOpen className="w-4 h-4 text-blue-700" />;
      case 'ict':
        return <Wifi className="w-4 h-4 text-cyan-700" />;
      case 'medical':
        return <Activity className="w-4 h-4 text-rose-700" />;
      case 'activity':
      case 'union':
        return <ShieldCheck className="w-4 h-4 text-purple-700" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-700" />;
    }
  }

  function getCategoryLabel(cat: FeeCategory): string {
    switch (cat) {
      case 'tuition':
        return 'Tuition Instruction';
      case 'hostel':
        return 'Campus Accommodation';
      case 'examination':
        return 'Examination';
      case 'library':
        return 'Library & E-Resources';
      case 'ict':
        return 'ICT Infrastructure';
      case 'medical':
        return 'Health Services';
      case 'activity':
        return 'Sports & Student Activities';
      case 'union':
        return 'Student Union Levy';
      default:
        return 'Administrative';
    }
  }

  function getStatusBadge(status: FeeItem['status']) {
    switch (status) {
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Settled
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Partially Paid
          </span>
        );
      case 'billed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Receipt className="w-3 h-3 text-slate-500" />
            Billed
          </span>
        );
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#0B1D33]">
              Fees & Student Finance
            </h1>
            {isDemo && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                Demo Preview
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official university tuition assessment, itemized statements, and payment receipts ledger.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('statement')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'statement'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Fee Statement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'payments'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Payment History
            {payments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {payments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: FEE STATEMENT BREAKDOWN */}
      {activeTab === 'statement' && (
        <>
          {!currentStatement ? (
            <div className="text-center bg-white border border-slate-200 rounded-2xl p-10 max-w-lg mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0B1D33]">No Published Fee Statements</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Your semester invoice has not yet been published by the university finance or registrar office.
                Once your enrollment units are approved and billed, your itemized statement will appear here.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Return to Feed
                </Link>
                <Link
                  href="/help-desk"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B1D33] text-white hover:bg-[#06101E] transition"
                >
                  Contact Help Desk
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Semester selector */}
              {statements.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Academic Period:</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {statements.map((stmt, idx) => (
                      <button
                        key={stmt.statement_id}
                        type="button"
                        onClick={() => setSelectedSemesterIndex(idx)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                          selectedSemesterIndex === idx
                            ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {stmt.semester_label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Billed */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    Total Billed
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#0B1D33] mt-1 font-mono">
                    {formatKES(currentStatement.total_billed)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {currentStatement.semester_label}
                  </p>
                </div>

                {/* Funding Applied (HELB / Sponsor) */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    Funding Applied (HELB / Sponsor)
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-700 mt-1 font-mono">
                    {formatKES(currentStatement.funding_applied ?? 0)}
                  </p>
                  <p className="text-[11px] text-indigo-600 mt-1 truncate">
                    {currentStatement.funding_sources?.[0]?.name || 'Scholarship & loan allocations'}
                  </p>
                </div>

                {/* Paid by You */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    Paid by You
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-800 mt-1 font-mono">
                    {formatKES(currentStatement.paid_by_student ?? currentStatement.total_paid)}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Direct deposits & student payments
                  </p>
                </div>

                {/* Balance Due */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs border-l-4 border-l-[#C59B27]">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    Balance Due
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#0B1D33] mt-1 font-mono">
                    {formatKES(currentStatement.balance)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {currentStatement.balance === 0
                      ? 'Cleared for examination'
                      : 'Payable before exam clearance'}
                  </p>
                </div>
              </div>

              {/* Disbursed Funding Disclosure */}
              {currentStatement.funding_sources && currentStatement.funding_sources.length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-indigo-950">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-indigo-900">External Sponsor & Government Funding:</span>
                    <span>
                      {currentStatement.funding_sources
                        .map((f) => `${f.name} (${formatKES(f.amount)})`)
                        .join(', ')}
                    </span>
                  </div>
                  {currentStatement.funding_sources[0].reference && (
                    <span className="text-[11px] font-mono text-indigo-700 shrink-0">
                      Alloc Ref: {currentStatement.funding_sources[0].reference}
                    </span>
                  )}
                </div>
              )}

              {/* Payment Progress Bar */}
              <PaymentProgressBar
                totalBilled={currentStatement.total_billed}
                totalPaid={currentStatement.total_paid}
                fundingApplied={currentStatement.funding_applied}
                paidByStudent={currentStatement.paid_by_student}
                currency={currentStatement.currency}
              />

              {/* Itemized Line Items Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#0B1D33]">
                      Itemized Fee Allocations
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Detailed distribution of curriculum, statutory, and campus services charges.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                    {items.length} Line Items
                  </span>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-5">Charge Item & Description</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Billing Status</th>
                        <th className="py-3 px-5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-5">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 p-1.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                                {getCategoryIcon(item.category)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-xs">{item.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {getCategoryLabel(item.category)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {item.due_date || 'Standard Term'}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900 text-xs">
                            {formatKES(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={4} className="py-3.5 px-5 text-right text-slate-700">
                          Total Assessment:
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-sm text-[#0B1D33]">
                          {formatKES(currentStatement.total_billed)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 p-1.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{item.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <p className="font-mono font-bold text-slate-900 text-xs shrink-0">
                          {formatKES(item.amount)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 pl-8">
                        <span className="text-slate-500 font-mono">
                          {item.due_date ? `Due ${item.due_date}` : 'Standard Term'}
                        </span>
                        <div>{getStatusBadge(item.status)}</div>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Total Assessment:</span>
                    <span className="font-mono text-sm font-bold text-[#0B1D33]">
                      {formatKES(currentStatement.total_billed)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: PAYMENT HISTORY & DOWNLOADABLE RECEIPTS */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1D33]">
                Past Payments & Validated Receipts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every past transaction reconciled through university paybills, bank accounts, and bursary disbursements.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {payments.length} Reconciled Payment{payments.length === 1 ? '' : 's'}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="text-center bg-white border border-slate-200 rounded-2xl p-10 max-w-lg mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0B1D33]">No Payment Records Found</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                No past payment transactions have been reconciled for your student account yet. Once payments
                are cleared by the university bursar or bank, they will appear here with downloadable receipts.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Desktop Payments Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-5">Date & Time</th>
                      <th className="py-3 px-4">M-Pesa / Reference Code</th>
                      <th className="py-3 px-4">Channel / Source</th>
                      <th className="py-3 px-4">Account Allocation</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-5 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(payment.paid_at).toLocaleDateString('en-KE', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 pl-5">
                            {new Date(payment.paid_at).toLocaleTimeString('en-KE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} EAT
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {payment.reference_code}
                          <p className="text-[10px] font-normal text-slate-400 font-sans">
                            {payment.receipt_number}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {payment.channel_label}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={payment.allocated_to}>
                          {payment.allocated_to}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800 text-xs">
                          {formatKES(payment.amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(payment)}
                            disabled={downloadingReceiptId === payment.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0B1D33] text-white hover:bg-[#06101E] disabled:opacity-50 transition shadow-2xs"
                          >
                            <Download className="w-3 h-3 text-[#FCD34D]" />
                            {downloadingReceiptId === payment.id ? 'Generating…' : 'Receipt PDF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Payments Card List */}
              <div className="md:hidden divide-y divide-slate-100">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {payment.receipt_number}
                        </span>
                        <p className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                          {payment.reference_code}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {payment.channel_label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-800 text-sm">
                          {formatKES(payment.amount)}
                        </p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 mt-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date Paid:</span>
                        <span className="font-mono text-slate-700">
                          {new Date(payment.paid_at).toLocaleString('en-KE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allocation:</span>
                        <span className="text-slate-700 text-right truncate max-w-[200px]" title={payment.allocated_to}>
                          {payment.allocated_to}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(payment)}
                        disabled={downloadingReceiptId === payment.id}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-[#0B1D33] text-white hover:bg-[#06101E] disabled:opacity-50 transition shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-[#FCD34D]" />
                        {downloadingReceiptId === payment.id ? 'Generating Receipt…' : 'Download Official Receipt (PDF)'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Institutional Policy Notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">
              Institutional Assessment & Payment Policy:
            </span>{' '}
            Tuition and accommodation fees must be settled through official university bank accounts or authorized institutional channels. No payment transactions are conducted inside this application. For scholarship credits, bursary allocations, or statement corrections, please consult the University Bursar or log an inquiry on the{' '}
            <Link href="/help-desk" className="text-[#0B1D33] font-semibold underline underline-offset-2 hover:text-[#C59B27]">
              Help Desk
            </Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
