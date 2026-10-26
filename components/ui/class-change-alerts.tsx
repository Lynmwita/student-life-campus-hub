'use client';

import * as React from 'react';
import { AlertTriangle, Clock, MapPin, User, ChevronRight, Check } from 'lucide-react';
import { ClassChangeAlert } from '@/lib/daily-life/types';

interface ClassChangeAlertsProps {
  alerts: ClassChangeAlert[];
  className?: string;
  onDismiss?: (id: string) => void;
}

export function ClassChangeAlertsBanner({ alerts, className = '', onDismiss }: ClassChangeAlertsProps) {
  const [dismissedIds, setDismissedIds] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('smu_dismissed_class_changes') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smu_dismissed_class_changes', JSON.stringify(updated));
      } catch {}
    }
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const activeAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-xl border p-4 transition shadow-xs ${
            alert.isUrgent
              ? 'bg-amber-50/80 border-amber-300/80 text-[#0B1D33]'
              : 'bg-slate-50 border-slate-200 text-[#0B1D33]'
          }`}
          role="alert"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  alert.isUrgent ? 'bg-[#0B1D33] text-[#FCD34D]' : 'bg-slate-200 text-slate-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0B1D33] text-[#FCD34D]">
                    {alert.courseCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {alert.courseName}
                  </span>
                  {alert.changeType === 'venue_change' && (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                      Room Move
                    </span>
                  )}
                  {alert.changeType === 'reschedule' && (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                      Rescheduled
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-[#0B1D33] pt-0.5">
                  {alert.title}
                </h4>

                <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                  {alert.message}
                </p>

                {/* Specific Venue/Time Shift Details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>
                      <strong className="text-slate-900">New Venue:</strong> {alert.newDetail}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      (was {alert.originalDetail})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{alert.effectiveTime}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{alert.lecturerName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0">
              <span className="text-[10px] text-slate-500">
                Posted today at {new Date(alert.postedAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                type="button"
                onClick={() => handleDismiss(alert.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition shadow-2xs"
                title="Acknowledge and dismiss notice"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Acknowledge</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
