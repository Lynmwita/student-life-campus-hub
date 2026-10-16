"use client";

import * as React from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-[#0B1D33]">
      <Card className="max-w-md w-full p-8 text-center bg-white border border-[#C59B27]/40 shadow-md rounded-2xl space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#0B1D33] text-[#FCD34D] border-2 border-[#C59B27] flex items-center justify-center mx-auto shadow-sm">
          <WifiOff className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C59B27] block mb-1">
            Campus Hub Offline Mode
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0B1D33]">
            You&apos;re Currently Offline
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C59B27]/10 text-[#855e09] border border-[#C59B27]/30 text-xs font-semibold mt-2.5">
            <Shield className="w-3.5 h-3.5" /> Cached App Shell Active
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          Your internet connection appears to be offline. Your cached timetable schedule and saved campus notices remain accessible on this device.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="w-full sm:w-auto text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FCD34D]" /> Try Reconnecting
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" /> Return Home
            </Button>
          </Link>
        </div>

        <div className="text-[11px] text-slate-400 font-sans border-t border-slate-100 pt-4">
          Summit Metropolitan University • Academic PWA
        </div>
      </Card>
    </div>
  );
}
