"use client";

import * as React from "react";
import { Building2, School, BookOpen, FileCheck, ArrowRight, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { submitOnboardingAction } from "@/lib/actions/auth";

// Preset institutions matching seed.sql
const UNIVERSITIES = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Summit Metropolitan University (SMU)",
    campuses: [
      { id: "00000000-0000-0000-0000-000000000011", name: "Main Campus (Westlands, Nairobi)" },
      { id: "00000000-0000-0000-0000-000000000012", name: "City Campus (Nairobi CBD)" },
    ],
    faculties: [
      "School of Computing & Informatics",
      "School of Business & Economics",
      "School of Engineering & Architecture",
      "School of Humanities & Social Sciences",
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Zetech University (ZU)",
    campuses: [
      { id: "00000000-0000-0000-0000-000000000021", name: "Technology Park Campus (Mang'u)" },
      { id: "00000000-0000-0000-0000-000000000022", name: "Ruiru Campus (Ruiru)" },
    ],
    faculties: [
      "Faculty of ICT & Media Studies",
      "Faculty of Business & Education",
      "Faculty of Engineering & Technology",
    ],
  },
];

export default function OnboardingPage() {
  const [selectedUnivId, setSelectedUnivId] = React.useState<string>(UNIVERSITIES[0].id);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const selectedUniv = UNIVERSITIES.find((u) => u.id === selectedUnivId) || UNIVERSITIES[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      const res = await submitOnboardingAction(formData);
      if (res && !res.success && res.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("An unexpected error occurred. Please verify your details.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            Step 2: Campus Affiliation & Verification
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Set Up Your Student Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Link your account to your university and campus to unlock official announcements and schedules.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <CardHeader>
            <CardTitle>Academic Enrollment Details</CardTitle>
            <CardDescription>
              This information will be verified by your university administration.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Institution Selection */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-blue-600" />
                  1. University & Campus
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      University
                    </label>
                    <select
                      name="universityId"
                      value={selectedUnivId}
                      onChange={(e) => setSelectedUnivId(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {UNIVERSITIES.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Primary Campus
                    </label>
                    <select
                      name="campusId"
                      required
                      className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {selectedUniv.campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Academic Credentials */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  2. Course & Registration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Registration Number"
                    name="registrationNumber"
                    required
                    placeholder="e.g. SMU/BCS/2024/0142"
                    helperText="Official student ID / reg number"
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Year of Study
                    </label>
                    <select
                      name="yearOfStudy"
                      required
                      className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">Year 1 (Freshman)</option>
                      <option value="2">Year 2 (Sophomore)</option>
                      <option value="3">Year 3 (Junior)</option>
                      <option value="4">Year 4 (Senior)</option>
                      <option value="5">Year 5 (Professional / Engineering)</option>
                      <option value="6">Year 6 (Medicine)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Faculty / School
                    </label>
                    <select
                      name="faculty"
                      required
                      className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {selectedUniv.faculties.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Department"
                    name="department"
                    required
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <Input
                  label="Program of Study"
                  name="programOfStudy"
                  required
                  placeholder="e.g. Bachelor of Science in Computer Science"
                />
              </div>

              {/* Verification Attachment / Link */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  3. Verification Proof (Optional)
                </h3>

                <Input
                  label="Student ID Card / Admission Letter URL"
                  name="idDocumentUrl"
                  type="url"
                  placeholder="https://drive.google.com/... or cloud document link"
                  helperText="Optional link to student ID card to accelerate approval"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  After submitting, your profile will enter <strong>Pending Verification</strong>. University staff will confirm your registration before granting access to confidential broadcasts.
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full text-base py-3"
                isLoading={loading}
              >
                Submit Student Profile for Verification <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
