'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Send,
  Building,
  BookOpen,
  Receipt,
  Trophy,
  ExternalLink,
  Users,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ClearanceDepartmentItem,
  SponsorViewSummary,
  StudentClearanceSummary,
  TranscriptRequest,
  VaultDocument,
} from '@/lib/graduation/types';
import { requestOfficialTranscriptAction } from '@/lib/actions/graduation';

interface GraduationClientProps {
  initialSummary?: StudentClearanceSummary;
  initialDocuments: VaultDocument[];
  initialRequests: TranscriptRequest[];
  initialSponsorView?: SponsorViewSummary;
  isDemo: boolean;
}

export function GraduationClient({
  initialSummary,
  initialDocuments,
  initialRequests,
  initialSponsorView,
  isDemo,
}: GraduationClientProps) {
  const [activeTab, setActiveTab] = React.useState<'clearance' | 'vault' | 'alumni' | 'sponsor'>('clearance');

  // Clearance State
  const [summary] = React.useState<StudentClearanceSummary | undefined>(initialSummary);

  // Vault State
  const [documents] = React.useState<VaultDocument[]>(initialDocuments);
  const [downloadingDocId, setDownloadingDocId] = React.useState<string | null>(null);

  // Transcript Request State
  const [requests, setRequests] = React.useState<TranscriptRequest[]>(initialRequests);
  const [showRequestForm, setShowRequestForm] = React.useState(false);
  const [targetInstitution, setTargetInstitution] = React.useState('');
  const [targetEmail, setTargetEmail] = React.useState('');
  const [format, setFormat] = React.useState<'electronic_certified' | 'embossed_hardcopy'>('electronic_certified');
  const [notes, setNotes] = React.useState('');
  const [submittingRequest, setSubmittingRequest] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sponsor View State
  const [sponsorSummary] = React.useState<SponsorViewSummary | undefined>(initialSponsorView);

  const handleDownloadDocument = (doc: VaultDocument) => {
    if (!doc.isAvailable) return;
    setDownloadingDocId(doc.id);

    try {
      const docPayload = {
        institution: 'Summit Metropolitan University',
        registry: 'Office of the Academic Registrar',
        documentTitle: doc.title,
        documentType: doc.type,
        referenceNumber: doc.referenceNumber,
        issuedDate: doc.issuedDate,
        student: {
          fullName: summary?.studentName || 'Student',
          admissionNumber: summary?.admissionNumber || 'ADM',
          programme: summary?.programme || 'Degree Programme',
          faculty: summary?.faculty || 'Faculty Division',
          campus: summary?.campus || 'Main Campus',
        },
        certificationNotice: 'Certified official university digital document generated from institutional UAMS registry records.',
        verificationUrl: `https://hub.smu.ac.ke/verify/${doc.referenceNumber}`,
      };

      const blob = new Blob([JSON.stringify(docPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.referenceNumber.replace(/[^A-Za-z0-9]/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleTranscriptRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInstitution.trim() || !targetEmail.trim()) return;

    setSubmittingRequest(true);
    setActionFeedback(null);

    try {
      const res = await requestOfficialTranscriptAction({
        destinationInstitution: targetInstitution.trim(),
        destinationEmail: targetEmail.trim(),
        format,
        notes: notes.trim(),
      });

      if (res.success && res.request) {
        setRequests((prev) => [res.request!, ...prev]);
        setShowRequestForm(false);
        setTargetInstitution('');
        setTargetEmail('');
        setNotes('');
        setActionFeedback({
          type: 'success',
          text: res.message,
        });
      } else {
        setActionFeedback({
          type: 'error',
          text: res.message || 'Failed to submit transcript request.',
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error submitting request.',
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getDepartmentIcon = (category: ClearanceDepartmentItem['category']) => {
    switch (category) {
      case 'library':
        return <BookOpen className="w-4 h-4 text-amber-700" />;
      case 'hostels':
        return <Building className="w-4 h-4 text-blue-700" />;
      case 'sports':
        return <Trophy className="w-4 h-4 text-emerald-700" />;
      case 'finance':
        return <Receipt className="w-4 h-4 text-rose-700" />;
      case 'registrar':
      default:
        return <GraduationCap className="w-4 h-4 text-[#0B1D33]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Notice Banner */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C59B27]" />
            <span>
              <strong>Demo Session:</strong> Displaying graduation clearance and vault for Faith Wanjiku (BIT/2023/8849).
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            REGISTRAR CLEARANCE
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C59B27]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0B1D33] font-semibold">Graduation &amp; Beyond</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-[#C59B27]" />
            Graduation, Clearance &amp; Documents Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Multi-department exit clearance, certified documents vault, alumni services, and parent sponsor portal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {summary && (
            <Badge variant={summary.isFullyCleared ? 'success' : 'default'}>
              {summary.clearedDepartmentsCount} of {summary.totalDepartmentsCount} Cleared
            </Badge>
          )}
          <Badge variant="default">Convocation 2026</Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('clearance')}
          className={`pb-2.5 px-3 font-serif font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'clearance'
              ? 'text-[#0B1D33] border-b-2 border-[#C59B27]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
          <span>Exit Clearance Checklist</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vault')}
          className={`pb-2.5 px-3 font-serif font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'vault'
              ? 'text-[#0B1D33] border-b-2 border-[#C59B27]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Documents Vault</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-mono">
            {documents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alumni')}
          className={`pb-2.5 px-3 font-serif font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'alumni'
              ? 'text-[#0B1D33] border-b-2 border-[#C59B27]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span>Alumni &amp; Transcripts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sponsor')}
          className={`pb-2.5 px-3 font-serif font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'sponsor'
              ? 'text-[#0B1D33] border-b-2 border-[#C59B27]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Parent / Sponsor View</span>
        </button>
      </div>

      {/* TAB 1: FINAL CLEARANCE CHECKLIST */}
      {activeTab === 'clearance' && summary && (
        <div className="space-y-6">
          {/* Clearance Status Summary Card */}
          <Card className="p-6 bg-white border border-[#C59B27]/30 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Institutional Exit Status
                </span>
                <h3 className="font-serif font-bold text-xl text-[#0B1D33]">
                  {summary.isFullyCleared
                    ? 'Fully Cleared for Graduation'
                    : 'Exit Clearance in Progress'}
                </h3>
                <p className="text-xs text-slate-600 max-w-xl">
                  {summary.isFullyCleared
                    ? 'All 5 university departments have recorded statutory sign-offs. Your Certificate of Final University Clearance is generated.'
                    : `Your clearance profile has completed ${summary.clearedDepartmentsCount} of ${summary.totalDepartmentsCount} departments. Address the blocking items below to complete graduation processing.`}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-slate-500 block">Clearance Progress</span>
                <span className="font-serif font-bold text-2xl text-[#0B1D33]">
                  {summary.clearedDepartmentsCount} / {summary.totalDepartmentsCount}
                </span>
                <span className="text-[11px] text-slate-500 block">Departments Cleared</span>
              </div>
            </div>

            {/* Clearance Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden">
              <div
                className="bg-[#C59B27] h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${(summary.clearedDepartmentsCount / summary.totalDepartmentsCount) * 100}%`,
                }}
              />
            </div>
          </Card>

          {/* Departments Checklist */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-[#0B1D33]">
              Departmental Verification Status
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {summary.departments.map((dept) => (
                <Card
                  key={dept.id}
                  className={`p-5 border transition-all ${
                    dept.status === 'cleared'
                      ? 'bg-white border-emerald-200'
                      : dept.status === 'blocked'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-amber-50/30 border-amber-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                        {getDepartmentIcon(dept.category)}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-serif font-bold text-base text-[#0B1D33]">
                            {dept.departmentName}
                          </h4>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              dept.status === 'cleared'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : dept.status === 'blocked'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {dept.status === 'cleared'
                              ? 'Cleared'
                              : dept.status === 'blocked'
                              ? 'Action Required'
                              : 'Pending Audit'}
                          </span>
                        </div>

                        {dept.status === 'cleared' && (
                          <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              Signed off by {dept.officerName} ({dept.officerRole})
                            </span>
                          </div>
                        )}

                        {dept.status === 'blocked' && dept.blockingReason && (
                          <div className="text-xs text-rose-950 flex items-start gap-1.5 pt-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span className="font-medium">{dept.blockingReason}</span>
                          </div>
                        )}

                        {dept.status === 'pending' && dept.blockingReason && (
                          <div className="text-xs text-amber-950 flex items-start gap-1.5 pt-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{dept.blockingReason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 pt-1 sm:pt-0">
                      {dept.resolutionActionUrl && dept.status !== 'cleared' && (
                        <Link href={dept.resolutionActionUrl}>
                          <Button
                            size="sm"
                            className="bg-[#0B1D33] hover:bg-[#06101E] text-white text-xs h-8"
                          >
                            <span>{dept.resolutionActionLabel || 'Resolve'}</span>
                            <ExternalLink className="w-3 h-3 ml-1 text-[#FCD34D]" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <Card className="p-6 bg-blue-50/40 border border-blue-200">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-700 text-white shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-blue-950">
                  Certified Academic Documents Vault
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                  Statutory educational documents, fee payment statements, and examination transcripts generated directly from the university registry. Verified with official cryptographic reference numbers.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="p-5 bg-white border border-slate-200 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[#0B1D33] bg-slate-100 px-2 py-0.5 rounded">
                      Ref: {doc.referenceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        doc.isAvailable
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {doc.isAvailable ? 'Certified' : 'Unavailable'}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-[#0B1D33]">
                    {doc.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {doc.description}
                  </p>

                  {!doc.isAvailable && doc.unavailableReason && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
                      <span>{doc.unavailableReason}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Issued: {doc.issuedDate}
                  </span>

                  <Button
                    size="sm"
                    disabled={!doc.isAvailable || downloadingDocId === doc.id}
                    onClick={() => handleDownloadDocument(doc)}
                    className="bg-[#0B1D33] hover:bg-[#06101E] text-white text-xs h-8"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5 text-[#FCD34D]" />
                    <span>{downloadingDocId === doc.id ? 'Exporting...' : 'Download Certified Copy'}</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALUMNI & TRANSCRIPTS */}
      {activeTab === 'alumni' && (
        <div className="space-y-6">
          {/* Convocation Card */}
          <Card className="p-6 bg-[#0B1D33] text-white border border-[#C59B27]/40 shadow-sm space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#06101E] border border-[#C59B27]/40 text-[#FCD34D] shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FCD34D]">
                  34th Annual University Convocation
                </span>
                <h3 className="font-serif font-bold text-lg text-white">
                  Graduation Ceremony &amp; Gown Protocol
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  The 34th Graduation Ceremony will take place at the Chancellor Pavilion, Main Campus. Graduands who achieve full clearance by Friday, 20 November 2026 are included in the official congregation roll.
                </p>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-700/60 text-xs text-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Ceremony Date</span>
                <strong className="text-white block pt-0.5">Friday, 11 December 2026</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Gown Issuance Desk</span>
                <strong className="text-white block pt-0.5">Stores Depot Room 04</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Rehearsal Attendance</span>
                <strong className="text-white block pt-0.5">Thursday, 10 Dec 14:00</strong>
              </div>
            </div>
          </Card>

          {/* Official Transcript Service */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#0B1D33]">
                  Official Academic Transcript Delivery
                </h3>
                <p className="text-xs text-slate-600">
                  Request certified electronic or embossed physical transcripts sent directly to employers or graduate schools.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="bg-[#0B1D33] hover:bg-[#06101E] text-white text-xs h-8"
              >
                <Send className="w-3.5 h-3.5 mr-1.5 text-[#FCD34D]" />
                <span>{showRequestForm ? 'Close Form' : 'Request Official Transcript'}</span>
              </Button>
            </div>

            {/* Action Feedback */}
            {actionFeedback && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <span>{actionFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setActionFeedback(null)}
                  className="font-semibold underline text-[11px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Request Form */}
            {showRequestForm && (
              <Card className="p-6 bg-slate-50 border border-[#C59B27]/40 shadow-xs">
                <h4 className="font-serif font-bold text-base text-[#0B1D33] mb-3">
                  Submit Official Transcript Request
                </h4>
                <form onSubmit={handleTranscriptRequestSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Destination Institution / Employer Name
                      </label>
                      <input
                        type="text"
                        required
                        value={targetInstitution}
                        onChange={(e) => setTargetInstitution(e.target.value)}
                        placeholder="e.g. University of Nairobi Admissions or Safaricom Graduate Program"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Format</label>
                      <select
                        value={format}
                        onChange={(e) =>
                          setFormat(e.target.value as 'electronic_certified' | 'embossed_hardcopy')
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="electronic_certified">
                          Certified E-Transcript (Instant Dispatch)
                        </option>
                        <option value="embossed_hardcopy">
                          Embossed Hardcopy (Postal / Courier)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Destination Email Address (Registry Verification Portal)
                    </label>
                    <input
                      type="email"
                      required
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="e.g. admissions@target-institution.ac.ke"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Special Reference or Application Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Application Reference APP-2026-9901"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRequestForm(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingRequest}
                      className="bg-[#0B1D33] text-white text-xs"
                    >
                      {submittingRequest ? 'Registering...' : 'Submit Request'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Requests Table */}
            <div className="grid grid-cols-1 gap-3">
              {requests.map((req) => (
                <Card key={req.id} className="p-4 bg-white border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {req.trackingReference}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            req.status === 'delivered' || req.status === 'dispatched'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[11px] text-slate-500 capitalize">
                          {req.format.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                        {req.destinationInstitution}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Dispatch email: <span className="font-mono text-slate-700">{req.destinationEmail}</span>
                      </p>
                      {req.notes && (
                        <p className="text-xs text-slate-600 pt-0.5">{req.notes}</p>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 shrink-0">
                      <span>Requested: {req.requestedAt.split('T')[0]}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PARENT & SPONSOR VIEW */}
      {activeTab === 'sponsor' && sponsorSummary && (
        <div className="space-y-6">
          <Card className="p-6 bg-purple-50/40 border border-purple-200">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-700 text-white shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-purple-950">
                  Official Parent &amp; Sponsor Statement
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                  Controlled, read-only academic and financial summary for parent and institutional sponsors. Displays authoritative fee balances, payment instructions, and enrollment status.
                </p>
              </div>
            </div>
          </Card>

          {/* Student Profile Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Student Name</span>
              <strong className="text-sm text-[#0B1D33] block pt-1">
                {sponsorSummary.studentName}
              </strong>
              <span className="font-mono text-xs text-slate-500 block">
                {sponsorSummary.admissionNumber}
              </span>
            </Card>

            <Card className="p-4 bg-white border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Degree Programme</span>
              <strong className="text-xs text-[#0B1D33] block pt-1">
                {sponsorSummary.programme}
              </strong>
              <span className="text-[11px] text-slate-500 block">
                {sponsorSummary.faculty}
              </span>
            </Card>

            <Card className="p-4 bg-white border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Standing</span>
              <strong className="text-xs text-emerald-800 block pt-1">
                {sponsorSummary.academicStanding}
              </strong>
              <span className="text-[11px] text-slate-500 block">
                Academic Year {sponsorSummary.academicYear} (Semester {sponsorSummary.currentSemester})
              </span>
            </Card>

            <Card className="p-4 bg-white border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Outstanding Balance</span>
              <strong
                className={`text-xl font-bold font-serif block pt-1 ${
                  sponsorSummary.feeSummary.balance > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                KES {sponsorSummary.feeSummary.balance.toLocaleString()}
              </strong>
              <span className="text-[11px] text-slate-500 block">
                Due Date: {sponsorSummary.feeSummary.dueDate}
              </span>
            </Card>
          </div>

          {/* Payment Instructions for Parents & Sponsors */}
          <Card className="p-6 bg-white border border-[#C59B27]/40 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-base text-[#0B1D33] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#C59B27]" />
              <span>Official University Fee Payment Channels</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* M-Pesa Paybill */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Mobile Payment (Safaricom M-Pesa)
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Business Paybill Number:</span>
                    <strong className="font-mono text-[#0B1D33] text-sm">
                      {sponsorSummary.feeSummary.paybillNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <strong className="font-mono text-[#0B1D33] text-sm">
                      {sponsorSummary.feeSummary.accountNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Name:</span>
                    <span className="text-slate-700">Student Name / Admission</span>
                  </div>
                </div>
              </div>

              {/* Direct Bank Deposit */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Direct Bank Wire / Cheque Deposit
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank:</span>
                    <span className="text-slate-700">{sponsorSummary.feeSummary.bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Name:</span>
                    <span className="text-slate-700 truncate max-w-[200px]">
                      {sponsorSummary.feeSummary.bankDetails.accountName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <strong className="font-mono text-[#0B1D33]">
                      {sponsorSummary.feeSummary.bankDetails.accountNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Branch:</span>
                    <span className="text-slate-700">{sponsorSummary.feeSummary.bankDetails.branch}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Enrolled Units List */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
              Enrolled Course Units (Semester 1)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sponsorSummary.enrolledUnits.map((unit) => (
                <Card key={unit.code} className="p-3 bg-white border border-slate-200 text-xs">
                  <span className="font-mono font-bold text-[#0B1D33]">{unit.code}</span>
                  <p className="text-slate-700 font-medium pt-0.5">{unit.title}</p>
                  <span className="text-[11px] text-slate-500 block pt-1">{unit.creditHours} Credit Points</span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
