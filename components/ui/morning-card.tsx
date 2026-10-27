'use client';

import * as React from 'react';
import { Calendar, Clock, Receipt } from 'lucide-react';
import { MorningCardBrief } from '@/lib/daily-life/types';
import { useLanguage } from '@/lib/i18n/context';

interface MorningCardProps {
  brief: MorningCardBrief;
  feeDeadlineText?: string;
  className?: string;
}

export function MorningCard({
  brief,
  feeDeadlineText,
  className = '',
}: MorningCardProps) {
  const { language } = useLanguage();

  const deadlineLine =
    feeDeadlineText ||
    (brief.urgentDeadline
      ? `${brief.urgentDeadline.title} due ${brief.urgentDeadline.dueDateFormatted}`
      : language === 'sw'
      ? 'Ada za masomo ziko sawa'
      : 'Fee clearances in good standing');

  return (
    <section
      aria-label="Today Snapshot"
      className={`rounded-xl bg-[#0B1D33] border border-[#C59B27]/40 text-white p-4 sm:p-5 shadow-xs ${className}`}
    >
      {/* Top greeting line carrying the intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-serif font-semibold text-[#FCD34D]">
              {language === 'sw' ? 'Muhtasari wa Leo' : 'Today Snapshot'}
            </span>
            <span className="text-white/40">•</span>
            <span className="font-mono text-[11px] text-slate-300">
              {brief.admissionNumber}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight mt-0.5">
            {brief.greeting}, {brief.studentName.split(' ')[0]}
          </h2>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-slate-200 border border-white/15 w-fit">
          <Calendar className="w-3.5 h-3.5 text-[#FCD34D]" />
          <span>{brief.todayDateFormatted}</span>
        </div>
      </div>

      {/* Snapshot metrics: Today's lecture count & Fee deadline line */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
        <div className="flex items-center gap-2.5 text-slate-200 bg-white/5 px-3 py-2.5 rounded-lg border border-white/10">
          <Clock className="w-4 h-4 text-[#FCD34D] shrink-0" />
          <span className="font-medium">
            {brief.classesCount > 0
              ? `${brief.classesCount} ${
                  brief.classesCount === 1
                    ? language === 'sw'
                      ? 'kipindi kimeratibiwa leo'
                      : 'lecture scheduled today'
                    : language === 'sw'
                    ? 'vipindi vimeratibiwa leo'
                    : 'lectures scheduled today'
                }`
              : language === 'sw'
              ? 'Hakuna vipindi leo • Siku ya kujisomea'
              : 'No lectures scheduled today • Free study day'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-slate-200 bg-white/5 px-3 py-2.5 rounded-lg border border-white/10">
          <Receipt className="w-4 h-4 text-[#FCD34D] shrink-0" />
          <span className="font-medium truncate">{deadlineLine}</span>
        </div>
      </div>
    </section>
  );
}
