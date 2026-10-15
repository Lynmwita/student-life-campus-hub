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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            Mandatory Student Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Select Your Campus Interests
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Your university account is active. Choose at least 3 areas of interest to tailor
            official broadcasts, academic schedules, and student communities to your preferences.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Counter and Requirements Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span>Selected:</span>
            <span
              className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                meetsRequirement
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {selectedInterests.length} of {CANONICAL_INTERESTS.length}
            </span>
            <span className="text-slate-400">(minimum 3 required)</span>
          </div>

          <div>
            {meetsRequirement ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="w-3 h-3" /> Requirement Met
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
                    ? "border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
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
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Preferences are stored under your verified academic profile.</span>
          </div>

          <Button
            onClick={handleSave}
            disabled={!meetsRequirement || saving || loading}
            isLoading={saving}
            size="md"
            className="w-full sm:w-auto px-6 text-sm"
          >
            Save & Continue to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
