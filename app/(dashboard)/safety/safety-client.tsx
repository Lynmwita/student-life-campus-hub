'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  PhoneCall,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  MapPin,
  Calendar,
  FileText,
  User,
  Info,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  EmergencyCategory,
  EmergencySosResult,
  KdpaDataPackage,
  LostFoundItem,
} from '@/lib/community-safety/types';
import {
  claimLostFoundItemAction,
  reportLostFoundItemAction,
  triggerEmergencySosAction,
} from '@/lib/actions/community-safety';

interface SafetyClientProps {
  initialItems: LostFoundItem[];
  initialKdpaPackage?: KdpaDataPackage;
  isDemo: boolean;
}

export function SafetyClient({
  initialItems,
  initialKdpaPackage,
  isDemo,
}: SafetyClientProps) {
  const [activeTab, setActiveTab] = React.useState<'sos' | 'lost_found' | 'kdpa'>('sos');

  // SOS State
  const [sosLocation, setSosLocation] = React.useState('Hall 3 (Mount Kenya Residence)');
  const [sosCategory, setSosCategory] = React.useState<EmergencyCategory>('security');
  const [sosNotes, setSosNotes] = React.useState('');
  const [sosTriggering, setSosTriggering] = React.useState(false);
  const [sosResult, setSosResult] = React.useState<EmergencySosResult | null>(null);

  // Lost & Found State
  const [items, setItems] = React.useState<LostFoundItem[]>(initialItems);
  const [itemFilter, setItemFilter] = React.useState<'all' | 'lost' | 'found'>('all');
  const [showReportForm, setShowReportForm] = React.useState(false);
  const [reporting, setReporting] = React.useState(false);
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  const [claimProof, setClaimProof] = React.useState('');
  const [actionFeedback, setActionFeedback] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Report Form Fields
  const [reportType, setReportType] = React.useState<'lost' | 'found'>('lost');
  const [reportTitle, setReportTitle] = React.useState('');
  const [reportCategory, setReportCategory] = React.useState<LostFoundItem['category']>('electronics');
  const [reportLocation, setReportLocation] = React.useState('');
  const [reportDesc, setReportDesc] = React.useState('');

  // KDPA Export State
  const [kdpaPackage, setKdpaPackage] = React.useState<KdpaDataPackage | undefined>(initialKdpaPackage);
  const [downloading, setDownloading] = React.useState(false);

  const handleSosTrigger = async () => {
    setSosTriggering(true);
    setSosResult(null);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSosTriggering(false);
      setSosResult({
        success: false,
        ticketNumber: 'SOS-OFFLINE',
        dispatchedTo: 'Campus Security',
        campusSecurityPhone: '+254 700 000 999 (Provisional Pilot Line)',
        campusHealthCentrePhone: '+254 700 000 911 (Provisional Pilot Line)',
        studentLocation: sosLocation,
        dispatchedAt: new Date().toISOString(),
        message: 'Network offline: Cannot transmit digital SOS dispatch without network connectivity. Please call provisional campus lines directly or dial national emergency 999/112.',
      });
      return;
    }

    try {
      const res = await triggerEmergencySosAction(sosLocation, sosCategory, sosNotes);
      setSosResult(res);
    } catch {
      setSosResult({
        success: false,
        ticketNumber: 'SOS-LOCAL',
        dispatchedTo: 'Campus Security',
        campusSecurityPhone: '+254 700 000 999 (Provisional Pilot Line)',
        campusHealthCentrePhone: '+254 700 000 911 (Provisional Pilot Line)',
        studentLocation: sosLocation,
        dispatchedAt: new Date().toISOString(),
        message: 'Could not log online ticket due to network interruption. Please call provisional campus emergency lines immediately on +254 700 000 999.',
      });
    } finally {
      setSosTriggering(false);
    }
  };

  const handleReportItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportLocation.trim()) return;

    setReporting(true);
    setActionFeedback(null);

    try {
      const res = await reportLostFoundItemAction({
        type: reportType,
        title: reportTitle.trim(),
        category: reportCategory,
        location: reportLocation.trim(),
        description: reportDesc.trim(),
      });

      if (res.success && res.item) {
        setItems((prev) => [res.item!, ...prev]);
        setShowReportForm(false);
        setReportTitle('');
        setReportLocation('');
        setReportDesc('');
        setActionFeedback({
          type: 'success',
          text: `Item registered under custody ticket ${res.item.ticketReference}. Verified staff will oversee handover.`,
        });
      } else {
        setActionFeedback({
          type: 'error',
          text: res.error || 'Failed to submit item report.',
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error submitting report.',
      });
    } finally {
      setReporting(false);
    }
  };

  const handleClaimSubmit = async (itemId: string) => {
    if (!claimProof.trim()) return;

    try {
      const res = await claimLostFoundItemAction(itemId, claimProof.trim());
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, status: 'claimed' } : i))
        );
        setClaimingId(null);
        setClaimProof('');
        setActionFeedback({
          type: 'success',
          text: res.message,
        });
      } else {
        setActionFeedback({
          type: 'error',
          text: res.message,
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to file claim.',
      });
    }
  };

  const handleDownloadKdpaJson = () => {
    if (!kdpaPackage) return;
    setDownloading(true);

    try {
      const jsonStr = JSON.stringify(kdpaPackage, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KDPA-Data-Export-${kdpaPackage.studentProfile.admissionNumber.replace(/[^A-Za-z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const filteredItems = items.filter((i) => {
    if (itemFilter === 'lost') return i.type === 'lost';
    if (itemFilter === 'found') return i.type === 'found';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C59B27]" />
            <span>
              <strong>Demo Session:</strong> Displaying simulated community safety desk for Faith Wanjiku (BIT/2023/8849).
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            CAMPUS DISPATCH
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
            <span className="text-[#0B1D33] font-semibold">Community &amp; Safety</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-[#C59B27]" />
            Campus Safety, Support &amp; Privacy Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Emergency dispatch alerts, staff-verified lost and found custody, and statutory KDPA data protection rights.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="danger">SOS Dispatch Queue</Badge>
          <Badge variant="default">Westlands Hub</Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('sos')}
          className={`pb-2.5 px-3 font-serif font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'sos'
              ? 'text-[#0B1D33] border-b-2 border-[#C59B27]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Emergency SOS &amp; Hotlines</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lost_found')}
          className={`pb-2.5 px-3 font-serif font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'lost_found'
              ? 'text-[#0B1D33] border-b-2 border-[#C59B27]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4 text-[#C59B27]" />
          <span>Lost &amp; Found Custody</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-mono">
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kdpa')}
          className={`pb-2.5 px-3 font-serif font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'kdpa'
              ? 'text-[#0B1D33] border-b-2 border-[#C59B27]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>KDPA Privacy Centre</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY SOS & HOTLINES */}
      {activeTab === 'sos' && (
        <div className="space-y-6">
          {/* Emergency SOS Trigger Card */}
          <Card className="p-6 bg-rose-50/50 border border-rose-300">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-3 rounded-xl bg-rose-600 text-white shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-rose-950">
                  Priority 1 Emergency Assistance
                </h3>
                <p className="text-xs text-rose-900 leading-relaxed max-w-2xl">
                  Triggering an SOS immediately logs a Priority 1 urgent alert with the Campus Security Control Room and duty residential wardens. It notifies campus staff responders to your verified location.
                </p>
                <p className="text-[11px] font-mono text-rose-800 pt-1">
                  Institutional Notice: This feature alerts on-campus staff responders. For external municipal services, use provisional lines below.
                </p>
              </div>
            </div>

            {sosResult ? (
              <div className="p-5 rounded-xl bg-white border border-rose-200 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                    Incident Logged: {sosResult.ticketNumber}
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-mono text-xs font-bold">
                    P1 DISPATCHED
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {sosResult.message}
                </p>

                <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium border-t border-slate-100">
                  <a
                    href={`tel:${sosResult.campusSecurityPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1D33] text-white hover:bg-[#06101E]"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#FCD34D]" />
                    <span>Call Security Direct: {sosResult.campusSecurityPhone}</span>
                  </a>
                  <a
                    href={`tel:${sosResult.campusHealthCentrePhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 text-white hover:bg-rose-800"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Campus Health: {sosResult.campusHealthCentrePhone}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Emergency Classification
                    </label>
                    <select
                      value={sosCategory}
                      onChange={(e) => setSosCategory(e.target.value as EmergencyCategory)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="security">Security Threat / Physical Harassment</option>
                      <option value="medical">Severe Medical Emergency / Injury</option>
                      <option value="fire">Fire / Electrical Explosion</option>
                      <option value="facility">Hazardous Facility Breakdown / Structural</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Your Exact Location On Campus
                    </label>
                    <input
                      type="text"
                      value={sosLocation}
                      onChange={(e) => setSosLocation(e.target.value)}
                      placeholder="e.g. Hall 3 Block B Room 204 or Science Complex 2nd Floor"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Additional Details / Responders Notice (Optional)
                  </label>
                  <input
                    type="text"
                    value={sosNotes}
                    onChange={(e) => setSosNotes(e.target.value)}
                    placeholder="e.g. Need stretcher at west wing entrance; fire extinguisher needed"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <Button
                  size="lg"
                  disabled={sosTriggering}
                  onClick={handleSosTrigger}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-serif font-bold text-sm h-11 px-6 shadow-md"
                >
                  <ShieldAlert className={`w-4 h-4 mr-2 ${sosTriggering ? 'animate-spin' : ''}`} />
                  <span>{sosTriggering ? 'Dispatching...' : 'Transmit Priority 1 Campus SOS Alert'}</span>
                </Button>
              </div>
            )}
          </Card>

          {/* Institutional Emergency Telephone Directory */}
          <div className="space-y-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#0B1D33] flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#C59B27]" />
                <span>Provisional Campus Emergency Telephone Lines (Pilot Directory)</span>
              </h3>
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-1.5 leading-relaxed">
                <strong>Pre-Pilot Notice:</strong> The numbers below are provisional demonstration lines for the system test. Confirm official campus gate and control room contacts before full launch. In an urgent life-threatening emergency, dial national lines 999 or 112 directly, or alert the nearest gate security guard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                    Security Operations
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    Provisional
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                  Control Room Dispatch
                </h4>
                <p className="text-xs text-slate-500">24/7 Campus Patrol &amp; Gates</p>
                <a
                  href="tel:+254700000999"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0B1D33] hover:text-[#C59B27]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>+254 700 000 999</span>
                </a>
              </Card>

              <Card className="p-4 bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Health &amp; Wellness
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    Provisional
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                  University Clinic &amp; Triage
                </h4>
                <p className="text-xs text-slate-500">Ambulance &amp; Emergency Care</p>
                <a
                  href="tel:+254700000911"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0B1D33] hover:text-[#C59B27]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>+254 700 000 911</span>
                </a>
              </Card>

              <Card className="p-4 bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Student Welfare
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    Provisional
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                  Dean of Students Counselling
                </h4>
                <p className="text-xs text-slate-500">Crisis &amp; Mental Health Support</p>
                <a
                  href="tel:+254700000922"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0B1D33] hover:text-[#C59B27]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>+254 700 000 922</span>
                </a>
              </Card>

              <Card className="p-4 bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    Gender Desk
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    Provisional
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                  GBV &amp; Protection Liaison
                </h4>
                <p className="text-xs text-slate-500">Confidential Incident Support</p>
                <a
                  href="tel:+254700000933"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0B1D33] hover:text-[#C59B27]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>+254 700 000 933</span>
                </a>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOST & FOUND CUSTODY BOARD */}
      {activeTab === 'lost_found' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setItemFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  itemFilter === 'all'
                    ? 'bg-[#0B1D33] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Notices ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setItemFilter('found')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  itemFilter === 'found'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Found in Custody ({items.filter((i) => i.type === 'found').length})
              </button>
              <button
                type="button"
                onClick={() => setItemFilter('lost')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  itemFilter === 'lost'
                    ? 'bg-amber-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Reported Missing ({items.filter((i) => i.type === 'lost').length})
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => setShowReportForm(!showReportForm)}
              className="bg-[#0B1D33] hover:bg-[#06101E] text-white text-xs h-9"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-[#FCD34D]" />
              <span>{showReportForm ? 'Close Report Form' : 'Report Lost / Found Item'}</span>
            </Button>
          </div>

          {/* Feedback Banner */}
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

          {/* Report Form */}
          {showReportForm && (
            <Card className="p-6 bg-slate-50 border border-[#C59B27]/40 shadow-xs">
              <h3 className="font-serif font-bold text-base text-[#0B1D33] mb-3">
                Register a Custodial Item Notice
              </h3>
              <form onSubmit={handleReportItem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Notice Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as 'lost' | 'found')}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="found">I Found an Item (In Custody)</option>
                      <option value="lost">I Lost an Item (Missing)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={reportCategory}
                      onChange={(e) =>
                        setReportCategory(e.target.value as LostFoundItem['category'])
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="electronics">Electronics / Laptops / Chargers</option>
                      <option value="identification">Student ID / Smartcard / Wallet</option>
                      <option value="keys">Keys / Padlocks</option>
                      <option value="books">Course Books / Folders</option>
                      <option value="apparel">Apparel / Watches / Bags</option>
                      <option value="other">Other Material</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Hall / Campus Location
                    </label>
                    <input
                      type="text"
                      required
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                      placeholder="e.g. Science Complex Lecture Theatre 2"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Item Title</label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. Black Dell Wireless Mouse or Chemistry Laboratory Coat"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Custodial Description &amp; Verification Details
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Describe distinguishing marks and state where the item has been deposited for custody."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={reporting}
                    className="bg-[#0B1D33] text-white text-xs"
                  >
                    {reporting ? 'Registering...' : 'Publish Custody Notice'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="p-5 bg-white border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.type === 'found'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {item.type === 'found' ? 'Found in Custody' : 'Missing Item'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">
                        {item.category}
                      </span>
                      {item.ticketReference && (
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          Ref: {item.ticketReference}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          item.status === 'handed_over'
                            ? 'bg-slate-100 text-slate-600'
                            : item.status === 'claimed'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {item.status === 'handed_over'
                          ? 'Handed Over'
                          : item.status === 'claimed'
                          ? 'Claim Under Review'
                          : 'Available to Claim'}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-[#0B1D33]">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>{item.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reported {item.dateReported}</span>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 sm:pt-0 flex flex-col items-end gap-2">
                    {item.status === 'open' && item.type === 'found' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setClaimingId(claimingId === item.id ? null : item.id)
                        }
                        className="text-xs border-[#C59B27]/40 text-[#0B1D33]"
                      >
                        Claim This Item
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline Claim Form */}
                {claimingId === item.id && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-700 font-medium">
                      Provide proof of ownership (e.g. serial number, lock code, unique etching, or purchase proof). All claims are reviewed by campus security custodial staff before in-person handover.
                    </p>
                    <textarea
                      rows={2}
                      value={claimProof}
                      onChange={(e) => setClaimProof(e.target.value)}
                      placeholder="Enter verification proof..."
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setClaimingId(null)}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleClaimSubmit(item.id)}
                        className="text-xs h-7 bg-[#0B1D33] text-white"
                      >
                        Submit Custody Claim
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: KDPA PRIVACY CENTRE */}
      {activeTab === 'kdpa' && (
        <div className="space-y-6">
          {/* Statutory Notice Card */}
          <Card className="p-6 bg-emerald-50/50 border border-emerald-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-700 text-white shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-emerald-950">
                    Statutory Data Protection Rights (KDPA 2019)
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-mono text-[11px] font-bold">
                    Section 26
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  In compliance with the Kenya Data Protection Act (2019), Summit Metropolitan University guarantees your fundamental right to inspect, verify, and export all personal and educational records processed by the university.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-emerald-200">
              <div className="text-xs text-slate-600">
                <span>Controller: </span>
                <strong className="text-slate-800">
                  Office of the Academic Registrar &amp; Data Protection Officer
                </strong>
              </div>

              <Button
                size="sm"
                onClick={handleDownloadKdpaJson}
                disabled={downloading || !kdpaPackage}
                className="bg-[#0B1D33] hover:bg-[#06101E] text-white text-xs font-semibold shrink-0"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-[#FCD34D]" />
                <span>{downloading ? 'Preparing...' : 'Download My Data (Official JSON Bundle)'}</span>
              </Button>
            </div>
          </Card>

          {/* Records Summary */}
          {kdpaPackage && (
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-base text-[#0B1D33]">
                Your Educational &amp; Personal Data Inventory
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Personal Profile</span>
                  <strong className="text-sm text-[#0B1D33] block pt-1">
                    {kdpaPackage.studentProfile.fullName}
                  </strong>
                  <span className="text-xs text-slate-500 font-mono block">
                    {kdpaPackage.studentProfile.admissionNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 block pt-1">
                    {kdpaPackage.studentProfile.programme}
                  </span>
                </Card>

                <Card className="p-4 bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Academic Records</span>
                  <strong className="text-xl font-bold font-serif text-[#0B1D33] block pt-1">
                    {kdpaPackage.records.academicGradesCount}
                  </strong>
                  <span className="text-xs text-slate-500 block">
                    Recorded examination results &amp; credit points
                  </span>
                </Card>

                <Card className="p-4 bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Finance Ledger</span>
                  <strong className="text-xl font-bold font-serif text-[#0B1D33] block pt-1">
                    {kdpaPackage.records.feeStatementsCount}
                  </strong>
                  <span className="text-xs text-slate-500 block">
                    Billed semester fee statements &amp; receipts
                  </span>
                </Card>

                <Card className="p-4 bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Circulation &amp; Units</span>
                  <strong className="text-xl font-bold font-serif text-[#0B1D33] block pt-1">
                    {kdpaPackage.records.libraryLoansCount} Loans · {kdpaPackage.records.unitRegistrationsCount} Units
                  </strong>
                  <span className="text-xs text-slate-500 block">
                    Library borrowings &amp; semester registrations
                  </span>
                </Card>
              </div>
            </div>
          )}

          {/* Plain Words Privacy Explainer */}
          {kdpaPackage && (
            <Card className="p-6 bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-[#0B1D33]">
                Plain-Words Privacy Explainer: What We Process &amp; Why
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                <div className="space-y-1">
                  <strong className="text-slate-900 block">Right to Access (Section 26):</strong>
                  <p>{kdpaPackage.kdpaRightsSummary.rightToAccess}</p>
                </div>
                <div className="space-y-1">
                  <strong className="text-slate-900 block">Right to Rectification (Section 40):</strong>
                  <p>{kdpaPackage.kdpaRightsSummary.rightToRectification}</p>
                </div>
                <div className="space-y-1">
                  <strong className="text-slate-900 block">Right to Erasure &amp; Limits:</strong>
                  <p>{kdpaPackage.kdpaRightsSummary.rightToErasure}</p>
                </div>
                <div className="space-y-1">
                  <strong className="text-slate-900 block">Statutory Education Retention:</strong>
                  <p>{kdpaPackage.kdpaRightsSummary.retentionPolicy}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
