'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  DigitalExamPassData,
  ExamTimetableEntry,
  ClearanceStatus,
} from '@/lib/exams/types';
import {
  DEMO_EXAM_PASS_BLOCKED,
  DEMO_EXAM_PASS_CLEARED,
  DEMO_EXAM_PASS_PENDING,
} from '@/lib/exams/demo-data';
import { ExamPassQr } from '@/components/ui/exam-pass-qr';
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  User,
  Info,
} from 'lucide-react';

interface ExamsClientProps {
  initialPass: DigitalExamPassData | null;
  initialTimetable: ExamTimetableEntry[];
  nextExam: ExamTimetableEntry | null;
  daysToNextExam: number | null;
  isDemo: boolean;
}

export function ExamsClient({
  initialPass,
  initialTimetable,
  nextExam,
  daysToNextExam,
  isDemo,
}: ExamsClientProps) {
  const [activeTab, setActiveTab] = React.useState<'pass' | 'timetable'>('pass');
  const [passData, setPassData] = React.useState<DigitalExamPassData | null>(initialPass);
  const [demoState, setDemoState] = React.useState<ClearanceStatus>(
    initialPass?.clearance.status || 'blocked'
  );

  // Group timetable entries by date
  const groupedTimetable = React.useMemo(() => {
    const map: Record<string, ExamTimetableEntry[]> = {};
    for (const item of initialTimetable) {
      if (!map[item.examDate]) {
        map[item.examDate] = [];
      }
      map[item.examDate].push(item);
    }
    return Object.entries(map).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  }, [initialTimetable]);

  function switchDemoVariant(variant: ClearanceStatus) {
    setDemoState(variant);
    if (variant === 'cleared') {
      setPassData(DEMO_EXAM_PASS_CLEARED);
    } else if (variant === 'pending') {
      setPassData(DEMO_EXAM_PASS_PENDING);
    } else {
      setPassData(DEMO_EXAM_PASS_BLOCKED);
    }
  }

  // Format initials monogram
  const initials = React.useMemo(() => {
    if (!passData?.studentName) return 'ST';
    return passData.studentName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [passData?.studentName]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight">
            Examinations & Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official digital examination permit, clearance status, and semester paper timetable.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pass')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'pass'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#C59B27]" />
            Exam Pass
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'timetable'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#0B1D33]" />
            Exam Timetable
          </button>
        </div>
      </div>

      {/* Demo Clearance Toggle Toolbar (Only visible in demo inspection mode) */}
      {isDemo && activeTab === 'pass' && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <Info className="w-4 h-4 text-[#C59B27] shrink-0" />
            <span>
              <strong>Demo Clearance Inspector:</strong> Test the three clearance states defined by the Registrar.
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => switchDemoVariant('blocked')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                demoState === 'blocked'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              1. Blocked (Fee Balance)
            </button>
            <button
              type="button"
              onClick={() => switchDemoVariant('cleared')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                demoState === 'cleared'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              2. Cleared (Registrar Stamp)
            </button>
            <button
              type="button"
              onClick={() => switchDemoVariant('pending')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                demoState === 'pending'
                  ? 'bg-[#0B1D33] text-[#FCD34D] shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              3. Pending Confirmation
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: DIGITAL EXAM PASS */}
      {activeTab === 'pass' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {!passData ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="text-base font-bold text-[#0B1D33]">No Examination Pass Issued</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active registration was found for the current examination cycle. Contact the Office of the Registrar if you believe this is an omission.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-[#0B1D33]/20 shadow-xl overflow-hidden relative">
              {/* Security Header Band */}
              <div className="bg-[#0B1D33] text-white p-6 sm:p-7 border-b-2 border-[#C59B27]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-[#C59B27] text-[#0B1D33]">
                        Republic of Kenya
                      </span>
                      <span className="text-[11px] text-slate-300 font-mono">
                        Ref: {passData.passNumber}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-serif font-bold tracking-wide text-white">
                      SUMMIT METROPOLITAN UNIVERSITY
                    </h2>
                    <p className="text-xs text-slate-300 font-medium tracking-wide uppercase">
                      Office of the Academic Registrar · Examination Permit
                    </p>
                  </div>

                  {/* Clearance Badge in Header */}
                  <div className="self-start sm:self-auto shrink-0">
                    {passData.clearance.status === 'cleared' && (
                      <div className="bg-emerald-600/90 text-white border border-emerald-400 px-3 py-1.5 rounded-xl text-center shadow-xs">
                        <span className="text-[10px] uppercase font-bold tracking-wider block">
                          Verified Status
                        </span>
                        <span className="text-xs font-bold font-mono text-emerald-100 flex items-center gap-1 justify-center mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#FCD34D]" /> Cleared
                        </span>
                      </div>
                    )}
                    {passData.clearance.status === 'blocked' && (
                      <div className="bg-red-700/90 text-white border border-red-500 px-3 py-1.5 rounded-xl text-center shadow-xs">
                        <span className="text-[10px] uppercase font-bold tracking-wider block">
                          Access Hold
                        </span>
                        <span className="text-xs font-bold font-mono text-red-100 flex items-center gap-1 justify-center mt-0.5">
                          <ShieldAlert className="w-3.5 h-3.5" /> Blocked
                        </span>
                      </div>
                    )}
                    {passData.clearance.status === 'pending' && (
                      <div className="bg-amber-600/90 text-white border border-amber-400 px-3 py-1.5 rounded-xl text-center shadow-xs">
                        <span className="text-[10px] uppercase font-bold tracking-wider block">
                          Verification
                        </span>
                        <span className="text-xs font-bold font-mono text-amber-100 flex items-center gap-1 justify-center mt-0.5">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Identification & QR Verification Section */}
              <div className="p-6 sm:p-7 bg-slate-50/50 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                  {/* Student Details and Photo / Initials Monogram */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    {passData.photoUrl ? (
                      <img
                        src={passData.photoUrl}
                        alt={passData.studentName}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-[#C59B27] shadow-sm shrink-0"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-2xl bg-[#0B1D33] text-[#FCD34D] border-2 border-[#C59B27] flex items-center justify-center font-serif text-2xl font-bold tracking-wider shadow-inner shrink-0"
                        title={passData.studentName}
                      >
                        {initials}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500 font-mono">
                        ADMISSION NO: <strong className="text-slate-900 font-bold">{passData.admissionNumber}</strong>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-[#0B1D33]">
                        {passData.studentName}
                      </h3>
                      <p className="text-xs text-slate-700 font-medium">
                        {passData.programme}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {passData.faculty} · {passData.semesterLabel} ({passData.academicYear})
                      </p>
                    </div>
                  </div>

                  {/* Verification QR Code */}
                  <div className="text-center shrink-0">
                    <ExamPassQr payload={passData.qrPayload} size={105} />
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Hall Entry Check-In
                    </p>
                  </div>
                </div>
              </div>

              {/* Clearance Status Callout Banner */}
              <div className="p-6 sm:p-7 border-b border-slate-200">
                {passData.clearance.status === 'cleared' && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>OFFICIALLY CLEARED FOR EXAMINATIONS</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Verification Reference: <strong className="font-mono">{passData.clearance.clearanceReference}</strong>.
                      Cleared by {passData.clearance.clearedBy} on {new Date(passData.clearance.clearedAt || '').toLocaleDateString('en-KE')}. Present this digital pass along with your physical Student ID at the examination hall door.
                    </p>
                  </div>
                )}

                {passData.clearance.status === 'blocked' && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-950 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-xs text-red-900">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                      <span>EXAMINATION PASS BLOCKED - ACTION REQUIRED</span>
                    </div>
                    <div className="text-xs text-red-800 space-y-1 leading-relaxed">
                      <p className="font-medium">
                        You have not met the mandatory institutional clearance criteria:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-red-900 font-semibold pl-1">
                        {passData.clearance.blockingReasons?.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-1 flex items-center gap-3">
                      <Link
                        href="/fees"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-800 text-white text-xs font-semibold hover:bg-red-900 transition shadow-xs"
                      >
                        Resolve on Fee Statement <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-[11px] text-red-700">
                        Immediate clearance upon payment settlement.
                      </span>
                    </div>
                  </div>
                )}

                {passData.clearance.status === 'pending' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                      <Clock className="w-4 h-4 text-[#C59B27] shrink-0" />
                      <span>PENDING CONFIRMATION FROM REGISTRAR</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Your semester curriculum registration has been recorded. Official digital sign-off and hall clearance are currently being processed by the Registrar. No further student action is required at this time.
                    </p>
                  </div>
                )}
              </div>

              {/* Registered Units Section */}
              <div className="p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0B1D33] uppercase tracking-wider">
                    Authorised Examination Course Units ({passData.registeredUnits.length})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Total: {passData.registeredUnits.reduce((acc, u) => acc + u.units, 0)} Academic Units
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {passData.registeredUnits.map((unit) => (
                    <div
                      key={unit.code}
                      className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/80 transition"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-[#0B1D33]">{unit.code}</span>
                        <p className="text-slate-700 font-medium">{unit.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {unit.units} Units
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Notice */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                <span>
                  Valid only for Semester 1 (2026/2027) examinations. Any unauthorized alteration renders this pass null and void.
                </span>
                <span className="font-mono shrink-0">
                  Generated: {new Date(passData.issuedAt).toLocaleDateString('en-KE')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXAM TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          {/* Next Paper Highlight Banner */}
          {nextExam ? (
            <div className="bg-[#0B1D33] text-white rounded-2xl p-6 border-l-4 border-l-[#C59B27] shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FCD34D]">
                  <Clock className="w-4 h-4" /> Next Upcoming Paper
                </div>
                {typeof daysToNextExam === 'number' && (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 self-start sm:self-auto">
                    {daysToNextExam <= 0
                      ? 'Today'
                      : daysToNextExam === 1
                      ? 'Tomorrow'
                      : `In ${daysToNextExam} days`}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-serif font-bold text-white">
                  {nextExam.courseCode}: {nextExam.courseName}
                </h3>
                <p className="text-xs text-slate-300">
                  Paper Type: {nextExam.paperType || 'Standard Examination Paper'}
                </p>
              </div>

              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-white/15">
                <div>
                  <span className="text-slate-400 block text-[11px]">Date</span>
                  <span className="font-semibold font-mono text-[#FCD34D] mt-0.5 block">
                    {nextExam.examDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Time</span>
                  <span className="font-semibold font-mono mt-0.5 block">
                    {nextExam.startTime} - {nextExam.endTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Venue</span>
                  <span className="font-semibold mt-0.5 block truncate">
                    {nextExam.venue}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Allocated Seat</span>
                  <span className="font-semibold font-mono text-emerald-300 mt-0.5 block">
                    {nextExam.seatNumber}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              No pending exam papers in the active countdown window.
            </div>
          )}

          {/* Grouped Timetable by Date */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0B1D33]">
                Full Semester Examination Schedule ({initialTimetable.length} Papers)
              </h2>
              <span className="text-xs text-slate-500">Grouped by examination date</span>
            </div>

            {groupedTimetable.map(([dateString, exams]) => (
              <div key={dateString} className="space-y-3">
                {/* Date Header Pill */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-lg bg-slate-200/70 text-[#0B1D33] text-xs font-mono font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                    {new Date(dateString + 'T00:00:00Z').toLocaleDateString('en-KE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                {/* Exams on this Date */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 hover:border-[#C59B27] transition"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {exam.paperType || 'Standard'}
                          </span>
                          <h4 className="font-bold text-sm text-[#0B1D33] mt-1.5">
                            {exam.courseCode}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium">
                            {exam.courseName}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-[#0B1D33] block">
                            {exam.startTime} - {exam.endTime}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-sans">
                            3 Hours
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                          <span className="truncate">{exam.venue}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono font-bold text-slate-900">{exam.seatNumber}</span>
                        </div>
                      </div>

                      {exam.instructions && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                          {exam.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
