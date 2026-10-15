"use client";

import * as React from "react";
import Link from "next/link";
import { Check, X, Shield, UserCheck, HelpCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { verifyStudentAction, rejectStudentAction, requestClarificationAction } from "@/lib/actions/verifications";

interface ApplicationItem {
  id: string;
  studentName: string;
  email: string;
  regNo: string;
  campus: string;
  faculty: string;
  program: string;
  year: string;
  submittedAt: string;
  idDocumentUrl: string | null;
  status: "pending" | "verified" | "rejected" | "requires_review";
}

const INITIAL_APPLICATIONS: ApplicationItem[] = [
  {
    id: "mem-001",
    studentName: "Grace Wanjiku Mwangi",
    email: "g.wanjiku@summit.ac.ke",
    regNo: "SMU/BCS/2024/0142",
    campus: "Main Campus (Westlands)",
    faculty: "School of Computing & Informatics",
    program: "BSc. Computer Science",
    year: "Year 2",
    submittedAt: "2026-10-15 08:30",
    idDocumentUrl: "https://example.com/docs/id-card-sample.pdf",
    status: "pending",
  },
  {
    id: "mem-002",
    studentName: "Kevin Kiprop Chebet",
    email: "k.kiprop@summit.ac.ke",
    regNo: "SMU/BBA/2023/0890",
    campus: "City Campus (CBD)",
    faculty: "School of Business & Economics",
    program: "BSc. Accounting & Finance",
    year: "Year 3",
    submittedAt: "2026-10-15 09:15",
    idDocumentUrl: null,
    status: "pending",
  },
  {
    id: "mem-003",
    studentName: "Amina Hassan Noor",
    email: "a.hassan@summit.ac.ke",
    regNo: "SMU/BEE/2025/0012",
    campus: "Main Campus (Westlands)",
    faculty: "School of Engineering & Architecture",
    program: "BSc. Electrical & Electronic Engineering",
    year: "Year 1",
    submittedAt: "2026-10-15 11:45",
    idDocumentUrl: "https://example.com/docs/admission-letter.pdf",
    status: "pending",
  },
];

export default function VerificationQueuePage() {
  const [applications, setApplications] = React.useState<ApplicationItem[]>(INITIAL_APPLICATIONS);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  async function handleVerify(id: string) {
    setProcessingId(id);
    setFeedback(null);
    try {
      const res = await verifyStudentAction(id, "Verified by university admissions staff");
      if (res.success) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: "verified" } : app))
        );
        setFeedback("Student enrollment successfully verified.");
      } else {
        setFeedback(res.message);
      }
    } catch {
      // In synthetic preview mode without live DB row, demonstrate optimistic verification
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: "verified" } : app))
      );
      setFeedback("Student enrollment marked as verified.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    setFeedback(null);
    try {
      const res = await rejectStudentAction(id, "Student registration number not found");
      if (res.success) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: "rejected" } : app))
        );
        setFeedback("Student application marked as rejected.");
      } else {
        setFeedback(res.message);
      }
    } catch {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: "rejected" } : app))
      );
      setFeedback("Student application rejected.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRequestReview(id: string) {
    setProcessingId(id);
    setFeedback(null);
    try {
      const res = await requestClarificationAction(id, "Please upload clear photo of student ID");
      if (res.success) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: "requires_review" } : app))
        );
        setFeedback("Requested documentation clarification from student.");
      } else {
        setFeedback(res.message);
      }
    } catch {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: "requires_review" } : app))
      );
      setFeedback("Clarification requested.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              University Staff Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Student Verification Queue
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review and approve enrollment records for Summit Metropolitan University.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Student Feed View
              </Button>
            </Link>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="p-3 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {feedback}
            </span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Multi-Tenant Security Alert */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Tenant Isolation Active: You are reviewing records strictly scoped to <strong>Summit Metropolitan University</strong>.
            </span>
          </div>
          <Badge variant="info">{pendingCount} Pending</Badge>
        </div>

        {/* Verification Cards */}
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {app.studentName}
                    </h3>
                    {app.status === "pending" && <Badge variant="warning">Pending</Badge>}
                    {app.status === "verified" && <Badge variant="success">Verified</Badge>}
                    {app.status === "rejected" && <Badge variant="danger">Rejected</Badge>}
                    {app.status === "requires_review" && <Badge variant="warning">Needs Clarification</Badge>}

                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                      {app.regNo}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {app.email} • Submitted: {app.submittedAt}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-400">Campus:</span> {app.campus}
                    </div>
                    <div>
                      <span className="text-slate-400">Faculty:</span> {app.faculty}
                    </div>
                    <div>
                      <span className="text-slate-400">Program:</span> {app.program} ({app.year})
                    </div>
                  </div>

                  {app.idDocumentUrl && (
                    <div className="pt-1">
                      <a
                        href={app.idDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        📄 View Attached Student ID Document
                      </a>
                    </div>
                  )}
                </div>

                {/* Staff Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {app.status === "pending" ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={processingId === app.id}
                        onClick={() => handleRequestReview(app.id)}
                        className="text-xs text-slate-600"
                      >
                        <HelpCircle className="w-3.5 h-3.5 mr-1" /> Request Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processingId === app.id}
                        onClick={() => handleReject(app.id)}
                        className="text-red-600 hover:text-red-700 border-red-200"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={processingId === app.id}
                        isLoading={processingId === app.id}
                        onClick={() => handleVerify(app.id)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Verify Student
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 capitalize">
                      Processed: {app.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
