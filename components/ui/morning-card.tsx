'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, AlertCircle, ArrowRight, IdCard, Receipt, BookOpen } from 'lucide-react';
import { MorningCardBrief } from '@/lib/daily-life/types';

interface MorningCardProps {
  brief: MorningCardBrief;
  className?: string;
}

export function MorningCard({ brief, className = '' }: MorningCardProps) {
  return (
    <div
      className={`rounded-2xl bg-[#0B1D33] border border-[#C59B27]/40 text-white p-5 sm:p-7 shadow-md relative overflow-hidden ${className}`}
    >
      {/* Background Decorative Gradient Ring */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-[#C59B27]/10 blur-2xl pointer-events-none" />

      {/* Top Header: Greeting, Admission & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FCD34D]">
              Morning Briefing
            </span>
            <span className="text-white/40">·</span>
            <span className="text-xs font-mono text-slate-300">
              {brief.admissionNumber}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            {brief.greeting}, {brief.studentName.split(' ')[0]}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-slate-200 border border-white/15">
            <Calendar className="w-3.5 h-3.5 text-[#FCD34D]" />
            <span>{brief.todayDateFormatted}</span>
          </div>
        </div>
      </div>

      {/* Core Grid: Lectures Today + Daily Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Today's Classes */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FCD34D]" />
                Today&apos;s Lectures
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#C59B27]/30 text-[#FCD34D] font-bold">
                {brief.classesCount} {brief.classesCount === 1 ? 'class' : 'classes'}
              </span>
            </div>

            {brief.nextClass ? (
              <div className="mt-2 space-y-1.5">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-[#FCD34D]">
                    {brief.nextClass.code}
                  </span>
                  <span className="truncate">{brief.nextClass.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {brief.nextClass.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FCD34D]" />
                    {brief.nextClass.venue}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 mt-2">
                No scheduled lectures for {brief.todayDayName}. Free study day.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <Link
              href="/timetable"
              className="text-xs text-[#FCD34D] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View full weekly timetable</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Daily Focus / Critical Deadlines */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#FCD34D]" />
                Daily Focus & Clearances
              </span>
              {brief.urgentDeadline && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                  Action required
                </span>
              )}
            </div>

            {brief.urgentDeadline ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-bold text-white">
                  {brief.urgentDeadline.title}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {brief.urgentDeadline.detail}
                </p>
                <p className="text-[11px] font-mono text-amber-300/90 pt-1">
                  Due: {brief.urgentDeadline.dueDateFormatted}
                </p>
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-bold text-emerald-400">
                  All clearances in good standing
                </p>
                <p className="text-xs text-slate-300">
                  No pending administrative holds. You are cleared for examinations and library access.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            {brief.urgentDeadline ? (
              <Link
                href={brief.urgentDeadline.actionHref}
                className="text-xs text-[#FCD34D] hover:underline font-semibold flex items-center gap-1"
              >
                <span>{brief.urgentDeadline.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <Link
                href="/fees"
                className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1"
              >
                <span>Review fee statements</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mr-1">
          Daily Quick Actions:
        </span>
        <Link
          href="/student-id"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition border border-white/10"
        >
          <IdCard className="w-3.5 h-3.5 text-[#FCD34D]" />
          <span>Flash Gate ID</span>
        </Link>
        <Link
          href="/timetable"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition border border-white/10"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#FCD34D]" />
          <span>Lecture Timetable</span>
        </Link>
        <Link
          href="/fees"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition border border-white/10"
        >
          <Receipt className="w-3.5 h-3.5 text-[#FCD34D]" />
          <span>Fee Statement</span>
        </Link>
      </div>
    </div>
  );
}
