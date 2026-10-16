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
  LifeBuoy,
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
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
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

          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-[#06101E]"
              >
                Staff Console
              </Button>
            </Link>
            <Link href="/announcements/new">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#C59B27]/40 text-[#FCD34D] hover:bg-[#06101E] hover:border-[#C59B27]"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1 text-[#FCD34D]" /> Post Notice
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-[#06101E] border-b border-[#C59B27]/20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-xs font-semibold overflow-x-auto py-2.5">
          <Link
            href="/dashboard"
            className="text-[#FCD34D] border-b-2 border-[#C59B27] pb-1 flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5 text-[#FCD34D]" /> Campus Feed
          </Link>
          <Link
            href="/timetable"
            className="text-slate-400 hover:text-white transition-colors pb-1 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> Weekly Timetable
          </Link>
          <Link
            href="/campus-life"
            className="text-slate-400 hover:text-white transition-colors pb-1 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" /> Campus Life & Clubs
          </Link>
          <Link
            href="/help-desk"
            className="text-slate-400 hover:text-white transition-colors pb-1 flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Help Desk & Inquiries
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Student Welcome Banner */}
        <div className="rounded-xl bg-gradient-to-r from-[#0B1D33] to-[#06101E] border border-[#C59B27]/30 p-6 sm:p-8 text-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#06101E] text-[#FCD34D] text-xs font-semibold border border-[#C59B27]/40">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FCD34D]" />
                Institutional Student Portal
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
                Student Life & Campus Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg font-sans">
                Official institutional communications • <strong>{unreadCount} unread notice{unreadCount === 1 ? "" : "s"}</strong> • Live lecture scheduling for {campusName}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-[#0B1D33]/90 px-4 py-3 rounded-lg text-center border border-[#C59B27]/30">
                <span className="block text-sm font-bold text-[#FCD34D]">Active</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Verified</span>
              </div>
              <div className="bg-[#0B1D33]/90 px-4 py-3 rounded-lg text-center border border-[#C59B27]/30">
                <span className="block text-2xl font-black font-serif text-white">{unreadCount}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Academic Timetable: Today's Schedule */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#0B1D33] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#C59B27]" />
                Today&apos;s Lecture Schedule • {todayDayName}
              </h3>
              {todaySchedule.length > 0 && (
                <Badge variant="info">{todaySchedule.length} Lecture{todaySchedule.length > 1 ? "s" : ""}</Badge>
              )}
            </div>
            <Link
              href="/timetable"
              className="text-xs font-serif font-bold text-[#C59B27] hover:underline flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <Card className="p-6 animate-pulse bg-white border-[#C59B27]/20">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-full" />
            </Card>
          ) : todaySchedule.length === 0 ? (
            <Card className="border border-[#C59B27]/30 p-6 bg-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-[#0B1D33]">
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
                    <Button variant="outline" size="sm" className="text-xs border-[#C59B27]/40 text-[#0B1D33]">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-[#C59B27]" /> Weekly Timetable
                    </Button>
                  </Link>
                  <Link href="/campus-life">
                    <Button variant="outline" size="sm" className="text-xs border-[#C59B27]/40 text-[#0B1D33]">
                      <Users className="w-3.5 h-3.5 mr-1 text-[#C59B27]" /> Campus Life
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
                  className="p-4 border border-[#C59B27]/30 hover:border-[#C59B27]/70 transition-all bg-white shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0B1D33] bg-[#0B1D33]/5 border border-[#C59B27]/30 px-2 py-0.5 rounded">
                        {entry.code}
                      </span>
                      <span className="text-xs text-slate-500 font-sans">
                        {entry.creditHours} Credits
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#0B1D33] flex items-center gap-1 bg-[#0B1D33]/5 px-2 py-0.5 rounded border border-[#C59B27]/20">
                      <Clock className="w-3 h-3 text-[#C59B27]" /> {entry.startTime} - {entry.endTime}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] leading-snug mb-1">
                    {entry.name}
                  </h4>

                  <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-[#C59B27]/15 mt-2 font-sans">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                      <span className="font-medium text-slate-700">{entry.venue}</span>
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
              <h3 className="font-serif font-bold text-sm text-[#0B1D33] flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-[#C59B27]" />
                Targeted Campus Broadcasts
              </h3>
              {unreadCount > 0 && <Badge variant="danger">{unreadCount} New</Badge>}
            </div>

            {/* Filter buttons with solid gold indicator style */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs border border-slate-200">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  selectedFilter === "all"
                    ? "bg-[#0B1D33] text-[#FCD34D] shadow-xs border border-[#C59B27]/40"
                    : "text-slate-600 hover:text-[#0B1D33]"
                }`}
              >
                All Notices
              </button>
              <button
                onClick={() => setSelectedFilter("P1")}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  selectedFilter === "P1"
                    ? "bg-red-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-red-700"
                }`}
              >
                Urgent (P1)
              </button>
              <button
                onClick={() => setSelectedFilter("unread")}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  selectedFilter === "unread"
                    ? "bg-[#0B1D33] text-[#FCD34D] shadow-xs border border-[#C59B27]/40"
                    : "text-slate-600 hover:text-[#0B1D33]"
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
              className="h-8 px-2.5 text-xs border-[#C59B27]/40 text-[#FCD34D] hover:bg-[#06101E]"
              title="Refresh broadcast feed"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#FCD34D]" : ""}`} />
            </Button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6 animate-pulse bg-white border-[#C59B27]/20">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                  </Card>
                ))}
              </div>
            ) : notices.length === 0 ? (
              <Card className="border border-[#C59B27]/30 p-8 text-center bg-white">
                <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-xl bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-[#0B1D33] text-sm">
                    No Official Broadcasts at This Time
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    When university administration, campus deans, or department coordinators post notices for your group, they will appear here in real-time.
                  </p>
                  <div className="pt-2">
                    <Link href="/announcements/new">
                      <Button variant="outline" size="sm" className="text-xs border-[#C59B27]/40 text-[#0B1D33]">
                        <PlusCircle className="w-3.5 h-3.5 mr-1 text-[#C59B27]" /> Post Campus Broadcast
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : filteredNotices.length === 0 ? (
              <Card className="border border-[#C59B27]/30 p-6 text-center text-xs text-slate-500 bg-white">
                No announcements matching the selected filter.
              </Card>
            ) : (
              filteredNotices.map((notice) => {
                const isP1 = notice.priority === "P1";
                return (
                  <Card
                    key={notice.id}
                    className={`transition-all bg-white ${
                      isP1
                        ? "border-2 border-red-800/80 bg-red-50/20"
                        : !notice.isRead
                        ? "border border-[#C59B27]/50 shadow-xs"
                        : "border border-[#C59B27]/25 opacity-90"
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

                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {notice.targetScope}
                          </span>

                          <span className="text-[11px] text-slate-400 font-sans">
                            • {notice.publishedAt}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-base text-[#0B1D33] leading-snug">
                          {notice.title}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          {notice.content}
                        </p>
                      </div>

                      <div className="shrink-0 pt-2 sm:pt-0">
                        {!notice.isRead ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkRead(notice.id)}
                            className="text-xs text-[#0B1D33] border-[#C59B27]/40 hover:bg-[#0B1D33]/5"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-[#C59B27]" /> Mark as Read
                          </Button>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 font-sans">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Read
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
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Weekly Timetable Schedules
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    View lecture halls • Times • Faculty instructors for Monday - Friday.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/campus-life" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Clubs, Communities & Events
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Discover campus student groups • Workshops • Hackathons • Activities.
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
