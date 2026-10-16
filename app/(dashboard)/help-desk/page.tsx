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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getStudentTicketsAction,
  getTicketDetailAction,
  createHelpTicketAction,
  addTicketMessageAction,
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
        setSubmitSuccess(`Ticket ${res.referenceNo} submitted successfully.`);
        // Refresh ticket list
        const refreshed = await getStudentTicketsAction();
        if (refreshed.success) {
          setTickets(refreshed.tickets);
          loadTicketDetail(res.referenceNo);
        }
        setTimeout(() => {
          setIsSubmitModalOpen(false);
          setSubmitSuccess(null);
        }, 1500);
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

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === "active") return t.status !== "resolved" && t.status !== "closed";
    if (activeTab === "resolved") return t.status === "resolved" || t.status === "closed";
    return true;
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
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#FCD34D]" /> Main Campus (Westlands) • Student Help Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsSubmitModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs border-[#C59B27]/40 text-[#FCD34D] hover:bg-[#06101E] hover:border-[#C59B27] gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#FCD34D]" /> Submit Help Request
            </Button>
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-[#06101E]"
              >
                Staff Console
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-[#06101E] border-b border-[#C59B27]/20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-xs font-semibold overflow-x-auto py-2.5">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-white transition-colors pb-1 flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Campus Feed
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
            className="text-[#FCD34D] border-b-2 border-[#C59B27] pb-1 flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-[#FCD34D]" /> Help Desk & Inquiries
          </Link>
        </div>
      </div>

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
              In Progress ({tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length})
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
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-950/40 text-red-400 border border-red-800">
                            <Lock className="w-2.5 h-2.5" /> Sensitive
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.status === "resolved"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                              : t.status === "in_progress"
                              ? "bg-amber-950/40 text-[#FCD34D] border-[#C59B27]"
                              : "bg-[#0B1D33] text-slate-300 border-slate-700"
                          }`}
                        >
                          {t.status.replace("_", " ").toUpperCase()}
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
                          <Badge variant="danger" className="text-[10px] bg-red-950/30 text-red-300 border-red-800 gap-1">
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
                        {selectedTicket.status.replace("_", " ")}
                      </span>
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
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-[#C59B27]/15 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[#0B1D33]">
                              {item.authorName} • <span className="capitalize text-[#C59B27] font-normal">{item.authorRole}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {item.statusTo && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#06101E] text-[#FCD34D] border border-[#C59B27]/30 mb-1">
                              Status: {item.statusTo.replace("_", " ")}
                            </span>
                          )}
                          <p className="text-slate-600 font-sans leading-relaxed">
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

              <form onSubmit={handleCreateTicket} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {submitError && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs">
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
                    {submitSuccess}
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
                        if (val === "lecturer_conduct" || val === "sensitive_complaint") {
                          setIsSensitive(true);
                        }
                      }}
                      className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                    >
                      <option value="academic">Academic & Units</option>
                      <option value="facilities">Campus Facilities & Labs</option>
                      <option value="it_support">IT & Portal Access</option>
                      <option value="finance_aid">Financial / Fees Aid</option>
                      <option value="hostel">Hostels & Accommodation</option>
                      <option value="lecturer_conduct">Lecturer Conduct / Exam Dispute (Confidential)</option>
                      <option value="sensitive_complaint">Sensitive Student Grievance (Confidential)</option>
                      <option value="general">General Inquiries</option>
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
                      <option value="P1">P1 - Urgent (Exam clash / Critical)</option>
                      <option value="P2">P2 - High (Classroom or coursework)</option>
                      <option value="P3">P3 - Medium (Standard inquiry)</option>
                      <option value="P4">P4 - Low (General request)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Input
                    label="Subject Title"
                    name="subject"
                    required
                    placeholder="e.g. Coursework marks discrepancy in COMP 214"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                    Detailed Statement / Issue Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    placeholder="Provide exact facts, dates, unit codes, lab venues, or staff names where applicable..."
                    className="w-full text-xs rounded-xl border border-[#C59B27]/40 bg-white text-[#0B1D33] p-3 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                  />
                </div>

                {/* Confidential Sensitive Checkbox */}
                <div className="p-3 rounded-xl border border-[#C59B27]/30 bg-[#0B1D33]/30 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="isSensitive"
                    checked={isSensitive}
                    onChange={(e) => setIsSensitive(e.target.checked)}
                    className="mt-0.5 rounded text-[#C59B27] focus:ring-[#C59B27]"
                  />
                  <label htmlFor="isSensitive" className="text-xs leading-relaxed text-slate-300 select-none cursor-pointer">
                    <strong className="text-[#FCD34D] block">Mark as Confidential Sensitive Complaint</strong>
                    Only assigned staff and senior university administrators will be granted clearance to inspect this record.
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#C59B27]/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="text-xs border-slate-600"
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
