"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Megaphone,
  RotateCw,
  BookOpen,
  Compass,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getStudentWeeklyTimetableAction,
  type TimetableEntry,
} from "@/lib/actions/academics";

const DAYS: Array<{ id: number; name: string; short: string }> = [
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
];

export default function TimetablePage() {
  const [entries, setEntries] = React.useState<TimetableEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [universityName, setUniversityName] = React.useState("Summit Metropolitan University");
  const [campusName, setCampusName] = React.useState("Main Campus (Westlands)");

  // Default to today's day of week (Monday if weekend)
  const currentJsDay = typeof window !== "undefined" ? new Date().getDay() : 1;
  const initialDay = currentJsDay >= 1 && currentJsDay <= 6 ? currentJsDay : 1;
  const [selectedDay, setSelectedDay] = React.useState<number>(initialDay);

  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const res = await getStudentWeeklyTimetableAction();
        if (!ignore && res.success) {
          setEntries(res.entries);
          if (res.universityName) setUniversityName(res.universityName);
          if (res.campusName) setCampusName(res.campusName);
        }
      } catch (err) {
        console.error("Failed to load timetable", err);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await getStudentWeeklyTimetableAction();
      if (res.success) {
        setEntries(res.entries);
        if (res.universityName) setUniversityName(res.universityName);
        if (res.campusName) setCampusName(res.campusName);
      }
    } catch (err) {
      console.error("Failed to refresh timetable", err);
    } finally {
      setRefreshing(false);
    }
  }

  const dayEntries = entries.filter((e) => e.dayOfWeek === selectedDay);
  const selectedDayMeta = DAYS.find((d) => d.id === selectedDay) || DAYS[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#06101E] pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0B1D33] text-white border-b border-[#06101E] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#06101E] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-sm text-white leading-tight">
                {universityName}
              </h1>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 font-sans">
                <MapPin className="w-3 h-3 text-[#FCD34D]" /> {campusName}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-xs border-[#C59B27]/40 text-[#FCD34D] hover:bg-[#06101E] hover:border-[#C59B27]"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin text-[#FCD34D]" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-[#06101E] border-b border-[#C59B27]/20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-xs font-semibold overflow-x-auto py-2.5">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-white transition-colors pb-1 flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Campus Feed
          </Link>
          <Link
            href="/timetable"
            className="text-[#FCD34D] border-b-2 border-[#C59B27] pb-1 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-[#FCD34D]" /> Weekly Timetable
          </Link>
          <Link
            href="/campus-life"
            className="text-slate-400 hover:text-white transition-colors pb-1 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" /> Campus Life & Clubs
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C59B27]/20 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[#0B1D33] dark:text-slate-200 font-semibold">Weekly Timetable</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] dark:text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-[#C59B27]" />
              Academic Timetable
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Official faculty lecture schedules • Hall venues • Instructor assignments • Semester 1, 2026/2027
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="info">Semester 1</Badge>
            <Badge variant="default">2026/2027</Badge>
          </div>
        </div>

        {/* Day Selector Tabs with solid gold indicator bar */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-[#C59B27]/25 overflow-x-auto pb-1">
          {DAYS.map((day) => {
            const count = entries.filter((e) => e.dayOfWeek === day.id).length;
            const isSelected = selectedDay === day.id;

            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`pb-2.5 text-xs sm:text-sm font-serif font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  isSelected
                    ? "text-[#0B1D33] dark:text-[#FCD34D] border-b-2 border-[#C59B27]"
                    : "text-slate-500 hover:text-[#0B1D33] dark:hover:text-slate-200"
                }`}
              >
                <span>{day.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isSelected
                        ? "bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[#0B1D33] dark:text-slate-200">
              {selectedDayMeta.name} Classes • {dayEntries.length} Unit{dayEntries.length === 1 ? "" : "s"}
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6 animate-pulse bg-white border-[#C59B27]/20">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3" />
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                </Card>
              ))}
            </div>
          ) : dayEntries.length === 0 ? (
            <Card className="border border-[#C59B27]/30 p-8 text-center bg-white dark:bg-[#06101E]">
              <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D]">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-[#0B1D33] dark:text-slate-200">
                  No Classes Scheduled for {selectedDayMeta.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Enjoy your independent study, lab research, or explore campus life clubs.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {dayEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className="p-5 border border-[#C59B27]/30 hover:border-[#C59B27]/70 transition-all bg-white dark:bg-[#06101E] shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0B1D33] dark:text-[#FCD34D] bg-[#0B1D33]/5 dark:bg-white/10 border border-[#C59B27]/30 px-2 py-0.5 rounded">
                          {entry.code}
                        </span>
                        <span className="text-xs text-slate-500 font-sans">
                          {entry.creditHours} Credit Hours • Year {entry.yearOfStudy}
                        </span>
                        {entry.department && (
                          <span className="text-[11px] text-slate-400 font-sans">
                            • {entry.department}
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif font-bold text-base text-[#0B1D33] dark:text-white leading-snug">
                        {entry.name}
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-[#C59B27]/15 font-sans">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                          <span>Venue • <strong>{entry.venue}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                          <span>Lecturer • <strong>{entry.lecturerName}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-2 sm:pt-0">
                      <div className="inline-flex items-center gap-1.5 bg-[#0B1D33] text-[#FCD34D] font-mono text-xs font-bold px-3 py-1.5 rounded-lg border border-[#C59B27]/40 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-[#FCD34D]" />
                        {entry.startTime} - {entry.endTime}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
