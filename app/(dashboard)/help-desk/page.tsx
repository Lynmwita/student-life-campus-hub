"use client";

import * as React from "react";
import Link from "next/link";
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle,
  Lock,
  ArrowRight,
  Shield,
  Send,
  Calendar,
  Compass,
  Megaphone,
  GraduationCap,
  MapPin,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/shared/app-header";
import {
  getStudentTicketsAction,
  getTicketDetailAction,
  createHelpTicketAction,
  addTicketMessageAction,
  withdrawTicketAction,
  type TicketItem,
  type TimelineItem,
} from "@/lib/actions/helpdesk";

export default function StudentHelpDeskPage() {
  const [tickets, setTickets] = React.useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = React.useState<TicketItem | null>(null);
  const [timeline, setTimeline] = React.useState<TimelineItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "active" | "resolved">("all");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = React.useState<string | null>(null);
  const [replyMessage, setReplyMessage] = React.useState("");
  const [replyLoading, setReplyLoading] = React.useState(false);
  const [category, setCategory] = React.useState<string>("academic");
  const [isSensitive, setIsSensitive] = React.useState(false);

  const loadTicketDetail = React.useCallback(async (refNo: string) => {
    setLoadingDetail(true);
    try {
      const res = await getTicketDetailAction(refNo);
      if (res.success && res.ticket) {
        setSelectedTicket(res.ticket);
        setTimeline(res.timeline || []);
      }
    } catch (err) {
      console.error("Failed to load ticket detail", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    async function loadTickets() {
      try {
        const res = await getStudentTicketsAction();
        if (!ignore && res.success) {
          setTickets(res.tickets);
          if (res.tickets.length > 0) {
            loadTicketDetail(res.tickets[0].referenceNo);
          }
        }
      } catch (err) {
        console.error("Failed to load help desk tickets", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadTickets();
    return () => {
      ignore = true;
    };
  }, [loadTicketDetail]);

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set("isSensitive", isSensitive ? "true" : "false");

    try {
      const res = await createHelpTicketAction(formData);
      if (res.success && res.referenceNo) {
        setSubmittedRef(res.referenceNo);
        // Refresh ticket list
        const refreshed = await getStudentTicketsAction();
        if (refreshed.success) {
          setTickets(refreshed.tickets);
          loadTicketDetail(res.referenceNo);
        }
      } else {
        setSubmitError(res.message || "Failed to submit help ticket.");
      }
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleSendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setReplyLoading(true);
    const formData = new FormData();
    formData.set("ticketId", selectedTicket.id);
    formData.set("message", replyMessage.trim());
    formData.set("isInternal", "false");

    try {
      const res = await addTicketMessageAction(formData);
      if (res.success) {
        setReplyMessage("");
        loadTicketDetail(selectedTicket.referenceNo);
      }
    } catch (err) {
      console.error("Failed to post reply", err);
    } finally {
      setReplyLoading(false);
    }
  }

  const [withdrawing, setWithdrawing] = React.useState(false);

  async function handleWithdrawTicket(ticketIdOrRef: string) {
    if (!confirm("Are you sure you want to withdraw this ticket? This action will remove it from your active inquiries.")) return;
    setWithdrawing(true);
    try {
      const res = await withdrawTicketAction(ticketIdOrRef);
      if (res.success) {
        setSelectedTicket(null);
        setTimeline([]);
        const refreshed = await getStudentTicketsAction();
        if (refreshed.success) {
          setTickets(refreshed.tickets);
        }
      } else {
        alert(res.message || "Failed to withdraw ticket.");
      }
    } catch (err) {
      console.error("Failed to withdraw ticket", err);
    } finally {
      setWithdrawing(false);
    }
  }

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === "active") return t.status !== "resolved" && t.status !== "closed";
    if (activeTab === "resolved") return t.status === "resolved" || t.status === "closed";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C59B27]/20 pb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#0B1D33] tracking-tight">
              Student Help Desk & Grievance Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Track official inquiries, technical assistance, academic reviews, and confidential complaints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tab Filters */}
            <div className="flex items-center gap-1 bg-[#0B1D33]/10 p-1 rounded-xl border border-[#C59B27]/20">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "all"
                    ? "bg-[#0B1D33] text-white border border-[#C59B27]/40 shadow-xs"
                    : "text-slate-600 hover:text-[#0B1D33]"
                }`}
              >
                All Requests ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "active"
                    ? "bg-[#0B1D33] text-white border border-[#C59B27]/40 shadow-xs"
                    : "text-slate-600 hover:text-[#0B1D33]"
                }`}
              >
                Active Inquiries ({tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length})
              </button>
              <button
                onClick={() => setActiveTab("resolved")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "resolved"
                    ? "bg-[#0B1D33] text-white border border-[#C59B27]/40 shadow-xs"
                    : "text-slate-600 hover:text-[#0B1D33]"
                }`}
              >
                Resolved ({tickets.filter((t) => t.status === "resolved" || t.status === "closed").length})
              </button>
            </div>

            <Button
              onClick={() => setIsSubmitModalOpen(true)}
              size="sm"
              className="text-xs bg-[#0B1D33] hover:bg-[#06101E] text-[#FCD34D] border border-[#C59B27] gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#FCD34D]" /> Submit Help Request
            </Button>
          </div>
        </div>

        {/* Sensitive Complaint Privacy Banner */}
        <div className="p-4 rounded-xl border border-[#C59B27]/40 bg-gradient-to-r from-[#0B1D33]/90 to-[#06101E] text-white flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#C59B27]/20 border border-[#C59B27] flex items-center justify-center shrink-0 text-[#FCD34D] mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-semibold text-[#FCD34D] uppercase tracking-wider block">
              Confidential Whistleblower & Grievance Protection
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              Complaints classified under Lecturer Conduct or Harassment are sealed under university privacy policies. Only the designated investigating registrar and authorized senior administrators have clearance to inspect these records.
            </p>
          </div>
        </div>

        {/* Help Desk Workspace Layout: Left Ticket List, Right Timeline & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tickets List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Your Support Tickets</span>
              <span>Showing {filteredTickets.length} items</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-[#C59B27]/30 bg-white">
                <LifeBuoy className="w-8 h-8 text-[#C59B27] mx-auto mb-2 opacity-60" />
                <h3 className="font-serif font-bold text-[#0B1D33] text-sm">
                  No tickets found
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have not submitted any help requests in this category.
                </p>
              </Card>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.referenceNo === t.referenceNo;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => loadTicketDetail(t.referenceNo)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? "border-[#C59B27] bg-[#0B1D33]/[0.03] shadow-sm ring-1 ring-[#C59B27]/50"
                        : "border-[#C59B27]/20 bg-white hover:border-[#C59B27]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-[#0B1D33]">
                        {t.referenceNo}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {t.isSensitive && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                            <Lock className="w-2.5 h-2.5" /> Sensitive
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.status === "resolved" || t.status === "closed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : t.status === "in_review" || t.status === "under_review" || t.status === "in_progress"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                          }`}
                        >
                          {t.status === "in_review" || t.status === "under_review" || t.status === "in_progress"
                            ? "UNDER REVIEW"
                            : t.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-serif font-semibold text-[#0B1D33] line-clamp-1">
                      {t.subject}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-sans">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-[#C59B27]/10 font-sans">
                      <span className="capitalize">{t.category.replace("_", " ")}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Ticket Detail & Status Timeline */}
          <div className="lg:col-span-7">
            {loadingDetail ? (
              <Card className="p-12 text-center text-xs text-slate-400 border-[#C59B27]/30 bg-white">
                Loading ticket record & timeline...
              </Card>
            ) : selectedTicket ? (
              <div className="space-y-4">
                {/* Main Ticket Summary Card */}
                <Card className="p-5 border-[#C59B27]/30 bg-white shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C59B27]/15 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#C59B27]">
                          {selectedTicket.referenceNo}
                        </span>
                        {selectedTicket.isSensitive && (
                          <Badge variant="danger" className="text-[10px] bg-rose-100 text-rose-950 border-rose-300 font-semibold gap-1">
                            <Lock className="w-2.5 h-2.5" /> Confidential Grievance
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-serif font-bold text-[#0B1D33] mt-0.5">
                        {selectedTicket.subject}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase px-2.5 py-1 rounded-md bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40">
                        {selectedTicket.status === "in_review" || selectedTicket.status === "under_review" || selectedTicket.status === "in_progress"
                          ? "UNDER REVIEW"
                          : selectedTicket.status.replace("_", " ").toUpperCase()}
                      </span>
                      {selectedTicket.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWithdrawTicket(selectedTicket.id || selectedTicket.referenceNo)}
                          disabled={withdrawing}
                          className="text-[11px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-7 px-2"
                          title="Withdraw this inquiry"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-3 border-b border-[#C59B27]/15 font-sans">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Category</span>
                      <span className="font-medium text-[#0B1D33] capitalize">
                        {selectedTicket.category.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Priority</span>
                      <span className="font-semibold text-[#C59B27]">{selectedTicket.priority}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Assigned Staff</span>
                      <span className="font-medium text-slate-700">
                        {selectedTicket.assignedStaffName || "Desk Queue"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Submitted</span>
                      <span className="text-slate-600">
                        {new Date(selectedTicket.createdAt).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Description Copy */}
                  <div className="pt-3">
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                      Student Statement / Case Details
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-[#C59B27]/15">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {selectedTicket.resolutionNotes && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs">
                      <span className="font-bold text-emerald-400 block mb-0.5">
                        Official Resolution Summary:
                      </span>
                      <p className="text-emerald-200 font-sans">{selectedTicket.resolutionNotes}</p>
                    </div>
                  )}
                </Card>

                {/* Status Timeline */}
                <Card className="p-5 border-[#C59B27]/30 bg-white shadow-xs">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#0B1D33] mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Progress & Resolution Timeline
                  </h4>

                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#C59B27]/30">
                    {timeline.map((item) => (
                      <div key={item.id} className="relative flex items-start gap-3 pl-1">
                        <div className="w-5 h-5 rounded-full bg-[#0B1D33] border-2 border-[#C59B27] flex items-center justify-center shrink-0 z-10 text-[#FCD34D]">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        <div className={`flex-1 p-3.5 rounded-xl border text-xs ${
                          item.authorRole === "staff" || item.authorRole === "admin"
                            ? "bg-[#0B1D33]/[0.02] border-[#C59B27]/40 shadow-xs"
                            : "bg-white border-slate-200"
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#0B1D33]">
                                {item.authorName}
                              </span>
                              {item.authorRole === "staff" || item.authorRole === "admin" ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40">
                                  STAFF REPLY
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-sans">
                                  (Student)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {item.statusTo && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/30 mb-1.5">
                              Status Transition: {item.statusTo.replace("_", " ").toUpperCase()}
                            </span>
                          )}
                          <p className="text-slate-700 font-sans leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply / Supplemental Information Form */}
                  <form onSubmit={handleSendReply} className="mt-5 pt-4 border-t border-[#C59B27]/15">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Add Supplemental Clarification
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Provide additional details or respond to support officers..."
                        className="text-xs"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={replyLoading}
                        className="shrink-0 text-xs gap-1"
                      >
                        <Send className="w-3.5 h-3.5 text-[#FCD34D]" /> Send
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center text-xs text-slate-400 border-[#C59B27]/30 bg-white">
                Select a ticket from the queue to view status details and timelines.
              </Card>
            )}
          </div>
        </div>

        {/* Submit Ticket Modal */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white border border-[#C59B27]/50 rounded-2xl shadow-xl overflow-hidden font-sans">
              <div className="bg-[#0B1D33] px-6 py-4 border-b border-[#C59B27]/30 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    Submit Help Request / Inquiry
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Official Student Life Support Desk • Summit Metropolitan University
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {submittedRef ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-300">
                    <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-lg text-[#0B1D33]">
                      Help Request Submitted Successfully
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      Your institutional tracking reference number has been assigned:
                    </p>
                  </div>

                  <div className="py-4 px-6 rounded-2xl bg-[#0B1D33] text-white border-2 border-[#C59B27] inline-block shadow-md my-2">
                    <div className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-[#FCD34D]">
                      {submittedRef}
                    </div>
                    <div className="text-[10px] text-slate-300 font-sans uppercase tracking-wider mt-1">
                      Official University Reference Number
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 max-w-sm mx-auto font-sans leading-relaxed">
                    This reference code is permanently saved in your student portal. You can view progress, review timelines, and communicate with university officers.
                  </p>

                  <div className="pt-3">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        setSubmittedRef(null);
                        setIsSubmitModalOpen(false);
                      }}
                      className="text-xs px-8 py-2.5 h-auto font-semibold"
                    >
                      View in My Requests
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateTicket} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                      {submitError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        value={category}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCategory(val);
                          if (val === "complaint" || val === "lecturer_conduct" || val === "sensitive_complaint") {
                            setIsSensitive(true);
                          }
                        }}
                        className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                      >
                        <option value="academic">Academic</option>
                        <option value="fees">Fees</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="technical">Technical</option>
                        <option value="complaint">Complaint</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                        Priority Level
                      </label>
                      <select
                        name="priority"
                        defaultValue="P3"
                        className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                      >
                        <option value="P1">P1 - Urgent</option>
                        <option value="P2">P2 - High</option>
                        <option value="P3">P3 - Medium</option>
                        <option value="P4">P4 - Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Subject Title"
                      name="subject"
                      required
                      placeholder="e.g. Course registration conflict or missing marks"
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                      Detailed Statement / Description
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      placeholder="Describe the issue with specific dates, units, or details..."
                      className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-3 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  {/* Discreet Sensitive/Private Toggle */}
                  <div className="p-3.5 rounded-xl border border-[#C59B27]/30 bg-amber-50/40 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="isSensitive"
                      checked={isSensitive}
                      onChange={(e) => setIsSensitive(e.target.checked)}
                      className="mt-0.5 rounded text-[#0B1D33] focus:ring-[#C59B27] border-slate-300"
                    />
                    <label htmlFor="isSensitive" className="text-xs leading-relaxed text-slate-700 select-none cursor-pointer">
                      <strong className="text-[#0B1D33] block">This is sensitive/private</strong>
                      Restrict visibility exclusively to the assigned staff officer and authorized administrators.
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#C59B27]/20">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSubmitModalOpen(false)}
                      className="text-xs border-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={submitLoading}
                      className="text-xs"
                    >
                      Submit Request <ArrowRight className="w-3.5 h-3.5 ml-1 text-[#FCD34D]" />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
