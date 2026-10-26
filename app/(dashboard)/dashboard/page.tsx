"use client";

import {withOffline} from "@/lib/offline";
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
  Receipt,
  Building,
  FileText,
  IdCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/shared/app-header";
import { PaymentProgressBar } from "@/components/ui/payment-progress-bar";
import { FeeDeadlineBanner } from "@/components/ui/fee-deadline-banner";
import { ResultsDigestAlertBanner } from "@/components/ui/results-digest-alert";
import { MorningCard } from "@/components/ui/morning-card";
import { ClassChangeAlertsBanner } from "@/components/ui/class-change-alerts";
import { getPrimaryFeeDeadlineAlert, FeeDeadlineAlert } from "@/lib/finance/deadline-alerts";
import { DEMO_FEE_STATEMENTS } from "@/lib/finance/demo-data";
import { getResultsDigestAlertAction } from "@/lib/actions/exams";
import { ResultsDigestAlert } from "@/lib/exams/types";
import { getMorningCardBriefAction, getClassChangeAlertsAction } from "@/lib/actions/daily-life";
import { MorningCardBrief, ClassChangeAlert } from "@/lib/daily-life/types";
import {
  markAnnouncementAsReadAction,
  getStudentAnnouncementsAction,
  type NoticeItem,
} from "@/lib/actions/announcements";
import {
  getStudentTodayScheduleAction,
  type TimetableEntry,
} from "@/lib/actions/academics";
import { getStudentFeeStatementsAction } from "@/lib/actions/fees";

export default function StudentDashboardPage() {
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [todaySchedule, setTodaySchedule] = React.useState<TimetableEntry[]>([]);
  const [todayDayName, setTodayDayName] = React.useState<string>("Today");
  const [loadError,setLoadError]=React.useState("");
  const [hasLoadedData,setHasLoadedData]=React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [universityName, setUniversityName] = React.useState("Your university");
  const [campusName, setCampusName] = React.useState("Your campus");
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | "P1" | "unread">("all");
  const [feeProgress, setFeeProgress] = React.useState<{
    totalBilled: number;
    totalPaid: number;
    fundingApplied: number;
    paidByStudent: number;
  }>({
    totalBilled: 69500,
    totalPaid: 45000,
    fundingApplied: 25000,
    paidByStudent: 20000,
  });
  const [deadlineAlert, setDeadlineAlert] = React.useState<FeeDeadlineAlert | null>(null);
  const [resultsAlert, setResultsAlert] = React.useState<ResultsDigestAlert | null>(null);
  const [morningBrief, setMorningBrief] = React.useState<MorningCardBrief | null>(null);
  const [classChanges, setClassChanges] = React.useState<ClassChangeAlert[]>([]);

  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [announcementsRes, scheduleRes, feeRes, resultsAlertRes, morningRes, classChangesRes] = await Promise.all([
          withOffline("getStudentAnnouncementsAction", getStudentAnnouncementsAction),
          withOffline("getStudentTodayScheduleAction", getStudentTodayScheduleAction),
          withOffline("getStudentFeeStatementsAction", getStudentFeeStatementsAction).catch(() => null),
          getResultsDigestAlertAction().catch(() => null),
          getMorningCardBriefAction().catch(() => null),
          getClassChangeAlertsAction().catch(() => null),
        ]);

        if (!ignore) {
          if (morningRes && morningRes.success && morningRes.brief) {
            setMorningBrief(morningRes.brief);
          }
          if (classChangesRes && classChangesRes.success) {
            setClassChanges(classChangesRes.alerts);
          }
          if (resultsAlertRes && resultsAlertRes.success) {
            setResultsAlert(resultsAlertRes.alert);
          }
          if(!announcementsRes.success||!scheduleRes.success)throw new Error(announcementsRes.message||scheduleRes.message||'Campus information could not be loaded.');
          setHasLoadedData(true);setLoadError('');
          if (announcementsRes.success) {
            let localReads: string[] = [];
            if (typeof window !== "undefined") {
              try {
                localReads = JSON.parse(localStorage.getItem("smu_read_notices") || "[]");
              } catch {}
            }
            const merged = announcementsRes.notices.map((n) => ({
              ...n,
              isRead: n.isRead || localReads.includes(n.id),
            }));
            setNotices(merged);
            if (announcementsRes.universityName) setUniversityName(announcementsRes.universityName);
            if (announcementsRes.campusName) setCampusName(announcementsRes.campusName);
          }
          if (scheduleRes.success) {
            setTodaySchedule(scheduleRes.entries);
            setTodayDayName(scheduleRes.dayName);
          }
          if (feeRes && feeRes.success && feeRes.statements && feeRes.statements.length > 0) {
            const latest = feeRes.statements[0];
            setFeeProgress({
              totalBilled: latest.total_billed,
              totalPaid: latest.total_paid,
              fundingApplied: latest.funding_applied ?? 0,
              paidByStudent: latest.paid_by_student ?? latest.total_paid,
            });
            setDeadlineAlert(getPrimaryFeeDeadlineAlert({ statement: latest }));
          }
        }
      } catch (err) {
        if(!ignore)setLoadError(err instanceof Error?err.message:'Campus feed is unavailable. Please reconnect and try again.');
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
      const [announcementsRes, scheduleRes, feeRes, resultsAlertRes, morningRes, classChangesRes] = await Promise.all([
        withOffline("getStudentAnnouncementsAction", getStudentAnnouncementsAction),
        withOffline("getStudentTodayScheduleAction", getStudentTodayScheduleAction),
        withOffline("getStudentFeeStatementsAction", getStudentFeeStatementsAction).catch(() => null),
        getResultsDigestAlertAction().catch(() => null),
        getMorningCardBriefAction().catch(() => null),
        getClassChangeAlertsAction().catch(() => null),
      ]);

      if (morningRes && morningRes.success && morningRes.brief) {
        setMorningBrief(morningRes.brief);
      }
      if (classChangesRes && classChangesRes.success) {
        setClassChanges(classChangesRes.alerts);
      }
      if (resultsAlertRes && resultsAlertRes.success) {
        setResultsAlert(resultsAlertRes.alert);
      }

      if(!announcementsRes.success||!scheduleRes.success)throw new Error(announcementsRes.message||scheduleRes.message||'Campus information could not be refreshed.');
      setHasLoadedData(true);setLoadError('');
      if (announcementsRes.success) {
        let localReads: string[] = [];
        if (typeof window !== "undefined") {
          try {
            localReads = JSON.parse(localStorage.getItem("smu_read_notices") || "[]");
          } catch {}
        }
        const merged = announcementsRes.notices.map((n) => ({
          ...n,
          isRead: n.isRead || localReads.includes(n.id),
        }));
        setNotices(merged);
        if (announcementsRes.universityName) setUniversityName(announcementsRes.universityName);
        if (announcementsRes.campusName) setCampusName(announcementsRes.campusName);
      }
      if (scheduleRes.success) {
        setTodaySchedule(scheduleRes.entries);
        setTodayDayName(scheduleRes.dayName);
      }
      if (feeRes && feeRes.success && feeRes.statements && feeRes.statements.length > 0) {
        const latest = feeRes.statements[0];
        setFeeProgress({
          totalBilled: latest.total_billed,
          totalPaid: latest.total_paid,
          fundingApplied: latest.funding_applied ?? 0,
          paidByStudent: latest.paid_by_student ?? latest.total_paid,
        });
        setDeadlineAlert(getPrimaryFeeDeadlineAlert({ statement: latest }));
      }
    } catch (err) {
      setLoadError(err instanceof Error?err.message:'Could not refresh campus feed.');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleMarkRead(id: string) {
    if (typeof window !== "undefined") {
      try {
        const localReads: string[] = JSON.parse(localStorage.getItem("smu_read_notices") || "[]");
        if (!localReads.includes(id)) {
          localReads.push(id);
          localStorage.setItem("smu_read_notices", JSON.stringify(localReads));
        }
      } catch {}
    }
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await markAnnouncementAsReadAction(id);
    } catch {
      // Optimistic update persisted
    }
  }

  const filteredNotices = notices.filter((n) => {
    if (selectedFilter === "P1") return n.priority === "P1";
    if (selectedFilter === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notices.filter((n) => !n.isRead).length;

  if(!loading&&loadError&&!hasLoadedData)return <div className="min-h-screen bg-[#F8FAFC]"><AppHeader universityName={universityName} campusName={campusName}/><main className="max-w-5xl mx-auto p-6 space-y-4"><h1 className="text-2xl font-bold">Campus feed unavailable</h1><p role="alert" className="rounded border border-amber-300 bg-amber-50 p-4">{loadError} No current data could be loaded.</p><Button onClick={handleRefresh} disabled={refreshing}>{refreshing?'Retrying…':'Try again'}</Button></main></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <AppHeader universityName={universityName} campusName={campusName} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {loadError&&<p role="alert" className="rounded border border-amber-300 bg-amber-50 p-4">Could not refresh: {loadError} Displaying previously loaded information; it may be out of date.</p>}

        {/* Morning Briefing Hero Card (Habit Loop) */}
        {morningBrief && <MorningCard brief={morningBrief} />}

        {/* Real-time Class Change Alerts */}
        {classChanges.length > 0 && <ClassChangeAlertsBanner alerts={classChanges} />}

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

        {/* Results Digest Alert Card (Fires once per release window) */}
        {resultsAlert && (
          <section className="pt-2">
            <ResultsDigestAlertBanner alert={resultsAlert} variant="card" />
          </section>
        )}

        {/* Fee Deadline Alert Card */}
        {deadlineAlert && (
          <section className="pt-2">
            <FeeDeadlineBanner alert={deadlineAlert} variant="card" />
          </section>
        )}

        {/* Quick Links Section */}
        <section className="pt-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/student-id" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Digital Student ID
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    NFC &amp; QR verified smart badge · Gate entry · Library.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/exams" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Exam Pass & Timetable
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Digital Exam Pass · Venue &amp; seat allocations · Paper countdown.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/fees" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors truncate">
                    Fee Statement & Clearance
                  </h4>
                  <p className="text-xs text-slate-500 font-sans truncate">
                    Track payment progress and download receipts
                  </p>
                </div>
              </div>

              {/* Compact Payment Progress Bar */}
              <PaymentProgressBar
                totalBilled={feeProgress.totalBilled}
                totalPaid={feeProgress.totalPaid}
                fundingApplied={feeProgress.fundingApplied}
                paidByStudent={feeProgress.paidByStudent}
                compact={true}
              />
            </Card>
          </Link>

          <Link href="/hostels" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Hostels & Residence
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Room B-204 · Maintenance requests · Roommate matching.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/library" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Library & Loans
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Active book loans · Due countdowns · Instant renewal · Clearance.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/units" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Unit Registration
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Semester course units · Prerequisite checks · Credit thresholds.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

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

          <Link href="/safety" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Community, Safety & Privacy
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Emergency SOS • Verified lost & found custody • KDPA data export.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/graduation" className="block group">
            <Card className="p-5 border border-[#C59B27]/30 group-hover:border-[#C59B27]/80 transition-all bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33] group-hover:text-[#C59B27] transition-colors">
                    Graduation & Vault
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Exit clearance checklist • Documents vault • Alumni • Sponsor view.
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
