'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, AlertCircle, X, ChevronRight } from 'lucide-react';
import { FeeDeadlineAlert } from '@/lib/finance/deadline-alerts';

export interface FeeDeadlineBannerProps {
  alert: FeeDeadlineAlert | null;
  variant?: 'banner' | 'card';
  className?: string;
}

export function FeeDeadlineBanner({
  alert,
  variant = 'banner',
  className = '',
}: FeeDeadlineBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    if (alert?.windowKey && typeof window !== 'undefined') {
      try {
        const dismissed = localStorage.getItem(`smu_dismissed_deadline_${alert.windowKey}`);
        if (dismissed === 'true') {
          setIsDismissed(true);
        }
      } catch {
        // Fallback for private mode or storage restrictions
      }
    }
  }, [alert?.windowKey]);

  if (!alert || isDismissed) {
    return null;
  }

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    if (alert?.windowKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`smu_dismissed_deadline_${alert.windowKey}`, 'true');
      } catch {
        // Fallback
      }
    }
  }

  // Overdue: deeper tone, still calm
  if (alert.isOverdue) {
    if (variant === 'card') {
      return (
        <div
          role="alert"
          aria-live="polite"
          className={`block group rounded-xl border border-slate-800 bg-[#0B1D33] text-white p-4 shadow-xs border-l-4 border-l-rose-500 transition-all ${className}`}
        >
          <div className="flex items-start justify-between gap-3">
            <Link href="/fees" className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    Overdue
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Due {alert.formattedDueDate}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-100 mt-1 leading-snug">
                  {alert.message}
                </p>
                <div className="mt-2 flex items-center text-xs font-semibold text-[#FCD34D] group-hover:underline">
                  <span>Open fee statement</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss deadline alert"
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Slim Banner Variant (Overdue)
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`w-full rounded-xl border border-slate-800 bg-[#0B1D33] text-white px-4 py-3 shadow-2xs border-l-4 border-l-rose-500 ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-xs font-medium text-slate-100 truncate">
              {alert.message}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/fees"
              className="text-xs font-semibold text-[#FCD34D] hover:underline whitespace-nowrap"
            >
              View statement
            </Link>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss deadline alert"
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upcoming Alert (7_day, 3_day, today): Subtle warm gold & classic navy
  if (variant === 'card') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`block group rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-xs border-l-4 border-l-[#C59B27] text-[#0B1D33] transition-all ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <Link href="/fees" className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0B1D33] text-[#FCD34D] flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  {alert.window === 'today' ? 'Due Today' : `${alert.daysRemaining} Days Left`}
                </span>
                <span className="text-xs text-slate-600 font-mono">
                  Due {alert.formattedDueDate}
                </span>
              </div>
              <p className="text-xs font-medium text-[#0B1D33] mt-1 leading-snug">
                {alert.message}
              </p>
              <div className="mt-2 flex items-center text-xs font-semibold text-[#0B1D33] group-hover:text-[#C59B27]">
                <span>Review fee details</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss deadline alert"
            className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-amber-100/60 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Slim Banner Variant (Upcoming)
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`w-full rounded-xl border border-amber-200/80 bg-amber-50/80 text-[#0B1D33] px-4 py-2.5 shadow-2xs border-l-4 border-l-[#C59B27] ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock className="w-4 h-4 text-[#C59B27] shrink-0" />
          <p className="text-xs font-medium text-[#0B1D33] truncate">
            {alert.message}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/fees"
            className="text-xs font-semibold text-[#0B1D33] hover:text-[#C59B27] underline underline-offset-2 whitespace-nowrap"
          >
            Statement
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss deadline alert"
            className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-amber-100 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
