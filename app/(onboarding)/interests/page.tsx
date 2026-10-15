"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Compass, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CANONICAL_INTERESTS } from "@/lib/constants/interests";
import { saveStudentInterestsAction, getStudentInterestsAction } from "@/lib/actions/interests";

export default function StudentInterestsOnboardingPage() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;

    async function loadCurrentInterests() {
      try {
        const res = await getStudentInterestsAction();
        if (!ignore && res.success && res.interests.length > 0) {
          setSelectedInterests(res.interests);
        }
      } catch (err) {
        console.error("Failed to fetch interests", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadCurrentInterests();

    return () => {
      ignore = true;
    };
  }, []);

  function toggleInterest(id: string) {
    setError(null);
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (selectedInterests.length < 3) {
      setError("Please select at least 3 interests to continue.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await saveStudentInterestsAction(selectedInterests);
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.message);
        setSaving(false);
      }
    } catch {
      setError("An unexpected error occurred while saving your preferences. Please try again.");
      setSaving(false);
    }
  }

  const meetsRequirement = selectedInterests.length >= 3;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#06101E] flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-[#FCD34D]" />
            Mandatory Student Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#0B1D33] dark:text-white">
            Select Your Academic & Campus Interests
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-sans">
            Your university identity is verified. Select at least 3 academic and extracurricular areas to personalize your targeted official notices, class timetables, and student society updates.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Counter and Requirements Indicator */}
        <div className="flex items-center justify-between border-b border-[#C59B27]/25 pb-3 text-xs font-semibold">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-sans">
            <span>Selected:</span>
            <span
              className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                meetsRequirement
                  ? "bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40"
                  : "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {selectedInterests.length} of {CANONICAL_INTERESTS.length}
            </span>
            <span className="text-slate-400">(minimum 3 required)</span>
          </div>

          <div>
            {meetsRequirement ? (
              <Badge variant="info" className="flex items-center gap-1">
                <Check className="w-3 h-3 text-[#FCD34D]" /> Requirement Met
              </Badge>
            ) : (
              <Badge variant="warning">
                Select {3 - selectedInterests.length} more
              </Badge>
            )}
          </div>
        </div>

        {/* Interest Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {CANONICAL_INTERESTS.map((item) => {
            const isSelected = selectedInterests.includes(item.id);

            return (
              <Card
                key={item.id}
                onClick={() => toggleInterest(item.id)}
                className={`p-4 cursor-pointer transition-all border ${
                  isSelected
                    ? "border-2 border-[#C59B27] bg-[#C59B27]/5 dark:bg-[#C59B27]/10 shadow-xs"
                    : "border border-[#C59B27]/30 hover:border-[#C59B27]/70 bg-white dark:bg-[#06101E]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-serif font-bold text-[#0B1D33] dark:text-white leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-[#0B1D33] border-[#0B1D33] text-[#FCD34D]"
                        : "border-slate-300 dark:border-slate-700 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#C59B27]/25">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
            <ShieldCheck className="w-4 h-4 text-[#C59B27] shrink-0" />
            <span>Preferences are stored under your verified academic profile.</span>
          </div>

          <Button
            onClick={handleSave}
            disabled={!meetsRequirement || saving || loading}
            isLoading={saving}
            size="md"
            className="w-full sm:w-auto px-6 text-sm bg-[#0B1D33] text-white hover:bg-[#06101E] border border-[#C59B27]/40 hover:border-[#C59B27]"
          >
            Save & Continue to Dashboard <ArrowRight className="w-4 h-4 ml-2 text-[#FCD34D]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
