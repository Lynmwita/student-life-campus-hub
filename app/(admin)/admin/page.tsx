"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shield,
  LifeBuoy,
  Megaphone,
  RefreshCw,
  Lock,
  PlusCircle,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getStaffTicketQueueAction,
  updateTicketStatusAction,
  type TicketItem,
} from "@/lib/actions/helpdesk";
import { getAuditLogsAction, type AuditLogEntry } from "@/lib/actions/audit";
import { syncUamsDataAction, type UamsSyncResponse } from "@/lib/actions/sync";
import { getStudentAnnouncementsAction, type NoticeItem } from "@/lib/actions/announcements";

export default function StaffAdminPanelPage() {
  const [activeTab, setActiveTab] = React.useState<"queue" | "bulletins" | "sync" | "audit">("queue");
  const [tickets, setTickets] = React.useState<TicketItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [queueFilter, setQueueFilter] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);

  // Status update modal state
  const [selectedTicket, setSelectedTicket] = React.useState<TicketItem | null>(null);
  const [newStatus, setNewStatus] = React.useState<string>("in_progress");
  const [statusMessage, setStatusMessage] = React.useState<string>("");
  const [resolutionNotes, setResolutionNotes] = React.useState<string>("");
  const [statusLoading, setStatusLoading] = React.useState<boolean>(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = React.useState<string | null>(null);

  // Sync state
  const [isDryRun, setIsDryRun] = React.useState(true);
  const [syncLoading, setSyncLoading] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<UamsSyncResponse | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    async function loadInitialData() {
      try {
        const [ticketsRes, auditRes, noticesRes] = await Promise.all([
          getStaffTicketQueueAction(),
          getAuditLogsAction(),
          getStudentAnnouncementsAction(),
        ]);
        if (!ignore) {
          if (ticketsRes.success) setTickets(ticketsRes.tickets);
          if (auditRes.success) setAuditLogs(auditRes.logs);
          if (noticesRes.success) setNotices(noticesRes.notices);
        }
      } catch (err) {
        console.error("Failed to load staff console data", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadInitialData();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleRefreshQueue() {
    setLoading(true);
    try {
      const res = await getStaffTicketQueueAction({ status: queueFilter });
      if (res.success) setTickets(res.tickets);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatusSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTicket) return;

    setStatusLoading(true);
    setStatusError(null);
    setStatusSuccess(null);

    const formData = new FormData();
    formData.set("ticketId", selectedTicket.id);
    formData.set("status", newStatus);
    formData.set("message", statusMessage || `Status changed to ${newStatus.replace("_", " ")}`);
    formData.set("resolutionNotes", resolutionNotes);
    formData.set("isInternal", "false");

    try {
      const res = await updateTicketStatusAction(formData);
      if (res.success) {
        setStatusSuccess(res.message);
        // Refresh queue
        const refreshed = await getStaffTicketQueueAction();
        if (refreshed.success) setTickets(refreshed.tickets);
        // Refresh audit logs
        const auditRefreshed = await getAuditLogsAction();
        if (auditRefreshed.success) setAuditLogs(auditRefreshed.logs);

        setTimeout(() => {
          setSelectedTicket(null);
          setStatusSuccess(null);
          setStatusMessage("");
          setResolutionNotes("");
        }, 1200);
      } else {
        setStatusError(res.message || "Failed to update status");
      }
    } catch {
      setStatusError("An unexpected error occurred.");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleTriggerSync() {
    setSyncLoading(true);
    setSyncError(null);
    setSyncResult(null);

    const samplePayload = {
      version: 1 as const,
      dry_run: isDryRun,
      students: [
        {
          email: "alex.mutua@summit.ac.ke",
          full_name: "Alex Mutua",
          registration_number: "BIT/2023/8849",
          faculty: "School of Computing & Informatics",
          department: "Computer Science",
          year_of_study: 2,
          campus_code: "SMU-MAIN",
        },
      ],
      course_units: [
        {
          code: "COMP 211",
          name: "Object-Oriented Analysis & Design",
          faculty: "School of Computing & Informatics",
          department: "Computer Science",
          year_of_study: 2,
          semester: 1,
          credit_hours: 3,
        },
        {
          code: "COMP 214",
          name: "Database Systems & Architecture",
          faculty: "School of Computing & Informatics",
          department: "Computer Science",
          year_of_study: 2,
          semester: 1,
          credit_hours: 3,
        },
      ],
      timetables: [
        {
          course_code: "COMP 211",
          campus_code: "SMU-MAIN",
          day_of_week: 1,
          start_time: "08:30",
          end_time: "11:30",
          venue: "Computing Lab 3 (Westlands)",
          lecturer_name: "Dr. Evans Ochieng",
          semester: 1,
          academic_year: "2026/2027",
        },
      ],
    };

    try {
      const res = await syncUamsDataAction(samplePayload);
      setSyncResult(res);
      // Reload audit log
      const auditRefreshed = await getAuditLogsAction();
      if (auditRefreshed.success) setAuditLogs(auditRefreshed.logs);
    } catch (err: unknown) {
      setSyncError(err instanceof Error ? err.message : "Sync execution failed.");
    } finally {
      setSyncLoading(false);
    }
  }

  const filteredTickets = tickets.filter((t) => {
    if (queueFilter === "all") return true;
    if (queueFilter === "sensitive") return t.isSensitive;
    return t.status === queueFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0B1D33] text-white border-b border-[#06101E] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#06101E] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-sm text-white leading-tight">
                Summit Metropolitan University
              </h1>
              <p className="text-[11px] text-slate-300">
                Staff Administration & Registrar Operations Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/help-desk">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#C59B27]/40 text-[#FCD34D] hover:bg-[#06101E]"
              >
                Student View
              </Button>
            </Link>
            <Link href="/announcements/new">
              <Button
                variant="primary"
                size="sm"
                className="text-xs gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#FCD34D]" /> Post Notice
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div className="bg-[#06101E] border-b border-[#C59B27]/20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-xs font-semibold overflow-x-auto py-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-1.5 pb-1 transition-colors ${
              activeTab === "queue"
                ? "text-[#FCD34D] border-b-2 border-[#C59B27]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Help Desk Queue ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulletins")}
            className={`flex items-center gap-1.5 pb-1 transition-colors ${
              activeTab === "bulletins"
                ? "text-[#FCD34D] border-b-2 border-[#C59B27]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" /> Official Bulletins ({notices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sync")}
            className={`flex items-center gap-1.5 pb-1 transition-colors ${
              activeTab === "sync"
                ? "text-[#FCD34D] border-b-2 border-[#C59B27]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> UAMS Ingestion & Sync
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 pb-1 transition-colors ${
              activeTab === "audit"
                ? "text-[#FCD34D] border-b-2 border-[#C59B27]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Audit Log ({auditLogs.length})
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* TAB 1: HELP DESK QUEUE */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#C59B27]/20 pb-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                  Student Support Queue & Grievance Registry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Triage submitted student inquiries, assign departmental caseworkers, and process resolution notes.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto bg-[#0B1D33]/10 p-1 rounded-xl border border-[#C59B27]/20">
                {["all", "submitted", "under_review", "in_progress", "resolved", "sensitive"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setQueueFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      queueFilter === st
                        ? "bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 shadow-xs"
                        : "text-slate-600 hover:text-[#0B1D33]"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleRefreshQueue}
                  className="p-1.5 text-slate-600 hover:text-[#0B1D33] rounded-lg transition-colors ml-1"
                  title="Refresh Queue"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sensitive Complaint Isolation Alert */}
            <div className="p-3.5 rounded-xl border border-red-900/40 bg-red-950/20 text-xs flex items-start gap-2.5 text-red-300">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <strong className="text-red-200 block">Strict Privacy Notice:</strong>
                Complaints tagged with Confidential Sensitive Complaint are restricted to the assigned investigator and senior administrative staff. Unauthorized inspection is logged in the compliance audit trail.
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading support queue...</div>
            ) : filteredTickets.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-400 border-dashed border-[#C59B27]/30 bg-white">
                No tickets found for filter &apos;{queueFilter}&apos;.
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((t) => (
                  <Card
                    key={t.id}
                    className="p-4 border-[#C59B27]/25 bg-white shadow-xs hover:border-[#C59B27]/60 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#0B1D33]">
                            {t.referenceNo}
                          </span>
                          <span className="text-xs text-slate-500 font-sans">• {t.studentName} ({t.studentEmail})</span>
                          {t.isSensitive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/50 text-red-300 border border-red-800">
                              <Lock className="w-2.5 h-2.5" /> Confidential Sensitive
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0B1D33] text-slate-200 border border-slate-700 capitalize">
                            {t.status.replace("_", " ")}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                          {t.subject}
                        </h4>
                        <p className="text-xs text-slate-600 font-sans line-clamp-2">
                          {t.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 font-sans">
                          <span>Category: <strong className="text-slate-700 capitalize">{t.category.replace("_", " ")}</strong></span>
                          <span>Priority: <strong className="text-[#C59B27]">{t.priority}</strong></span>
                          <span>Assigned: <strong className="text-slate-700">{t.assignedStaffName || "Unassigned Desk"}</strong></span>
                          <span>Logged: {new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedTicket(t);
                            setNewStatus(t.status);
                          }}
                          className="text-xs"
                        >
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OFFICIAL BULLETINS */}
        {activeTab === "bulletins" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#C59B27]/20 pb-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                  Official Campus Bulletins & Urgent Announcements
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutional broadcasts published to student portals across Summit Metropolitan University.
                </p>
              </div>
              <Link href="/announcements/new">
                <Button variant="primary" size="sm" className="text-xs gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-[#FCD34D]" /> Compose New Notice
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {notices.map((n) => (
                <Card
                  key={n.id}
                  className="p-4 border-[#C59B27]/25 bg-white shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40">
                        {n.priority}
                      </span>
                      <span className="text-xs text-slate-400 font-sans">• Scope: {n.targetScope}</span>
                    </div>
                    <span className="text-xs text-slate-400">{n.publishedAt}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                    {n.title}
                  </h4>
                  <p className="text-xs text-slate-600 font-sans mt-1 leading-relaxed">
                    {n.content}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: UAMS INGESTION & SYNC */}
        {activeTab === "sync" && (
          <div className="space-y-4">
            <div className="border-b border-[#C59B27]/20 pb-3">
              <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                University Academic Management System (UAMS) Sync
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute automated synchronization against UAMS v1 data contract. Natural-key upsert ensures non-destructive student identity and timetable updates.
              </p>
            </div>

            <Card className="p-6 border-[#C59B27]/30 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C59B27]/15 pb-4">
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#0B1D33]">
                    Ingestion Trigger Control
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validates schema payload version 1, natural keys (email, course codes, timetable slots).
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDryRun}
                      onChange={(e) => setIsDryRun(e.target.checked)}
                      className="rounded text-[#C59B27] focus:ring-[#C59B27]"
                    />
                    Dry Run Mode (Validate only)
                  </label>
                  <Button
                    onClick={handleTriggerSync}
                    variant="primary"
                    size="sm"
                    isLoading={syncLoading}
                    className="text-xs gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#FCD34D]" /> Execute UAMS Ingestion
                  </Button>
                </div>
              </div>

              {syncError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs">
                  {syncError}
                </div>
              )}

              {syncResult && (
                <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-950/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">
                      Sync Completed ({syncResult.dry_run ? "DRY RUN MODE" : "COMMITTED TO DATABASE"})
                    </span>
                    <span className="text-[11px] text-emerald-300">{syncResult.message}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-900/40 font-mono text-[11px]">
                    <div className="p-2 rounded bg-[#06101E] border border-emerald-800/30">
                      <span className="text-slate-400 block">Students</span>
                      <span className="font-bold text-white">
                        Processed: {syncResult.counts.students_processed} • Upserted: {syncResult.counts.students_inserted + syncResult.counts.students_updated}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#06101E] border border-emerald-800/30">
                      <span className="text-slate-400 block">Course Units</span>
                      <span className="font-bold text-white">
                        Processed: {syncResult.counts.course_units_processed} • Upserted: {syncResult.counts.course_units_inserted + syncResult.counts.course_units_updated}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#06101E] border border-emerald-800/30">
                      <span className="text-slate-400 block">Timetable Slots</span>
                      <span className="font-bold text-white">
                        Processed: {syncResult.counts.timetables_processed} • Upserted: {syncResult.counts.timetables_inserted + syncResult.counts.timetables_updated}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold uppercase text-slate-400">Sample Ingestion Payload Preview</span>
                <pre className="p-3 rounded-lg bg-[#06101E] text-[#FCD34D] text-[11px] font-mono border border-[#C59B27]/20 overflow-x-auto">
{JSON.stringify(
  {
    version: 1,
    dry_run: isDryRun,
    students: [
      {
        email: "alex.mutua@summit.ac.ke",
        full_name: "Alex Mutua",
        registration_number: "BIT/2023/8849",
        faculty: "School of Computing & Informatics",
        department: "Computer Science",
        year_of_study: 2,
        campus_code: "SMU-MAIN",
      },
    ],
    course_units: [
      {
        code: "COMP 211",
        name: "Object-Oriented Analysis & Design",
        credit_hours: 3,
      },
    ],
    timetables: [
      {
        course_code: "COMP 211",
        day_of_week: 1,
        start_time: "08:30",
        venue: "Computing Lab 3",
      },
    ],
  },
  null,
  2
)}
                </pre>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: AUDIT LOG */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="border-b border-[#C59B27]/20 pb-3">
              <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                Institutional Compliance & Security Audit Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable event stream recording sensitive complaint views, ticket status mutations, staff assignments, and sync executions.
              </p>
            </div>

            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-[#C59B27]/20 bg-white flex items-start justify-between gap-3 text-xs shadow-xs font-sans"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/30">
                        {log.action.toUpperCase()}
                      </span>
                      <span className="font-semibold text-[#0B1D33]">
                        {log.actorName} ({log.actorRole})
                      </span>
                      {log.targetId && (
                        <span className="font-mono text-slate-400 text-[10px]">
                          Target: {log.targetId}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 font-mono text-[11px]">
                      Details: {JSON.stringify(log.details)}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans">
            <div className="w-full max-w-md bg-white border border-[#C59B27]/50 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-[#0B1D33] px-6 py-4 border-b border-[#C59B27]/30 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-serif font-bold text-sm">Update Ticket Status</h3>
                  <span className="text-[11px] font-mono text-[#FCD34D]">
                    {selectedTicket.referenceNo} • {selectedTicket.studentName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateStatusSubmit} className="p-6 space-y-4">
                {statusError && (
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs">
                    {statusError}
                  </div>
                )}
                {statusSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
                    {statusSuccess}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                    Timeline Progress Message
                  </label>
                  <Input
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="e.g. Technician dispatched or scheduled hearing."
                    className="text-xs"
                  />
                </div>

                {(newStatus === "resolved" || newStatus === "closed") && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                      Official Resolution Summary
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Findings, outcome, and corrective actions taken..."
                      className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-[#C59B27]/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedTicket(null)}
                    className="text-xs border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={statusLoading}
                    className="text-xs"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
