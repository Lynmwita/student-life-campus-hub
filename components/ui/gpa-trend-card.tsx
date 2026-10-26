import * as React from 'react';
import { Card } from '@/components/ui/card';
import { GraduationCap, Award, BookOpen, TrendingUp } from 'lucide-react';

interface GpaTrendCardProps {
  semesterGpa: number;
  cumulativeGpa: number;
  totalUnits: number;
  history: Array<{
    semesterLabel: string;
    gpa: number;
    cgpa: number;
    units: number;
  }>;
}

export function GpaTrendCard({
  semesterGpa,
  cumulativeGpa,
  totalUnits,
  history,
}: GpaTrendCardProps) {
  // Edge case: when totalUnits is 0, display 0.00 cleanly
  const safeSemesterGpa = Number.isFinite(semesterGpa) ? semesterGpa.toFixed(2) : '0.00';
  const safeCgpa = Number.isFinite(cumulativeGpa) ? cumulativeGpa.toFixed(2) : '0.00';

  return (
    <div className="space-y-4">
      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Semester GPA</span>
            <GraduationCap className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#0B1D33]">{safeSemesterGpa}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Scale: 4.00 Maximum</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Cumulative GPA (CGPA)</span>
            <Award className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#0B1D33]">{safeCgpa}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Unit-Weighted Average</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Completed Units</span>
            <BookOpen className="w-4 h-4 text-[#0B1D33]" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#0B1D33]">
            {totalUnits}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Authoritative Credit Units</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Academic Standing</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-700 mt-2">
            {cumulativeGpa >= 3.7 ? "Dean's Honor Roll" : cumulativeGpa >= 3.0 ? 'Good Standing' : 'Academic Warning'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Senate Approved</p>
        </Card>
      </div>

      {/* Historical GPA Trend Chart / Progression */}
      {history && history.length > 0 && (
        <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0B1D33] font-serif">
                Grade Point Average Progression
              </h3>
              <p className="text-xs text-slate-500">
                Official unit-weighted semester GPA and cumulative CGPA history.
              </p>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {history.length} Semesters Recorded
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {history.map((pt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-[#C59B27] transition space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0B1D33]">{pt.semesterLabel}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{pt.units} units</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Semester GPA</span>
                    <span className="font-mono font-bold text-[#0B1D33]">{pt.gpa.toFixed(2)}</span>
                  </div>
                  {/* Progress track */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-[#0B1D33] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (pt.gpa / 4.0) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60">
                  <span className="text-slate-500">Running CGPA:</span>
                  <span className="font-mono font-bold text-[#C59B27]">{pt.cgpa.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
