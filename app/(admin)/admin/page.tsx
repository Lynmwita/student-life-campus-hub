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
  Search,
  CheckCircle2,
  AlertCircle,
  Edit,
  Clock,
  LogOut,
  Trash2,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Activity,
  UserCheck,
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
import {
  syncUamsDataAction,
  getLatestSyncStatusAction,
  type UamsSyncResponse,
  type LatestSyncStatus,
} from "@/lib/actions/sync";
import {
  getAdminAnnouncementsAction,
  toggleAnnouncementPublishAction,
  updateAnnouncementDraftAction,
  deleteAnnouncementAction,
  type NoticeItem,
} from "@/lib/actions/announcements";
import { getUserRoleAction, signOutAction } from "@/lib/actions/auth";

export default function StaffAdminPanelPage() {
  const [activeTab, setActiveTab] = React.useState<"queue" | "bulletins" | "sync" | "audit" | "users" | "events" | "settings">("queue");
  const [tickets, setTickets] = React.useState<TicketItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [queueFilter, setQueueFilter] = React.useState<string>("all");
  const [searchRef, setSearchRef] = React.useState<string>("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = React.useState<string | null>(null);

  // User role state
  const [userRoleInfo, setUserRoleInfo] = React.useState<{
    isAuthenticated: boolean;
    role: string | null;
    isAdmin: boolean;
    isStaff: boolean;
    email?: string | null;
  }>({ isAuthenticated: false, role: null, isAdmin: false, isStaff: false, email: null });

  // Status update modal state
  const [selectedTicket, setSelectedTicket] = React.useState<TicketItem | null>(null);
  const [newStatus, setNewStatus] = React.useState<string>("in_progress");
  const [statusMessage, setStatusMessage] = React.useState<string>("");
  const [resolutionNotes, setResolutionNotes] = React.useState<string>("");
  const [statusLoading, setStatusLoading] = React.useState<boolean>(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = React.useState<string | null>(null);

  // Sync state
  const [isDryRun, setIsDryRun] = React.useState(false);
  const [syncLoading, setSyncLoading] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<UamsSyncResponse | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = React.useState<string | null>(null);
  const [latestSyncStatus, setLatestSyncStatus] = React.useState<LatestSyncStatus | null>(null);

  // Announcement manager state
  const [announcementActionLoading, setAnnouncementActionLoading] = React.useState(false);
  const [announcementActionMessage, setAnnouncementActionMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedDraftForEdit, setSelectedDraftForEdit] = React.useState<NoticeItem | null>(null);
  const [editDraftTitle, setEditDraftTitle] = React.useState("");
  const [editDraftContent, setEditDraftContent] = React.useState("");
  const [editDraftPriority, setEditDraftPriority] = React.useState<"P1" | "P2" | "P3" | "P4">("P3");
  const [editDraftScope, setEditDraftScope] = React.useState("all");

  // Audit filter state
  const [searchActor, setSearchActor] = React.useState("");
  const [auditActionFilter, setAuditActionFilter] = React.useState("all");

  React.useEffect(() => {
    let ignore = false;
    async function loadInitialData() {
      try {
        const [authRes, ticketsRes, auditRes, noticesRes, syncStatusRes] = await Promise.all([
          getUserRoleAction(),
          getStaffTicketQueueAction(),
          getAuditLogsAction(),
          getAdminAnnouncementsAction(),
          getLatestSyncStatusAction(),
        ]);
        if (!ignore) {
          setUserRoleInfo(authRes);
          if (ticketsRes.success) setTickets(ticketsRes.tickets);
          if (auditRes.success) setAuditLogs(auditRes.logs);
          if (noticesRes.success) setNotices(noticesRes.announcements);
          if (syncStatusRes.success) setLatestSyncStatus(syncStatusRes);
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
      setLastSyncTime(
        new Date().toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" }) +
          " at " +
          new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })
      );
      // Reload sync status and audit log
      const [auditRefreshed, statusRefreshed] = await Promise.all([
        getAuditLogsAction(),
        getLatestSyncStatusAction(),
      ]);
      if (auditRefreshed.success) setAuditLogs(auditRefreshed.logs);
      if (statusRefreshed.success) setLatestSyncStatus(statusRefreshed);
    } catch (err: unknown) {
      setSyncError(err instanceof Error ? err.message : "Sync execution failed.");
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleTogglePublish(notice: NoticeItem) {
    const nextState = !notice.isPublished;
    setAnnouncementActionLoading(true);
    setAnnouncementActionMessage(null);
    try {
      const res = await toggleAnnouncementPublishAction(notice.id, nextState);
      if (res.success) {
        setNotices((prev) =>
          prev.map((n) =>
            n.id === notice.id
              ? {
                  ...n,
                  isPublished: nextState,
                  publishedAt: nextState ? "Just now" : "Draft",
                }
              : n
          )
        );
        const auditRes = await getAuditLogsAction();
        if (auditRes.success) setAuditLogs(auditRes.logs);
        setAnnouncementActionMessage({ type: "success", text: res.message });
      } else {
        setAnnouncementActionMessage({ type: "error", text: res.message });
      }
    } catch {
      setAnnouncementActionMessage({ type: "error", text: "Failed to update publication status." });
    } finally {
      setAnnouncementActionLoading(false);
    }
  }

  function handleOpenEditDraft(notice: NoticeItem) {
    setSelectedDraftForEdit(notice);
    setEditDraftTitle(notice.title);
    setEditDraftContent(notice.content);
    setEditDraftPriority(notice.priority);
    setEditDraftScope(notice.targetScope || "all");
  }

  async function handleSaveDraftSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDraftForEdit) return;
    setAnnouncementActionLoading(true);
    setAnnouncementActionMessage(null);

    const formData = new FormData();
    formData.set("title", editDraftTitle);
    formData.set("content", editDraftContent);
    formData.set("priority", editDraftPriority);
    formData.set("targetScope", editDraftScope);

    try {
      const res = await updateAnnouncementDraftAction(selectedDraftForEdit.id, formData);
      if (res.success) {
        setNotices((prev) =>
          prev.map((n) =>
            n.id === selectedDraftForEdit.id
              ? {
                  ...n,
                  title: editDraftTitle,
                  content: editDraftContent,
                  priority: editDraftPriority,
                  targetScope: editDraftScope,
                }
              : n
          )
        );
        setSelectedDraftForEdit(null);
        const auditRes = await getAuditLogsAction();
        if (auditRes.success) setAuditLogs(auditRes.logs);
        setAnnouncementActionMessage({ type: "success", text: res.message });
      } else {
        setAnnouncementActionMessage({ type: "error", text: res.message });
      }
    } catch {
      setAnnouncementActionMessage({ type: "error", text: "Failed to save draft." });
    } finally {
      setAnnouncementActionLoading(false);
    }
  }

  async function handleDeleteAnnouncement(noticeId: string, noticeTitle: string) {
    if (!confirm(`Are you sure you want to delete "${noticeTitle}"? This will permanently remove it from campus feeds.`)) {
      return;
    }
    setDeletingAnnouncementId(noticeId);
    setAnnouncementActionMessage(null);
    try {
      const res = await deleteAnnouncementAction(noticeId);
      if (res.success) {
        setNotices((prev) => prev.filter((n) => n.id !== noticeId));
        const auditRes = await getAuditLogsAction();
        if (auditRes.success) setAuditLogs(auditRes.logs);
        setAnnouncementActionMessage({ type: "success", text: `Announcement "${noticeTitle}" permanently deleted.` });
      } else {
        setAnnouncementActionMessage({ type: "error", text: res.message || "Failed to delete announcement." });
      }
    } catch (err) {
      console.error("Failed to delete announcement", err);
      setAnnouncementActionMessage({ type: "error", text: "An error occurred while deleting announcement." });
    } finally {
      setDeletingAnnouncementId(null);
    }
  }

  const isAuthorized = userRoleInfo.isAdmin;

  function renderNotAuthorizedCard(sectionName: string) {
    return (
      <Card className="p-8 text-center bg-white border border-red-200/80 shadow-xs max-w-lg mx-auto my-12 space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg text-[#0B1D33]">Access Restricted</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            The <strong>{sectionName}</strong> module requires <strong>University Administrator</strong> or <strong>Super Admin</strong> clearance. Staff accounts without administrative privileges are not authorized to view or manage this section.
          </p>
        </div>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("queue")}
            className="text-xs border-[#C59B27]/40 text-[#0B1D33] hover:bg-slate-50"
          >
            Return to Help Desk Queue
          </Button>
        </div>
      </Card>
    );
  }

  const filteredTickets = tickets.filter((t) => {
    if (searchRef.trim() && !t.referenceNo.toLowerCase().includes(searchRef.toLowerCase().trim())) {
      return false;
    }
    if (categoryFilter !== "all" && t.category !== categoryFilter) {
      return false;
    }
    if (queueFilter === "all") return true;
    if (queueFilter === "sensitive") return t.isSensitive;
    if (queueFilter === "submitted") return t.status === "submitted";
    if (queueFilter === "under_review" || queueFilter === "in_review") {
      return t.status === "under_review" || t.status === "in_review" || t.status === "in_progress";
    }
    if (queueFilter === "resolved") return t.status === "resolved" || t.status === "closed";
    return t.status === queueFilter;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== "all" && log.action !== auditActionFilter) {
      return false;
    }
    if (searchActor.trim()) {
      const q = searchActor.toLowerCase().trim();
      const inActor = log.actorName.toLowerCase().includes(q) || log.actorRole.toLowerCase().includes(q);
      const inTarget = (log.targetType + " " + (log.targetId || "")).toLowerCase().includes(q);
      const inDetails = typeof log.details === "object" ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
      return inActor || inTarget || inDetails;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-sm w-full space-y-3">
          <div className="w-8 h-8 border-2 border-[#0B1D33] border-t-[#C59B27] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  if (!userRoleInfo.isAdmin && !userRoleInfo.isStaff) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="p-8 text-center bg-white rounded-2xl border border-red-200 shadow-xs max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#0B1D33]">Access Restricted</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              This administrative console is restricted exclusively to university registrars, support officers, and system administrators.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#C59B27]/40 text-[#0B1D33] hover:bg-slate-50"
              >
                Return to Student Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded bg-[#06101E] text-[#FCD34D] border border-[#C59B27]/30 capitalize">
              {userRoleInfo.role || "Staff"}
            </span>
            <Link href="/dashboard">
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
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-xs border-red-900/60 text-red-300 hover:bg-red-950/40 hover:text-red-200 hover:border-red-600 gap-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
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
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 pb-1 transition-colors ${
              activeTab === "users"
                ? "text-[#FCD34D] border-b-2 border-[#C59B27]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> User Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-1.5 pb-1 transition-colors ${
              activeTab === "events"
                ? "text-[#FCD34D] border-b-2 border-[#C59B27]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Campus Events
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 pb-1 transition-colors ${
              activeTab === "settings"
                ? "text-[#FCD34D] border-b-2 border-[#C59B27]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> System Settings
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Institutional Operational Overview & Health Stats Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1D33] text-[#FCD34D] flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-[#0B1D33]">{tickets.length}</div>
              <div className="text-[11px] font-medium text-slate-500">Active Inquiries</div>
            </div>
          </Card>

          <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-[#0B1D33]">{notices.length}</div>
              <div className="text-[11px] font-medium text-slate-500">Notices & Drafts</div>
            </div>
          </Card>

          <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-emerald-700">99.8%</div>
              <div className="text-[11px] font-medium text-slate-500">UAMS Sync Uptime</div>
            </div>
          </Card>

          <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-[#0B1D33]">{auditLogs.length}</div>
              <div className="text-[11px] font-medium text-slate-500">Audit Trail Records</div>
            </div>
          </Card>
        </div>

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

            {/* Search by Reference Number & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  placeholder="Search by reference number (e.g. HD-2026-0042)..."
                  className="pl-9 text-xs h-9 bg-white"
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2 focus:outline-none focus:ring-2 focus:ring-[#C59B27] h-9"
                >
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="fees">Fees</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="technical">Technical</option>
                  <option value="complaint">Complaint</option>
                  <option value="other">Other</option>
                </select>
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

        {/* TAB 2: ANNOUNCEMENTS MANAGER */}
        {activeTab === "bulletins" && (
          !isAuthorized ? (
            renderNotAuthorizedCard("Announcements Manager")
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C59B27]/20 pb-3">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                    Announcements & Bulletins Manager
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Institutional broadcasts published to student portals across Summit Metropolitan University.
                  </p>
                </div>
                <Link href="/announcements/new">
                  <Button variant="primary" size="sm" className="text-xs gap-1.5 shrink-0">
                    <PlusCircle className="w-3.5 h-3.5 text-[#FCD34D]" /> Create Announcement
                  </Button>
                </Link>
              </div>

              {announcementActionMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                    announcementActionMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  <span>{announcementActionMessage.text}</span>
                  <button
                    onClick={() => setAnnouncementActionMessage(null)}
                    className="font-semibold underline ml-3"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {notices.map((n) => {
                  const isPublished = n.isPublished ?? true;
                  return (
                    <Card
                      key={n.id}
                      className="p-4 border-[#C59B27]/25 bg-white shadow-xs space-y-2.5 hover:border-[#C59B27]/50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              isPublished
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                          >
                            {isPublished ? "Published" : "Draft"}
                          </span>

                          {/* Priority Badge */}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40">
                            {n.priority}
                          </span>

                          <span className="text-xs text-slate-500 font-sans">
                            Audience: <strong className="text-slate-700">{n.targetScope}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {n.publishedAt}
                          </span>

                          {/* Edit Draft Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDraft(n)}
                            className="text-[11px] h-7 px-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="w-3 h-3 mr-1 text-slate-500" /> Edit Draft
                          </Button>

                          {/* Publish / Unpublish Toggle */}
                          <Button
                            variant={isPublished ? "outline" : "primary"}
                            size="sm"
                            disabled={announcementActionLoading}
                            onClick={() => handleTogglePublish(n)}
                            className={`text-[11px] h-7 px-2.5 font-medium ${
                              isPublished
                                ? "border-amber-300 text-amber-800 hover:bg-amber-50"
                                : "bg-[#0B1D33] text-[#FCD34D] hover:bg-[#06101E]"
                            }`}
                          >
                            {isPublished ? "Unpublish" : "Publish Now"}
                          </Button>

                          {/* Delete Announcement / Draft Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletingAnnouncementId === n.id}
                            onClick={() => handleDeleteAnnouncement(n.id, n.title)}
                            className="text-[11px] h-7 px-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Delete this announcement"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {deletingAnnouncementId === n.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                          {n.title}
                        </h4>
                        <p className="text-xs text-slate-600 font-sans mt-1 leading-relaxed">
                          {n.content}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* TAB 3: UAMS INGESTION & SYNC */}
        {activeTab === "sync" && (
          !isAuthorized ? (
            renderNotAuthorizedCard("UAMS Ingestion & Synchronization")
          ) : (
            <div className="space-y-4">
              <div className="border-b border-[#C59B27]/20 pb-3">
                <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                  University Academic Management System (UAMS) Sync
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute automated student, course unit, and timetable synchronization against the UAMS v1 data contract.
                </p>
              </div>

              <Card className="p-6 border-[#C59B27]/30 bg-white shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C59B27]/15 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif font-bold text-base text-[#0B1D33]">
                        UAMS Auto-Sync & Registrar Ingestion
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (latestSyncStatus?.status === "failed" || syncError)
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}>
                        {(latestSyncStatus?.status === "failed" || syncError) ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-red-600" /> Sync Degraded
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Auto-Sync Active (15m Cadence)
                          </>
                        )}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {latestSyncStatus?.triggerSource === "cron" ? "Trigger: Scheduled Cron" : "Trigger: Manual Admin"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                        {latestSyncStatus?.feedSource === "live_api"
                          ? "Feed: Live SIS API"
                          : latestSyncStatus?.feedSource === "local_store"
                          ? "Feed: Local Verified Store"
                          : "Feed: Direct Ingestion"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Reconciles student identities, unit enrollments, and timetables automatically on a 15-minute background interval.
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs text-slate-600 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>
                          Last Successful Sync:{" "}
                          <strong className="text-[#0B1D33]">
                            {latestSyncStatus?.lastSyncTimeFormatted || lastSyncTime || "October 16, 2026, 08:30 AM (Baseline)"}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">•</span>
                        <span>
                          Records Changed:{" "}
                          <strong className="text-emerald-700 font-bold">
                            {latestSyncStatus?.recordsChanged ?? (syncResult?.records_changed ?? 3)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDryRun}
                        onChange={(e) => setIsDryRun(e.target.checked)}
                        className="rounded text-[#C59B27] focus:ring-[#C59B27]"
                      />
                      Dry Run (Validate Only)
                    </label>
                    <Button
                      onClick={handleTriggerSync}
                      variant="primary"
                      size="sm"
                      isLoading={syncLoading}
                      className="text-xs gap-1.5 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#FCD34D]" /> Sync Student Data from UAMS
                    </Button>
                  </div>
                </div>

                {/* Prominently render last error if any */}
                {(syncError || latestSyncStatus?.lastError) && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold block text-red-900">Last Sync Error / Warning:</span>
                      <span className="block font-mono text-[11px] text-red-800">{syncError || latestSyncStatus?.lastError}</span>
                      <span className="block text-[10px] text-red-600 mt-1">
                        Automated retry is throttled via anti-storming backoff to protect UAMS infrastructure. Next attempt will execute on schedule.
                      </span>
                    </div>
                  </div>
                )}

                {syncResult && (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-900 text-sm">
                          UAMS Synchronization Completed
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300">
                          {syncResult.dry_run ? "DRY RUN MODE" : "COMMITTED TO DATABASE"}
                        </span>
                      </div>
                      <span className="text-emerald-700 text-xs">{syncResult.message}</span>
                    </div>

                    {/* Results Metrics Display */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                        <span className="text-slate-500 block text-[10px] uppercase">Students Synced</span>
                        <span className="font-bold text-[#0B1D33] text-sm">
                          {syncResult.counts.students_inserted + syncResult.counts.students_updated}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Processed: {syncResult.counts.students_processed}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                        <span className="text-slate-500 block text-[10px] uppercase">Course Units</span>
                        <span className="font-bold text-[#0B1D33] text-sm">
                          {syncResult.counts.course_units_inserted + syncResult.counts.course_units_updated}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Processed: {syncResult.counts.course_units_processed}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                        <span className="text-slate-500 block text-[10px] uppercase">Timetable Slots</span>
                        <span className="font-bold text-[#0B1D33] text-sm">
                          {syncResult.counts.timetables_inserted + syncResult.counts.timetables_updated}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Processed: {syncResult.counts.timetables_processed}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                        <span className="text-slate-500 block text-[10px] uppercase">Records Changed</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {syncResult.counts.students_inserted +
                            syncResult.counts.students_updated +
                            syncResult.counts.course_units_inserted +
                            syncResult.counts.course_units_updated +
                            syncResult.counts.timetables_inserted +
                            syncResult.counts.timetables_updated}{" "}
                          Total
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Errors: {syncResult.errors?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold uppercase text-slate-500">
                    Sample Ingestion Payload Preview
                  </span>
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
      {
        code: "COMP 214",
        name: "Database Systems & Architecture",
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
          )
        )}

        {/* TAB 4: AUDIT LOG VIEWER */}
        {activeTab === "audit" && (
          !isAuthorized ? (
            renderNotAuthorizedCard("Audit Log Viewer")
          ) : (
            <div className="space-y-4">
              <div className="border-b border-[#C59B27]/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                    Institutional Compliance & Security Audit Log
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable event stream recording sensitive complaint views, ticket status mutations, staff assignments, and sync executions.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Shield className="w-4 h-4 text-[#C59B27]" />
                  <span>Read-only compliance log (No edit or deletion permitted)</span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-[#C59B27]/20 shadow-xs">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    value={searchActor}
                    onChange={(e) => setSearchActor(e.target.value)}
                    placeholder="Search by actor name, role, email, or details..."
                    className="pl-9 text-xs"
                  />
                </div>

                <div>
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 bg-white text-[#0B1D33] p-2 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="all">All Action Types</option>
                    <option value="uams_sync_completed">uams_sync_completed</option>
                    <option value="announcement.published">announcement.published</option>
                    <option value="announcement.unpublished">announcement.unpublished</option>
                    <option value="announcement.draft_updated">announcement.draft_updated</option>
                    <option value="announcement.created_published">announcement.created_published</option>
                    <option value="announcement.created_draft">announcement.created_draft</option>
                    <option value="view_sensitive_complaint">view_sensitive_complaint</option>
                    <option value="ticket.status_change">ticket.status_change</option>
                    <option value="ticket.assigned">ticket.assigned</option>
                    <option value="ticket.reply">ticket.reply</option>
                  </select>
                </div>
              </div>

              {/* Audit Log Entries List (Read-only) */}
              <div className="space-y-2.5">
                {filteredAuditLogs.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    No audit log entries match the selected actor or action criteria.
                  </div>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border border-[#C59B27]/20 bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs shadow-xs font-sans hover:border-[#C59B27]/40 transition-colors"
                    >
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/30">
                            {log.action}
                          </span>
                          <span className="font-semibold text-[#0B1D33]">
                            {log.actorName}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {log.actorRole}
                          </span>
                          {log.targetId && (
                            <span className="font-mono text-slate-500 text-[11px]">
                              Target: {log.targetType}/{log.targetId}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 font-mono text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 break-all">
                          {JSON.stringify(log.details)}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap font-mono shrink-0">
                        {new Date(log.createdAt).toLocaleString("en-KE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        )}

        {/* TAB 5: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C59B27]/20 pb-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                  University User Directory & Roles
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutional registry of verified student enrollments, faculty caseworkers, and registrar credentials.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold">
                  3 Verified Pilot Accounts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    Student
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Enrolled
                  </span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33]">Alex Mutua</h4>
                  <p className="text-xs text-slate-500 font-mono">alex.mutua@summit.ac.ke</p>
                  <p className="text-xs text-slate-600 font-sans mt-2">
                    Reg No: <strong className="font-mono">BIT/2023/8849</strong>
                  </p>
                  <p className="text-xs text-slate-500 font-sans">
                    School of Computing & Informatics • Information Technology
                  </p>
                </div>
              </Card>

              <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 uppercase">
                    Staff
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Active Officer
                  </span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33]">Academic Registrar</h4>
                  <p className="text-xs text-slate-500 font-mono">registrar@summit.ac.ke</p>
                  <p className="text-xs text-slate-600 font-sans mt-2">
                    Staff ID: <strong className="font-mono">STAFF/REG/001</strong>
                  </p>
                  <p className="text-xs text-slate-500 font-sans">
                    Registrar Directorate • Academic Affairs
                  </p>
                </div>
              </Card>

              <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                    System Administrator
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Superuser
                  </span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33]">System Administrator</h4>
                  <p className="text-xs text-slate-500 font-mono">admin@summit.ac.ke</p>
                  <p className="text-xs text-slate-600 font-sans mt-2">
                    Admin ID: <strong className="font-mono">ADMIN/SYS/001</strong>
                  </p>
                  <p className="text-xs text-slate-500 font-sans">
                    ICT Directorate • Enterprise Architecture
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 6: CAMPUS EVENTS MANAGEMENT */}
        {activeTab === "events" && (
          <div className="space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C59B27]/20 pb-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                  Campus Events & Calendar Scheduler
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage university fairs, career hackathons, and society calendars broadcast to students.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs space-y-2.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase">
                  Published Event
                </span>
                <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                  University Annual Hackathon 2026
                </h4>
                <p className="text-xs text-slate-500 font-mono">Oct 24, 2026 • 09:00 AM</p>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Main Campus Computing Labs. Featuring Safaricom Engineering, Microsoft ADC mentors.
                </p>
              </Card>

              <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs space-y-2.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase">
                  Published Event
                </span>
                <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                  Career Fair & Mentorship Summit
                </h4>
                <p className="text-xs text-slate-500 font-mono">Oct 28, 2026 • 10:00 AM</p>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  University Auditorium. Open to all faculties with CV review and mock interview stations.
                </p>
              </Card>

              <Card className="p-4 border-[#C59B27]/30 bg-white shadow-xs space-y-2.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase">
                  Published Event
                </span>
                <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                  Chancellor&apos;s Public Lecture
                </h4>
                <p className="text-xs text-slate-500 font-mono">Nov 05, 2026 • 02:00 PM</p>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Taifa Hall, Westlands Campus. Topic: Digital Economy and Emerging African Tech Ecosystems.
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 7: SYSTEM SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-4 font-sans">
            <div className="border-b border-[#C59B27]/20 pb-3">
              <h2 className="text-xl font-serif font-bold text-[#0B1D33]">
                Institution & Hub System Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage global university environment parameters, data residency flags, and security controls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 border-[#C59B27]/30 bg-white shadow-xs space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#0B1D33]">
                  UAMS Synchronization Engine
                </h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Sync Mode:</span>
                    <strong className="text-slate-800">Automated Push & Polling</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Cron Cadence:</span>
                    <strong className="font-mono text-slate-800">Daily Institutional Schedule</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Data Integrity Signature:</span>
                    <strong className="font-mono text-emerald-600">SHA-256 HMAC Active</strong>
                  </div>
                </div>
              </Card>

              <Card className="p-5 border-[#C59B27]/30 bg-white shadow-xs space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#0B1D33]">
                  Campus Security & Data Privacy
                </h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Sensitive Complaints Isolation:</span>
                    <strong className="text-emerald-700">Enforced via RLS & Audit</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Session Inactivity Limit:</span>
                    <strong className="text-slate-800">24 Hours with Secure Cookie</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Institutional Brand Code:</span>
                    <strong className="font-mono text-slate-800">SMU-NAIROBI-2026</strong>
                  </div>
                </div>
              </Card>
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
                    <option value="in_review">In Review</option>
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

        {/* Edit Draft Modal */}
        {selectedDraftForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans">
            <div className="w-full max-w-lg bg-white border border-[#C59B27]/50 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-[#0B1D33] px-6 py-4 border-b border-[#C59B27]/30 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-serif font-bold text-sm">Edit Announcement Draft</h3>
                  <span className="text-[11px] text-[#FCD34D] font-mono">
                    {selectedDraftForEdit.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDraftForEdit(null)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDraftSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                    Announcement Title
                  </label>
                  <Input
                    value={editDraftTitle}
                    onChange={(e) => setEditDraftTitle(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                    Content / Message
                  </label>
                  <textarea
                    rows={4}
                    value={editDraftContent}
                    onChange={(e) => setEditDraftContent(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                      Priority
                    </label>
                    <select
                      value={editDraftPriority}
                      onChange={(e) => setEditDraftPriority(e.target.value as "P1" | "P2" | "P3" | "P4")}
                      className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                    >
                      <option value="P1">P1 - Urgent Notice</option>
                      <option value="P2">P2 - Academic Alert</option>
                      <option value="P3">P3 - Campus Life</option>
                      <option value="P4">P4 - General Info</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                      Audience Scope
                    </label>
                    <select
                      value={editDraftScope}
                      onChange={(e) => setEditDraftScope(e.target.value)}
                      className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                    >
                      <option value="All Students">All Students</option>
                      <option value="Campus: Main Campus">Campus: Main Campus</option>
                      <option value="School of Computing & Informatics">School of Computing & Informatics</option>
                      <option value="School of Business & Economics">School of Business & Economics</option>
                      <option value="School of Engineering & Architecture">School of Engineering & Architecture</option>
                      <option value="Year 1">Year 1</option>
                      <option value="Year 2">Year 2</option>
                      <option value="Year 3">Year 3</option>
                      <option value="Year 4">Year 4</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#C59B27]/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedDraftForEdit(null)}
                    className="text-xs border-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={announcementActionLoading}
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
