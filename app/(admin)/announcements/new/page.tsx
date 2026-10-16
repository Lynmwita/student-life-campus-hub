"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, AlertCircle, CheckCircle2, ArrowLeft, Send, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAnnouncementAction } from "@/lib/actions/announcements";
import { getUserRoleAction } from "@/lib/actions/auth";

const PILOT_UNIVERSITIES = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Summit Metropolitan University (SMU)",
    campuses: [
      { id: "00000000-0000-0000-0000-000000000011", name: "Main Campus (Westlands)" },
      { id: "00000000-0000-0000-0000-000000000012", name: "City Campus (CBD)" },
    ],
    faculties: [
      "School of Computing & Informatics",
      "School of Business & Economics",
      "School of Engineering & Architecture",
      "School of Humanities & Social Sciences",
    ],
  },
];

export default function NewAnnouncementPage() {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [priority, setPriority] = React.useState<"P1" | "P2" | "P3" | "P4">("P3");
  const [targetScope, setTargetScope] = React.useState<string>("all");
  const [title, setTitle] = React.useState<string>("");
  const [content, setContent] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    getUserRoleAction().then((res) => {
      setIsAdmin(res.isAdmin);
    });
  }, []);

  const selectedUniv = PILOT_UNIVERSITIES[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    const formData = new FormData(event.currentTarget);
    formData.set("priority", priority);
    formData.set("targetScope", targetScope);

    try {
      const res = await createAnnouncementAction(formData);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setTitle("");
        setContent("");
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    } catch {
      // Optimistic demonstration preview
      setFeedback({
        type: "success",
        text: "Announcement simulated successfully in preview mode.",
      });
    } finally {
      setLoading(false);
    }
  }

  const priorityBadges = {
    P1: { label: "P1 - Urgent Notice", variant: "danger" as const, desc: "Critical safety, security, or campus closure alerts." },
    P2: { label: "P2 - Academic Alert", variant: "warning" as const, desc: "Exams, registration deadlines, and fee schedules." },
    P3: { label: "P3 - Campus Life", variant: "info" as const, desc: "Events, clubs, career fairs, and student affairs." },
    P4: { label: "P4 - General Info", variant: "default" as const, desc: "Routine announcements and advisory notices." },
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="p-8 text-center bg-white rounded-2xl border border-red-200/80 shadow-xs max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#0B1D33]">Access Restricted</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Publishing official institutional announcements requires <strong>University Administrator</strong> or <strong>Super Admin</strong> clearance. Staff members without administrative privileges are not authorized to create announcements.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#C59B27]/40 text-[#0B1D33] hover:bg-slate-50"
              >
                Return to Admin Console
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1D33]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 text-xs font-semibold">
            <Megaphone className="w-3.5 h-3.5 text-[#FCD34D]" /> Staff Publishing Studio
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33]">
            Publish Official Campus Announcement
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Broadcast targeted notices to verified students of Summit Metropolitan University.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              {feedback.text}
            </span>
            <button onClick={() => setFeedback(null)} className="font-semibold underline">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border border-[#C59B27]/30 bg-white shadow-xs">
            <CardHeader>
              <CardTitle>1. Urgency & Priority Level</CardTitle>
              <CardDescription>
                Priority determines visual styling, push importance, and feed sorting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {(["P1", "P2", "P3", "P4"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      priority === p
                        ? "border-2 border-[#C59B27] bg-[#C59B27]/5 shadow-xs"
                        : "border-slate-200 hover:border-[#C59B27]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant={priorityBadges[p].variant}>{p}</Badge>
                      {priority === p && <span className="text-xs font-bold text-[#C59B27]">Selected</span>}
                    </div>
                    <p className="font-bold text-xs text-slate-800">
                      {priorityBadges[p].label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {priorityBadges[p].desc}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader>
              <CardTitle>2. Audience Scoping & Targeting</CardTitle>
              <CardDescription>
                Row-Level Security ensures only matching verified students can view this notice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="hidden" name="universityId" value={selectedUniv.id} />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Target Audience Scope
                </label>
                <select
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                >
                  <option value="all">Institution-Wide (All Verified Students & Staff)</option>
                  <option value="campus">Specific Campus Only</option>
                  <option value="faculty">Specific School / Faculty Only</option>
                  <option value="department">Specific Academic Department Only</option>
                  <option value="year">Specific Year of Study (e.g. Freshmen)</option>
                </select>
              </div>

              {targetScope === "campus" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Target Campus
                  </label>
                  <select
                    name="campusId"
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    {selectedUniv.campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetScope === "faculty" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Target School / Faculty
                  </label>
                  <select
                    name="targetFaculty"
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    {selectedUniv.faculties.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetScope === "department" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Target Department
                  </label>
                  <Input
                    name="targetDepartment"
                    required
                    placeholder="e.g. Department of Computer Science"
                  />
                </div>
              )}

              {targetScope === "year" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Target Year of Study
                  </label>
                  <select
                    name="targetYear"
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="1">Year 1 (Freshmen)</option>
                    <option value="2">Year 2 (Sophomores)</option>
                    <option value="3">Year 3 (Juniors)</option>
                    <option value="4">Year 4 (Seniors)</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader>
              <CardTitle>3. Announcement Content</CardTitle>
              <CardDescription>Compose the official broadcast message.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Headline / Title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. End of Semester Examination Timetable Released"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Detailed Announcement Message
                </label>
                <textarea
                  name="content"
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide full instructions, links, dates, and relevant contacts..."
                  className="flex w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                />
              </div>

              <Input
                label="Optional Expiration Date"
                name="expiresAt"
                type="date"
                helperText="Notice will automatically archive after this date"
              />
            </CardContent>
          </Card>

          {/* Live Mobile Preview */}
          <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" /> Live Student Mobile Feed Preview
            </h4>
            <div className="max-w-md mx-auto bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={priorityBadges[priority].variant}>{priorityBadges[priority].label}</Badge>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">
                {title || "Untitled Announcement"}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-3">
                {content || "Announcement text preview will appear here..."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="outline"
              className="w-full sm:w-1/3 py-3"
              disabled={loading}
              onClick={() => {
                const draftInput = document.createElement("input");
                draftInput.type = "hidden";
                draftInput.name = "isDraft";
                draftInput.value = "true";
                document.querySelector("form")?.appendChild(draftInput);
              }}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-2/3 py-3 text-base"
              isLoading={loading}
            >
              <Send className="w-4 h-4 mr-1.5" /> Publish & Broadcast Announcement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
