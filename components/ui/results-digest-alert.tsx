import * as React from 'react';
import Link from 'next/link';
import { ResultsDigestAlert } from '@/lib/exams/types';
import { Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ResultsDigestAlertBannerProps {
  alert: ResultsDigestAlert;
  variant?: 'banner' | 'card';
}

export function ResultsDigestAlertBanner({
  alert,
  variant = 'banner',
}: ResultsDigestAlertBannerProps) {
  if (variant === 'card') {
    return (
      <Link href="/results" className="block group">
        <div className="p-5 rounded-2xl bg-[#0B1D33] text-white border-l-4 border-l-[#C59B27] shadow-md space-y-2 group-hover:border-[#C59B27]/90 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#C59B27] text-[#0B1D33] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#FCD34D] block">
                  Examination Results Released
                </span>
                <h4 className="text-sm font-bold font-serif text-white">
                  Semester {alert.semester} ({alert.academicYear})
                </h4>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#FCD34D] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Grades <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pl-10">
            {alert.message}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0B1D33] text-white border-l-4 border-l-[#C59B27] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#C59B27] text-[#0B1D33] flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C59B27] text-[#0B1D33]">
              Official Release
            </span>
            <span className="text-xs font-mono text-slate-300">
              Semester {alert.semester} · {alert.academicYear}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-200">
            {alert.message}
          </p>
        </div>
      </div>

      <div className="self-end sm:self-auto shrink-0 flex items-center gap-1.5 text-xs font-mono text-[#FCD34D]">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Verified by Senate</span>
      </div>
    </div>
  );
}
