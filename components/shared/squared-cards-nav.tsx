"use client";

import * as React from "react";
import Link from "next/link";
import {
  Megaphone,
  Receipt,
  IdCard,
  BookOpen,
  GraduationCap,
  FileText,
  Building,
  LifeBuoy,
  Calendar,
  Compass,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export interface NavCardItem {
  href: string;
  labelEn: string;
  labelSw: string;
  categoryEn: string;
  categorySw: string;
  badgeEn: string;
  badgeSw: string;
  statusColor?: "emerald" | "amber" | "blue" | "slate";
  detailEn: string;
  detailSw: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_CARDS: NavCardItem[] = [
  {
    href: "/dashboard",
    labelEn: "Campus Feed",
    labelSw: "Mlisho wa Chuo",
    categoryEn: "Notice Board",
    categorySw: "Matangazo",
    badgeEn: "2 New",
    badgeSw: "2 Mapya",
    statusColor: "amber",
    detailEn: "Official circulars and daily briefs",
    detailSw: "Taarifa na matangazo rasmi",
    icon: Megaphone,
  },
  {
    href: "/fees",
    labelEn: "Fee Statement",
    labelSw: "Ada za Masomo",
    categoryEn: "Finance",
    categorySw: "Fedha",
    badgeEn: "KES 24.5k Due",
    badgeSw: "Baki 24.5k",
    statusColor: "amber",
    detailEn: "Ledger, balance and receipts",
    detailSw: "Daftari, baki na risiti za malipo",
    icon: Receipt,
  },
  {
    href: "/student-id",
    labelEn: "Digital Student ID",
    labelSw: "Kitambulisho cha Mwanafunzi",
    categoryEn: "Identity",
    categorySw: "Kitambulisho",
    badgeEn: "Gate Active",
    badgeSw: "Kinafanya Kazi",
    statusColor: "emerald",
    detailEn: "Barcode pass and verification",
    detailSw: "Msimbo wa geti na uthibitisho",
    icon: IdCard,
  },
  {
    href: "/library",
    labelEn: "Library",
    labelSw: "Maktaba",
    categoryEn: "Academics",
    categorySw: "Taaluma",
    badgeEn: "0 Overdue",
    badgeSw: "Hakuna Madeni",
    statusColor: "emerald",
    detailEn: "Catalogs, books and e-vault",
    detailSw: "Katalogi, vitabu na marejeo",
    icon: BookOpen,
  },
  {
    href: "/units",
    labelEn: "Unit Registration",
    labelSw: "Usajili wa Kozi",
    categoryEn: "Curriculum",
    categorySw: "Mtaala",
    badgeEn: "6 Enrolled",
    badgeSw: "Kozi 6",
    statusColor: "blue",
    detailEn: "Semester courses and requirements",
    detailSw: "Masomo ya muhula na masharti",
    icon: GraduationCap,
  },
  {
    href: "/exams",
    labelEn: "Exam Pass and Timetable",
    labelSw: "Ratiba ya Mitihani & Pasi",
    categoryEn: "Assessments",
    categorySw: "Tathmini",
    badgeEn: "Pass Ready",
    badgeSw: "Pasi Tayari",
    statusColor: "emerald",
    detailEn: "Venues, dates and exam cards",
    detailSw: "Ukumbi, tarehe na kadi ya mtihani",
    icon: FileText,
  },
  {
    href: "/hostels",
    labelEn: "Hostels and Residence",
    labelSw: "Bweni na Makazi",
    categoryEn: "Housing",
    categorySw: "Makazi",
    badgeEn: "Room B-12",
    badgeSw: "Chumba B-12",
    statusColor: "blue",
    detailEn: "Room allocation and residence",
    detailSw: "Ugawaji vyumba na makazi",
    icon: Building,
  },
  {
    href: "/results",
    labelEn: "Results",
    labelSw: "Matokeo ya Mitihani",
    categoryEn: "Academics",
    categorySw: "Taaluma",
    badgeEn: "GPA 3.78",
    badgeSw: "Wastani 3.78",
    statusColor: "emerald",
    detailEn: "Semester grades and transcripts",
    detailSw: "Alama za muhula na nakala",
    icon: GraduationCap,
  },
  {
    href: "/feedback",
    labelEn: "Pilot feedback",
    labelSw: "Maoni ya Majaribio",
    categoryEn: "Support",
    categorySw: "Usaidizi",
    badgeEn: "Build v2.4",
    badgeSw: "Toleo 2.4",
    statusColor: "slate",
    detailEn: "Issue reports and suggestions",
    detailSw: "Ripoti hitilafu na mapendekezo",
    icon: LifeBuoy,
  },
  {
    href: "/timetable",
    labelEn: "Weekly Timetable",
    labelSw: "Ratiba ya Wiki",
    categoryEn: "Schedule",
    categorySw: "Ratiba",
    badgeEn: "1 Today",
    badgeSw: "Kipindi 1 Leo",
    statusColor: "amber",
    detailEn: "Class routines and hall rooms",
    detailSw: "Vipindi vya wiki na kumbi",
    icon: Calendar,
  },
  {
    href: "/campus-life",
    labelEn: "Campus Life and Clubs",
    labelSw: "Maisha ya Chuo na Vilabu",
    categoryEn: "Student Life",
    categorySw: "Shughuli",
    badgeEn: "3 Active",
    badgeSw: "Vilabu 3",
    statusColor: "blue",
    detailEn: "Societies, sports and events",
    detailSw: "Vyama, michezo na matukio",
    icon: Compass,
  },
  {
    href: "/safety",
    labelEn: "Community and Safety",
    labelSw: "Usalama na Faragha",
    categoryEn: "Emergency",
    categorySw: "Dharura",
    badgeEn: "24/7 Security",
    badgeSw: "Ulinzi 24/7",
    statusColor: "emerald",
    detailEn: "Campus security and medical help",
    detailSw: "Ulinzi wa chuo na msaada wa afya",
    icon: ShieldCheck,
  },
  {
    href: "/graduation",
    labelEn: "Graduation and Vault",
    labelSw: "Utoaji wa Shahada & Kibali",
    categoryEn: "Clearances",
    categorySw: "Idhini",
    badgeEn: "Cleared",
    badgeSw: "Imeidhinishwa",
    statusColor: "emerald",
    detailEn: "Certificates and credentials",
    detailSw: "Vyeti na stakabadhi rasmi",
    icon: GraduationCap,
  },
  {
    href: "/help-desk",
    labelEn: "Help Desk and Inquiries",
    labelSw: "Dawati la Msaada",
    categoryEn: "Assistance",
    categorySw: "Huduma",
    badgeEn: "Desk Open",
    badgeSw: "Dawati Wazi",
    statusColor: "emerald",
    detailEn: "Service tickets and contacts",
    detailSw: "Tiketi za huduma na mawasiliano",
    icon: LifeBuoy,
  },
];

export function SquaredCardsNav() {
  const { language } = useLanguage();

  return (
    <section aria-label="Campus Hub Navigation" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-bold text-sm text-[#0B1D33] flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-[#C59B27]" />
          {language === "sw" ? "Huduma za Chuo" : "Campus Navigation"}
        </h3>
        <span className="text-[11px] font-mono text-slate-500 font-semibold">
          14 {language === "sw" ? "Huduma" : "Services"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {NAV_CARDS.map((card) => {
          const Icon = card.icon;
          const label = language === "sw" ? card.labelSw : card.labelEn;
          const category = language === "sw" ? card.categorySw : card.categoryEn;
          const badge = language === "sw" ? card.badgeSw : card.badgeEn;
          const detail = language === "sw" ? card.detailSw : card.detailEn;

          const dotColor =
            card.statusColor === "emerald"
              ? "bg-emerald-500"
              : card.statusColor === "amber"
              ? "bg-amber-500"
              : card.statusColor === "blue"
              ? "bg-blue-500"
              : "bg-slate-400";

          return (
            <Link
              key={card.href + card.labelEn}
              href={card.href}
              className="aspect-square flex flex-col justify-between p-2.5 sm:p-3.5 rounded-xl border border-[#C59B27]/40 bg-white shadow-xs hover:border-[#C59B27] hover:shadow-sm transition-all text-center group focus:outline-hidden focus:ring-2 focus:ring-[#C59B27]"
            >
              {/* Top Row: Category Pill & Live Status Badge */}
              <div className="w-full flex items-center justify-between gap-1 text-[8.5px] sm:text-[9.5px]">
                <span className="font-semibold uppercase tracking-wider text-[#0B1D33]/70 truncate text-left">
                  {category}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#0B1D33] bg-[#0B1D33]/5 px-1.5 py-0.5 rounded-md border border-[#C59B27]/25 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className="truncate max-w-[65px]">{badge}</span>
                </span>
              </div>

              {/* Middle: Icon & Service Name */}
              <div className="flex flex-col items-center justify-center my-auto py-0.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0B1D33]/5 border border-[#C59B27]/25 flex items-center justify-center text-[#0B1D33] group-hover:bg-[#0B1D33] group-hover:text-[#FCD34D] transition-all mb-1 sm:mb-1.5">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
                </div>
                <span className="font-serif font-bold text-xs sm:text-sm text-[#0B1D33] leading-tight line-clamp-1">
                  {label}
                </span>
              </div>

              {/* Bottom: Context Detail Subline */}
              <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 font-sans leading-tight line-clamp-2 px-0.5">
                {detail}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
