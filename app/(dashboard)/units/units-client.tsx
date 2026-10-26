'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Info,
  Check,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AvailableCourseUnit,
  RegisteredUnit,
  UnitRegistrationRules,
} from '@/lib/units/types';
import { submitUnitRegistrationAction } from '@/lib/actions/unit-registration';

interface UnitsClientProps {
  initialRules: UnitRegistrationRules;
  initialAvailableUnits: AvailableCourseUnit[];
  initialRegisteredUnits: RegisteredUnit[];
  isDemo: boolean;
}

export function UnitsClient({
  initialRules,
  initialAvailableUnits,
  initialRegisteredUnits,
  isDemo,
}: UnitsClientProps) {
  const [rules, setRules] = React.useState<UnitRegistrationRules>(initialRules);
  const [availableUnits] = React.useState<AvailableCourseUnit[]>(initialAvailableUnits);
  const [registeredUnits, setRegisteredUnits] = React.useState<RegisteredUnit[]>(initialRegisteredUnits);

  // Selected unit codes for candidate registration
  // Default to pre-selecting all core eligible units (12 credits)
  const [selectedCodes, setSelectedCodes] = React.useState<string[]>(() => {
    if (initialRegisteredUnits.length > 0) {
      return initialRegisteredUnits.map((u) => u.code);
    }
    return initialAvailableUnits.filter((u) => u.isCore && u.isEligible).map((u) => u.code);
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: 'success' | 'error';
    text: string;
    reference?: string;
  } | null>(null);

  const isAlreadyRegistered = registeredUnits.length > 0;

  // Compute selected credits
  const selectedUnits = availableUnits.filter((u) => selectedCodes.includes(u.code));
  const totalSelectedCredits = selectedUnits.reduce((acc, u) => acc + u.creditHours, 0);

  const isBelowMin = totalSelectedCredits < rules.minCreditHours;
  const isAboveMax = totalSelectedCredits > rules.maxCreditHours;
  const isOptimalCredits = !isBelowMin && !isAboveMax;

  const toggleUnit = (code: string, isEligible: boolean) => {
    if (!isEligible || isAlreadyRegistered) return;
    setFeedback(null);

    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmitRegistration = async () => {
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await submitUnitRegistrationAction(selectedCodes);
      if (res.success && res.registeredUnits) {
        setRegisteredUnits(res.registeredUnits);
        setRules((prev) => ({
          ...prev,
          currentRegisteredCredits: res.totalCredits ?? totalSelectedCredits,
        }));
        setFeedback({
          type: 'success',
          text: res.message,
          reference: res.registrationReference,
        });
      } else {
        setFeedback({
          type: 'error',
          text: res.message || 'UAMS registrar engine declined course registration.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to submit unit registration to registrar.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C59B27]" />
            <span>
              <strong>Demo Session:</strong> Live curriculum prerequisites for Faith Wanjiku (BIT/2023/8849). Submitting validates directly against registrar engine rules.
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            REGISTRAR UAMS
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C59B27]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0B1D33] font-semibold">Unit Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-[#C59B27]" />
            Semester Course Unit Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {rules.semesterLabel} · Authoritative curriculum enrollment, prerequisite checks, and registrar clearance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="info">
            {rules.isOpen ? 'Window Open' : 'Window Closed'}
          </Badge>
          <Badge variant="default">Due: {rules.registrationDeadline}</Badge>
        </div>
      </div>

      {/* Credit Threshold & Status Dock */}
      <Card className="p-5 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Credit Hours Load
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                  isAlreadyRegistered
                    ? 'bg-emerald-100 text-emerald-800'
                    : isOptimalCredits
                    ? 'bg-blue-100 text-blue-900'
                    : isBelowMin
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-rose-100 text-rose-900'
                }`}
              >
                {totalSelectedCredits} / {rules.maxCreditHours} Credits Selected
              </span>
            </div>

            <p className="text-xs text-slate-600">
              {isAlreadyRegistered ? (
                <strong className="text-emerald-700">
                  Registration completed and approved by Academic Registrar.
                </strong>
              ) : isBelowMin ? (
                <span className="text-amber-700 font-medium">
                  Below threshold: You must select at least {rules.minCreditHours} credits to submit (need {rules.minCreditHours - totalSelectedCredits} more).
                </span>
              ) : isAboveMax ? (
                <span className="text-rose-700 font-medium">
                  Credit overload: Maximum allowed is {rules.maxCreditHours} credits. Deselect {totalSelectedCredits - rules.maxCreditHours} credits.
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  Optimal credit load ({totalSelectedCredits} credits). Ready for institutional submission.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="block text-[11px] text-slate-500 font-medium">Min Credits</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {rules.minCreditHours}
              </span>
            </div>
            <div className="text-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="block text-[11px] text-slate-500 font-medium">Max Credits</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {rules.maxCreditHours}
              </span>
            </div>
            <div className="text-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="block text-[11px] text-slate-500 font-medium">Selected Units</span>
              <span className="text-sm font-bold text-[#0B1D33] font-mono">
                {selectedCodes.length}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Track */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                isAlreadyRegistered
                  ? 'bg-emerald-500'
                  : isOptimalCredits
                  ? 'bg-[#C59B27]'
                  : isBelowMin
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, (totalSelectedCredits / rules.maxCreditHours) * 100)}%`,
              }}
            />
          </div>
        </div>
      </Card>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-semibold">{feedback.text}</p>
              {feedback.reference && (
                <p className="font-mono text-[11px] text-emerald-800">
                  Authoritative Reference: <strong>{feedback.reference}</strong>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline shrink-0 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Confirmation Card when Already Registered */}
      {isAlreadyRegistered && (
        <Card className="p-6 bg-emerald-50/50 border border-emerald-200">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-emerald-950">
                  Official Registration Confirmed
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-mono text-xs font-bold">
                  {registeredUnits[0]?.registrationRef}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Your course unit registration for Semester 2 has been accepted by the UAMS Academic Registrar. All registered units are confirmed for lecture timetables and examination pass eligibility.
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                {registeredUnits.map((u) => (
                  <span
                    key={u.code}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-slate-800 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-mono font-bold text-[#0B1D33]">{u.code}</span>
                    <span className="text-slate-500 font-normal">({u.creditHours} credits)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Available Units Selection List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-[#0B1D33] flex items-center gap-2">
            <span>Available Course Units</span>
            <span className="text-xs font-sans font-normal text-slate-500">
              ({availableUnits.length} offered units)
            </span>
          </h2>
          <span className="text-xs text-slate-500">Select between 15 and 24 credit hours</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {availableUnits.map((unit) => {
            const isSelected = selectedCodes.includes(unit.code);
            const isRegistered = registeredUnits.some((r) => r.code === unit.code);

            return (
              <div
                key={unit.code}
                onClick={() => toggleUnit(unit.code, unit.isEligible)}
                className={`rounded-xl border p-4 sm:p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !unit.isEligible
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : isRegistered
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : isSelected
                    ? 'bg-[#0B1D33]/5 border-[#C59B27] shadow-xs cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Selection Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md mt-0.5 border flex items-center justify-center shrink-0 transition ${
                      isRegistered
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isSelected
                        ? 'bg-[#0B1D33] border-[#0B1D33] text-[#FCD34D]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {(isSelected || isRegistered) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0B1D33] text-[#FCD34D]">
                        {unit.code}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          unit.isCore
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {unit.isCore ? 'Core Unit' : 'Elective'}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {unit.creditHours} Credits
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#0B1D33] pt-0.5">
                      {unit.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {unit.department} · {unit.lectureHoursPerWeek} lecture hours/week
                    </p>

                    {/* Prerequisites check */}
                    {unit.prerequisites.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[11px]">
                        <span className="text-slate-500 font-medium">Prerequisites:</span>
                        {unit.prerequisites.map((p) => (
                          <span
                            key={p.courseCode}
                            className={`px-1.5 py-0.5 rounded font-mono ${
                              p.isSatisfied
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                            }`}
                          >
                            {p.courseCode} (Grade {p.minimumGrade}) {p.isSatisfied ? 'Satisfied' : 'Pending'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 pt-1">
                        No prerequisite course required
                      </div>
                    )}

                    {!unit.isEligible && unit.ineligibilityReason && (
                      <p className="text-[11px] text-rose-600 font-medium pt-1">
                        {unit.ineligibilityReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Badge Status */}
                <div className="shrink-0 pt-2 sm:pt-0 flex items-center justify-end">
                  {isRegistered ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                      Registered
                    </span>
                  ) : !unit.isEligible ? (
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                      Ineligible
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs font-bold text-[#0B1D33] bg-[#FCD34D]/30 border border-[#C59B27] px-2.5 py-1 rounded-md">
                      Selected
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md">
                      Available
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      {!isAlreadyRegistered && (
        <div className="sticky bottom-4 rounded-xl bg-[#0B1D33] border border-[#C59B27]/40 p-4 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold text-[#FCD34D]">
                Registration Summary:
              </span>
              <span className="text-sm font-mono font-bold">
                {selectedCodes.length} Units · {totalSelectedCredits} Credits
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isBelowMin
                ? `Need ${rules.minCreditHours - totalSelectedCredits} more credits to satisfy minimum requirement.`
                : isAboveMax
                ? `Exceeds max allowed credits by ${totalSelectedCredits - rules.maxCreditHours}.`
                : 'All selection criteria satisfied. Authoritative confirmation is issued on submission.'}
            </p>
          </div>

          <Button
            size="lg"
            disabled={!isOptimalCredits || submitting}
            onClick={handleSubmitRegistration}
            className={`font-serif font-bold text-sm h-11 px-6 ${
              isOptimalCredits
                ? 'bg-[#C59B27] hover:bg-[#b0881f] text-[#0B1D33]'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCw
              className={`w-4 h-4 mr-2 ${submitting ? 'animate-spin' : ''}`}
            />
            <span>{submitting ? 'Submitting to UAMS...' : 'Submit Semester Registration'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
