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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                {universityName}
              </h1>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-500" /> {campusName}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4 text-xs font-semibold overflow-x-auto py-2.5">
          <Link
            href="/dashboard"
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors pb-1.5 flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Campus Feed
          </Link>
          <Link
            href="/timetable"
            className="text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1.5 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> Weekly Timetable
          </Link>
          <Link
            href="/campus-life"
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors pb-1.5 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" /> Campus Life & Clubs
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-200 font-semibold">Weekly Timetable</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Academic Class Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Official faculty lecture schedules, hall venues, and instructor assignments for Semester 1, 2026/2027.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="info">Semester 1</Badge>
            <Badge variant="default">2026/2027</Badge>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {DAYS.map((day) => {
            const count = entries.filter((e) => e.dayOfWeek === day.id).length;
            const isSelected = selectedDay === day.id;

            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <span>{day.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected
                        ? "bg-white/20 text-white"
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {selectedDayMeta.name} Classes ({dayEntries.length} Unit{dayEntries.length === 1 ? "" : "s"})
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6 animate-pulse bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3" />
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                </Card>
              ))}
            </div>
          ) : dayEntries.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  No Classes Scheduled for {selectedDayMeta.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Enjoy your independent study, lab project research, or explore campus life clubs.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {dayEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className="p-5 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900 transition-all bg-white dark:bg-slate-900 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                          {entry.code}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {entry.creditHours} Credit Hours
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          Year {entry.yearOfStudy}
                        </span>
                        {entry.department && (
                          <span className="text-[11px] text-slate-400">
                            Dept: {entry.department}
                          </span>
                        )}
                      </div>

                      <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                        {entry.name}
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Venue: <strong>{entry.venue}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Lecturer: <strong>{entry.lecturerName}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-2 sm:pt-0">
                      <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
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
