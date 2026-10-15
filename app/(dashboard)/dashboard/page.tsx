"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Megaphone,
  CheckCircle,
  PlusCircle,
  ShieldCheck,
  RotateCw,
  BookOpen,
  Users,
  ArrowRight,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  markAnnouncementAsReadAction,
  getStudentAnnouncementsAction,
  type NoticeItem,
} from "@/lib/actions/announcements";
import {
  getStudentTodayScheduleAction,
  type TimetableEntry,
} from "@/lib/actions/academics";

export default function StudentDashboardPage() {
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [todaySchedule, setTodaySchedule] = React.useState<TimetableEntry[]>([]);
  const [todayDayName, setTodayDayName] = React.useState<string>("Today");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [universityName, setUniversityName] = React.useState("Summit Metropolitan University");
  const [campusName, setCampusName] = React.useState("Main Campus (Westlands)");
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | "P1" | "unread">("all");

  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [announcementsRes, scheduleRes] = await Promise.all([
          getStudentAnnouncementsAction(),
          getStudentTodayScheduleAction(),
        ]);

        if (!ignore) {
          if (announcementsRes.success) {
            setNotices(announcementsRes.notices);
            if (announcementsRes.universityName) setUniversityName(announcementsRes.universityName);
            if (announcementsRes.campusName) setCampusName(announcementsRes.campusName);
          }
          if (scheduleRes.success) {
            setTodaySchedule(scheduleRes.entries);
            setTodayDayName(scheduleRes.dayName);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
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
      const [announcementsRes, scheduleRes] = await Promise.all([
        getStudentAnnouncementsAction(),
        getStudentTodayScheduleAction(),
      ]);

      if (announcementsRes.success) {
        setNotices(announcementsRes.notices);
        if (announcementsRes.universityName) setUniversityName(announcementsRes.universityName);
        if (announcementsRes.campusName) setCampusName(announcementsRes.campusName);
      }
      if (scheduleRes.success) {
        setTodaySchedule(scheduleRes.entries);
        setTodayDayName(scheduleRes.dayName);
      }
    } catch (err) {
      console.error("Failed to refresh dashboard data", err);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markAnnouncementAsReadAction(id);
    } catch {
      // Optimistic update
    }
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  const filteredNotices = notices.filter((n) => {
    if (selectedFilter === "P1") return n.priority === "P1";
    if (selectedFilter === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notices.filter((n) => !n.isRead).length;

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

          <div className="flex items-center gap-2">
            <Link href="/announcements/new">
              <Button variant="outline" size="sm" className="text-xs">
                <PlusCircle className="w-3.5 h-3.5 mr-1 text-blue-600" /> Post Notice
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4 text-xs font-semibold overflow-x-auto py-2.5">
          <Link
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1.5 flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Campus Feed
          </Link>
          <Link
            href="/timetable"
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors pb-1.5 flex items-center gap-1.5"
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
        {/* Student Welcome Banner */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 text-blue-300 text-xs font-semibold border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Verified Student Portal
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Student Life & Campus Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Your campus portal is connected. You have <strong>{unreadCount} unread notices</strong> and live lecture scheduling for your campus.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-800/80 px-4 py-3 rounded-xl text-center border border-slate-700">
                <span className="block text-sm font-bold text-emerald-400">Active</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Verified</span>
              </div>
              <div className="bg-slate-800/80 px-4 py-3 rounded-xl text-center border border-slate-700">
                <span className="block text-2xl font-black text-white">{unreadCount}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Academic Timetable: Today's Schedule */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Today&apos;s Lecture Schedule ({todayDayName})
              </h3>
              {todaySchedule.length > 0 && (
                <Badge variant="info">{todaySchedule.length} Lecture{todaySchedule.length > 1 ? "s" : ""}</Badge>
              )}
            </div>
            <Link
              href="/timetable"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <Card className="p-6 animate-pulse bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            </Card>
          ) : todaySchedule.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No Lectures Scheduled for {todayDayName}
                    </span>
                    <Badge variant="default">Free Study Day</Badge>
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    You have no official classes scheduled for today. You can view your full weekly schedule or explore upcoming campus events and clubs.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/timetable">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" /> View Weekly Timetable
                    </Button>
                  </Link>
                  <Link href="/campus-life">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Campus Life
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {todaySchedule.map((entry) => (
                <Card
                  key={entry.id}
                  className="p-4 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                        {entry.code}
                      </span>
                      <span className="text-xs text-slate-400">
                        {entry.creditHours} Credits
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-slate-500" /> {entry.startTime} - {entry.endTime}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mb-1">
                    {entry.name}
                  </h4>

                  <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{entry.venue}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{entry.lecturerName}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Priority Announcements Feed */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-blue-600" />
                Targeted Campus Broadcasts
              </h3>
              {unreadCount > 0 && <Badge variant="danger">{unreadCount} New</Badge>}
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All Notices
              </button>
              <button
                onClick={() => setSelectedFilter("P1")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedFilter === "P1"
                    ? "bg-white dark:bg-slate-900 text-red-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Urgent (P1)
              </button>
              <button
                onClick={() => setSelectedFilter("unread")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedFilter === "unread"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Unread
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Refresh broadcast feed"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            </Button>
          </div>

          <div className="space-y-3">
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
            ) : notices.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    No official broadcasts at this time
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    When university administration, campus deans, or department coordinators post notices for your group, they will appear here in real-time.
                  </p>
                  <div className="pt-2">
                    <Link href="/announcements/new">
                      <Button variant="outline" size="sm" className="text-xs">
                        <PlusCircle className="w-3.5 h-3.5 mr-1 text-blue-600" /> Post Campus Broadcast
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : filteredNotices.length === 0 ? (
              <Card className="border-dashed border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500">
                No announcements matching the selected filter.
              </Card>
            ) : (
              filteredNotices.map((notice) => {
                const isP1 = notice.priority === "P1";
                return (
                  <Card
                    key={notice.id}
                    className={`transition-all ${
                      isP1
                        ? "border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20"
                        : !notice.isRead
                        ? "border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10"
                        : "border-slate-200/80 dark:border-slate-800 opacity-90"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isP1 ? (
                            <Badge variant="danger">
                              P1 Urgent
                            </Badge>
                          ) : notice.priority === "P2" ? (
                            <Badge variant="warning">P2 Academic</Badge>
                          ) : notice.priority === "P3" ? (
                            <Badge variant="info">P3 Campus</Badge>
                          ) : (
                            <Badge variant="default">P4 Notice</Badge>
                          )}

                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {notice.targetScope}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {notice.publishedAt}
                          </span>
                        </div>

                        <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                          {notice.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {notice.content}
                        </p>
                      </div>

                      <div className="shrink-0 pt-2 sm:pt-0">
                        {!notice.isRead ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkRead(notice.id)}
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark as Read
                          </Button>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" /> Read
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="pt-2 grid sm:grid-cols-2 gap-4">
          <Link href="/timetable" className="block group">
            <Card className="p-5 border-slate-200/90 dark:border-slate-800 group-hover:border-blue-400 dark:group-hover:border-blue-700 transition-all bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Weekly Timetable Schedules
                  </h4>
                  <p className="text-xs text-slate-500">
                    View lecture halls, times, and faculty instructors for Monday - Friday.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/campus-life" className="block group">
            <Card className="p-5 border-slate-200/90 dark:border-slate-800 group-hover:border-emerald-400 dark:group-hover:border-emerald-700 transition-all bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    Clubs, Communities & Events
                  </h4>
                  <p className="text-xs text-slate-500">
                    Discover campus student groups, workshops, hackathons, and activities.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </section>
      </main>
    </div>
  );
}
