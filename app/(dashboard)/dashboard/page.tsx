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
  Sparkles,
  PlusCircle,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  markAnnouncementAsReadAction,
  getStudentAnnouncementsAction,
  type NoticeItem,
} from "@/lib/actions/announcements";

export default function StudentDashboardPage() {
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [universityName, setUniversityName] = React.useState("Summit Metropolitan University");
  const [campusName, setCampusName] = React.useState("Main Campus (Westlands)");
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | "P1" | "unread">("all");

  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const res = await getStudentAnnouncementsAction();
        if (!ignore && res.success) {
          setNotices(res.notices);
          if (res.universityName) setUniversityName(res.universityName);
          if (res.campusName) setCampusName(res.campusName);
        }
      } catch (err) {
        console.error("Failed to load dashboard announcements", err);
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
      const res = await getStudentAnnouncementsAction();
      if (res.success) {
        setNotices(res.notices);
        if (res.universityName) setUniversityName(res.universityName);
        if (res.campusName) setCampusName(res.campusName);
      }
    } catch (err) {
      console.error("Failed to refresh dashboard announcements", err);
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
      {/* Top Mobile Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
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
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
                <PlusCircle className="w-3.5 h-3.5 mr-1 text-blue-600" /> Post Notice
              </Button>
            </Link>
            <Link href="/verifications">
              <Button variant="outline" size="sm" className="text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Staff Queue
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Student Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-600/15">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Verified Student Portal
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Student Life & Campus Hub
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 max-w-lg">
                Your official broadcast feed is active. You have <strong>{unreadCount} unread university notices</strong> tailored to your institution.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/10">
                <span className="block text-sm font-bold text-emerald-300">Active</span>
                <span className="text-[10px] uppercase font-bold text-blue-200">Verified</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/10">
                <span className="block text-2xl font-black">{unreadCount}</span>
                <span className="text-[10px] uppercase font-bold text-blue-200">Alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Timetable Roadmap Status (Phase 5) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Academic Timetable & Schedule
            </h3>
            <Badge variant="warning">Coming in Phase 5</Badge>
          </div>

          <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Personalized Lecture Schedules
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    Phase 5
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                  Your daily course unit timetable, lecture halls, and instructor details will sync automatically once faculty course schedules are released in Phase 5.
                </p>
              </div>
              <div className="shrink-0 text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" /> Phase 5 Roadmap
              </div>
            </div>
          </Card>
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
                🚨 Urgent (P1)
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
                        ? "border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-md shadow-red-500/5"
                        : !notice.isRead
                        ? "border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10"
                        : "border-slate-200/80 dark:border-slate-800 opacity-90"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isP1 ? (
                            <Badge variant="danger" className="animate-pulse">
                              🚨 P1 Urgent
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
      </main>
    </div>
  );
}
