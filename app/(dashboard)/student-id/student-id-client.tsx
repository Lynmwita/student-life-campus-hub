'use client';

import * as React from 'react';
import { DigitalStudentIdCard } from '@/lib/student-id/types';
import { ExamPassQr } from '@/components/ui/exam-pass-qr';
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Maximize2,
  Minimize2,
  Phone,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

interface StudentIdClientProps {
  card: DigitalStudentIdCard | null;
  isDemo: boolean;
}

export function StudentIdClient({ card, isDemo }: StudentIdClientProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isGateMode, setIsGateMode] = React.useState(false);

  if (!card) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-xs space-y-3">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-[#0B1D33]">No Student ID Issued</h2>
        <p className="text-xs text-slate-500">
          Your institutional student identity badge could not be retrieved. Please ensure your semester enrollment is active.
        </p>
      </div>
    );
  }

  const initials = card.studentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight">
              Digital Student ID Badge
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official institutional smart identity pass for campus gate entry and library borrowing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#C59B27]" />
            Flip Card
          </button>

          <button
            type="button"
            onClick={() => setIsGateMode(!isGateMode)}
            className="px-3 py-1.5 rounded-lg bg-[#0B1D33] hover:bg-[#06101E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            {isGateMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#FCD34D]" /> Normal View
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#FCD34D]" /> Flash at Gate
              </>
            )}
          </button>
        </div>
      </div>

      {/* GATE CHECK-IN FULL-CONTRAST POPUP (WHEN GATE MODE IS ACTIVE) */}
      {isGateMode && (
        <div className="p-6 rounded-2xl bg-[#0B1D33] text-white border-2 border-[#C59B27] shadow-2xl space-y-5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C59B27] text-[#0B1D33] text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Security Scanner Mode
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold text-white tracking-wide uppercase">
              {card.studentName}
            </h2>
            <p className="text-sm font-mono font-bold text-[#FCD34D]">
              {card.admissionNumber}
            </p>
            <p className="text-xs text-slate-300">
              {card.programme} · {card.campusName}
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
            <ExamPassQr payload={card.qrPayload} size={180} />
            <p className="text-[10px] font-mono text-slate-600 mt-2 font-bold tracking-widest uppercase">
              Tap or Scan at Gate
            </p>
          </div>

          <div className="text-[11px] text-slate-300 flex items-center justify-center gap-2 font-mono">
            <span>Valid Through: <strong className="text-white">{card.validUntil}</strong></span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">STATUS: VERIFIED ACTIVE</span>
          </div>
        </div>
      )}

      {/* INTERACTIVE 3D FLIP ID CARD */}
      <div className="py-2 flex justify-center">
        <div className="w-full max-w-sm" style={{ perspective: '1000px' }}>
          <div
            className="w-full h-[500px] transition-transform duration-500 relative cursor-pointer"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'none',
            }}
            onClick={() => setIsFlipped(!isFlipped)}
            title="Click card to flip"
          >
            {/* FRONT OF ID CARD */}
            <div
              className="absolute inset-0 w-full h-full rounded-3xl p-6 bg-[#0B1D33] border-2 border-[#C59B27] shadow-xl flex flex-col justify-between overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Subtle background security matrix */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

              {/* Top Card Branding */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#C59B27] flex items-center justify-center text-[#0B1D33] p-1 shadow-xs">
                    <GraduationCap className="w-6 h-6 text-[#0B1D33]" />
                  </div>
                  <div>
                    <div className="font-serif font-black text-xs text-white tracking-tight leading-none uppercase">
                      SUMMIT METROPOLITAN UNIVERSITY
                    </div>
                    <div className="text-[8px] font-bold text-[#FCD34D] tracking-wider uppercase mt-0.5">
                      Inventing the Future
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-700 text-[9px] font-extrabold text-white tracking-widest uppercase shadow-xs">
                  STUDENT
                </span>
              </div>

              {/* Middle: Photo & Core Credentials */}
              <div className="relative z-10 text-center my-auto space-y-3">
                <div className="relative inline-block">
                  {card.photoUrl ? (
                    <img
                      src={card.photoUrl}
                      alt={card.studentName}
                      className="w-24 h-24 mx-auto rounded-2xl object-cover border-2 border-[#C59B27] shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-[#06101E] p-1 border-2 border-[#C59B27] shadow-xl flex items-center justify-center text-3xl font-serif font-bold text-[#FCD34D]">
                      {initials}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0B1D33] flex items-center justify-center text-[10px] text-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-serif font-black text-white tracking-tight uppercase">
                    {card.studentName}
                  </h2>
                  <div className="text-xs font-mono font-bold text-[#FCD34D] tracking-wider">
                    {card.admissionNumber}
                  </div>
                  <div className="text-[11px] text-slate-200 font-semibold px-4 leading-tight">
                    {card.programme}
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    {card.faculty}
                  </div>
                </div>
              </div>

              {/* Bottom Card Strip */}
              <div className="relative z-10 pt-3 border-t border-white/20 flex items-center justify-between text-[10px]">
                <div>
                  <div className="text-slate-300">Valid Through:</div>
                  <div className="font-mono font-bold text-white">{card.validUntil}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300">Campus:</div>
                  <div className="font-bold text-white truncate max-w-[130px]">{card.campusName}</div>
                </div>
              </div>
            </div>

            {/* BACK OF ID CARD */}
            <div
              className="absolute inset-0 w-full h-full rounded-3xl p-6 bg-[#061727] border-2 border-slate-700 shadow-xl flex flex-col justify-between overflow-hidden text-white"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Magnetic Holographic Stripe */}
              <div>
                <div className="w-full h-9 bg-slate-900 rounded-lg border border-slate-700 mb-3 flex items-center justify-center text-[9px] font-mono text-slate-500 tracking-widest select-none">
                  ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                </div>

                <div className="space-y-1.5 text-[9px] text-slate-300 leading-relaxed">
                  <p className="font-bold text-[#FCD34D] uppercase tracking-wider text-[8px]">
                    Terms and Conditions of Issue:
                  </p>
                  <ul className="list-disc pl-3 space-y-0.5 text-slate-300">
                    <li>This badge remains the property of Summit Metropolitan University.</li>
                    <li>Required for gate security check-in, library borrowing, and hall access.</li>
                    <li>Loss must be reported immediately to Security and the Registrar.</li>
                  </ul>
                </div>
              </div>

              {/* QR Code and Library Barcode */}
              <div className="my-auto py-2 flex items-center justify-between gap-4 border-y border-white/10">
                <div className="shrink-0">
                  <ExamPassQr payload={card.qrPayload} size={85} />
                </div>
                <div className="space-y-1 text-left flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Library Barcode:
                  </span>
                  <div className="font-mono font-bold text-sm text-[#FCD34D] tracking-widest">
                    {card.libraryBarcode}
                  </div>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    NFC ID: {card.id.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Emergency Hotline */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400">
                    Emergency Contact:
                  </span>
                  <span className="font-mono font-bold text-white text-[9px] flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-[#FCD34D]" /> +254 700 000 999
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400">
                    Authority:
                  </span>
                  <span className="font-bold text-white text-[9px]">Office of Registrar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Click or tap the card to flip between front credentials and back barcode.
      </p>
    </div>
  );
}
