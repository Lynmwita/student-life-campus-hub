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

export interface NavCardAccent {
  topGradient: string;
  cardBg: string;
  borderColor: string;
  iconBg: string;
  dotColor: string;
  unitColor: string;
}

export interface NavCardItem {
  href: string;
  labelEn: string;
  labelSw: string;
  categoryEn: string;
  categorySw: string;
  statNumberEn: string;
  statUnitEn: string;
  statNumberSw: string;
  statUnitSw: string;
  detailEn: string;
  detailSw: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: NavCardAccent;
}

export const NAV_CARDS: NavCardItem[] = [
  {
    href: "/dashboard",
    labelEn: "Campus Feed",
    labelSw: "Mlisho wa Chuo",
    categoryEn: "Notice Board",
    categorySw: "Matangazo",
    statNumberEn: "2",
    statUnitEn: "New",
    statNumberSw: "2",
    statUnitSw: "Mapya",
    detailEn: "Official circulars and daily briefs",
    detailSw: "Taarifa na matangazo rasmi",
    icon: Megaphone,
    accent: {
      topGradient: "from-[#0B1D33] to-[#C59B27]",
      cardBg: "bg-gradient-to-b from-amber-50/50 via-white to-white",
      borderColor: "border-amber-200/80 hover:border-[#C59B27]",
      iconBg: "bg-amber-100/80 text-[#0B1D33] border-amber-200",
      dotColor: "bg-[#C59B27]",
      unitColor: "text-[#C59B27]",
    },
  },
  {
    href: "/fees",
    labelEn: "Fee Statement",
    labelSw: "Ada za Masomo",
    categoryEn: "Finance",
    categorySw: "Fedha",
    statNumberEn: "KES 24.5k",
    statUnitEn: "Due",
    statNumberSw: "KES 24.5k",
    statUnitSw: "Baki",
    detailEn: "Ledger, balance and receipts",
    detailSw: "Daftari, baki na risiti za malipo",
    icon: Receipt,
    accent: {
      topGradient: "from-amber-500 to-[#C59B27]",
      cardBg: "bg-gradient-to-b from-amber-50/60 via-white to-white",
      borderColor: "border-amber-300/80 hover:border-amber-500",
      iconBg: "bg-amber-100 text-amber-900 border-amber-300",
      dotColor: "bg-amber-500",
      unitColor: "text-amber-700",
    },
  },
  {
    href: "/student-id",
    labelEn: "Digital Student ID",
    labelSw: "Kitambulisho cha Mwanafunzi",
    categoryEn: "Identity",
    categorySw: "Kitambulisho",
    statNumberEn: "Gate Active",
    statUnitEn: "",
    statNumberSw: "Kinafanya Kazi",
    statUnitSw: "",
    detailEn: "Barcode pass and verification",
    detailSw: "Msimbo wa geti na uthibitisho",
    icon: IdCard,
    accent: {
      topGradient: "from-emerald-500 to-teal-500",
      cardBg: "bg-gradient-to-b from-emerald-50/50 via-white to-white",
      borderColor: "border-emerald-200/80 hover:border-emerald-500",
      iconBg: "bg-emerald-100/90 text-emerald-900 border-emerald-200",
      dotColor: "bg-emerald-500",
      unitColor: "text-emerald-700",
    },
  },
  {
    href: "/library",
    labelEn: "Library",
    labelSw: "Maktaba",
    categoryEn: "Academics",
    categorySw: "Taaluma",
    statNumberEn: "0",
    statUnitEn: "Overdue",
    statNumberSw: "0",
    statUnitSw: "Madeni",
    detailEn: "Catalogs, books and e-vault",
    detailSw: "Katalogi, vitabu na marejeo",
    icon: BookOpen,
    accent: {
      topGradient: "from-sky-500 to-blue-600",
      cardBg: "bg-gradient-to-b from-sky-50/50 via-white to-white",
      borderColor: "border-sky-200/80 hover:border-sky-500",
      iconBg: "bg-sky-100/90 text-sky-900 border-sky-200",
      dotColor: "bg-sky-500",
      unitColor: "text-sky-700",
    },
  },
  {
    href: "/units",
    labelEn: "Unit Registration",
    labelSw: "Usajili wa Kozi",
    categoryEn: "Curriculum",
    categorySw: "Mtaala",
    statNumberEn: "6",
    statUnitEn: "Enrolled",
    statNumberSw: "6",
    statUnitSw: "Kozi",
    detailEn: "Semester courses and requirements",
    detailSw: "Masomo ya muhula na masharti",
    icon: GraduationCap,
    accent: {
      topGradient: "from-indigo-500 to-blue-600",
      cardBg: "bg-gradient-to-b from-indigo-50/50 via-white to-white",
      borderColor: "border-indigo-200/80 hover:border-indigo-500",
      iconBg: "bg-indigo-100/90 text-indigo-900 border-indigo-200",
      dotColor: "bg-indigo-500",
      unitColor: "text-indigo-700",
    },
  },
  {
    href: "/exams",
    labelEn: "Exam Pass and Timetable",
    labelSw: "Ratiba ya Mitihani & Pasi",
    categoryEn: "Assessments",
    categorySw: "Tathmini",
    statNumberEn: "Pass Ready",
    statUnitEn: "",
    statNumberSw: "Pasi Tayari",
    statUnitSw: "",
    detailEn: "Venues, dates and exam cards",
    detailSw: "Ukumbi, tarehe na kadi ya mtihani",
    icon: FileText,
    accent: {
      topGradient: "from-violet-500 to-indigo-600",
      cardBg: "bg-gradient-to-b from-violet-50/50 via-white to-white",
      borderColor: "border-violet-200/80 hover:border-violet-500",
      iconBg: "bg-violet-100/90 text-violet-900 border-violet-200",
      dotColor: "bg-violet-500",
      unitColor: "text-violet-700",
    },
  },
  {
    href: "/hostels",
    labelEn: "Hostels and Residence",
    labelSw: "Bweni na Makazi",
    categoryEn: "Housing",
    categorySw: "Makazi",
    statNumberEn: "Room B-12",
    statUnitEn: "",
    statNumberSw: "Chumba B-12",
    statUnitSw: "",
    detailEn: "Room allocation and residence",
    detailSw: "Ugawaji vyumba na makazi",
    icon: Building,
    accent: {
      topGradient: "from-orange-500 to-amber-600",
      cardBg: "bg-gradient-to-b from-orange-50/50 via-white to-white",
      borderColor: "border-orange-200/80 hover:border-orange-500",
      iconBg: "bg-orange-100/90 text-orange-900 border-orange-200",
      dotColor: "bg-orange-500",
      unitColor: "text-orange-700",
    },
  },
  {
    href: "/results",
    labelEn: "Results",
    labelSw: "Matokeo ya Mitihani",
    categoryEn: "Academics",
    categorySw: "Taaluma",
    statNumberEn: "3.78",
    statUnitEn: "GPA",
    statNumberSw: "3.78",
    statUnitSw: "GPA",
    detailEn: "Semester grades and transcripts",
    detailSw: "Alama za muhula na nakala",
    icon: GraduationCap,
    accent: {
      topGradient: "from-blue-600 to-emerald-500",
      cardBg: "bg-gradient-to-b from-blue-50/50 via-white to-white",
      borderColor: "border-blue-200/80 hover:border-blue-500",
      iconBg: "bg-blue-100/90 text-blue-900 border-blue-200",
      dotColor: "bg-blue-600",
      unitColor: "text-blue-700",
    },
  },
  {
    href: "/feedback",
    labelEn: "Pilot feedback",
    labelSw: "Maoni ya Majaribio",
    categoryEn: "Support",
    categorySw: "Usaidizi",
    statNumberEn: "Build v2.4",
    statUnitEn: "",
    statNumberSw: "Toleo 2.4",
    statUnitSw: "",
    detailEn: "Issue reports and suggestions",
    detailSw: "Ripoti hitilafu na mapendekezo",
    icon: LifeBuoy,
    accent: {
      topGradient: "from-slate-400 to-slate-600",
      cardBg: "bg-gradient-to-b from-slate-50/60 via-white to-white",
      borderColor: "border-slate-200 hover:border-slate-400",
      iconBg: "bg-slate-100 text-slate-800 border-slate-200",
      dotColor: "bg-slate-500",
      unitColor: "text-slate-600",
    },
  },
  {
    href: "/timetable",
    labelEn: "Weekly Timetable",
    labelSw: "Ratiba ya Wiki",
    categoryEn: "Schedule",
    categorySw: "Ratiba",
    statNumberEn: "1",
    statUnitEn: "Today",
    statNumberSw: "1",
    statUnitSw: "Leo",
    detailEn: "Class routines and hall rooms",
    detailSw: "Vipindi vya wiki na kumbi",
    icon: Calendar,
    accent: {
      topGradient: "from-amber-500 to-orange-500",
      cardBg: "bg-gradient-to-b from-amber-50/50 via-white to-white",
      borderColor: "border-amber-200/80 hover:border-amber-500",
      iconBg: "bg-amber-100/90 text-amber-900 border-amber-200",
      dotColor: "bg-amber-500",
      unitColor: "text-amber-700",
    },
  },
  {
    href: "/campus-life",
    labelEn: "Campus Life and Clubs",
    labelSw: "Maisha ya Chuo na Vilabu",
    categoryEn: "Student Life",
    categorySw: "Shughuli",
    statNumberEn: "3",
    statUnitEn: "Active",
    statNumberSw: "3",
    statUnitSw: "Vilabu",
    detailEn: "Societies, sports and events",
    detailSw: "Vyama, michezo na matukio",
    icon: Compass,
    accent: {
      topGradient: "from-teal-500 to-emerald-500",
      cardBg: "bg-gradient-to-b from-teal-50/50 via-white to-white",
      borderColor: "border-teal-200/80 hover:border-teal-500",
      iconBg: "bg-teal-100/90 text-teal-900 border-teal-200",
      dotColor: "bg-teal-500",
      unitColor: "text-teal-700",
    },
  },
  {
    href: "/safety",
    labelEn: "Community and Safety",
    labelSw: "Usalama na Faragha",
    categoryEn: "Emergency",
    categorySw: "Dharura",
    statNumberEn: "24/7",
    statUnitEn: "Desk",
    statNumberSw: "24/7",
    statUnitSw: "Ulinzi",
    detailEn: "Campus security and medical help",
    detailSw: "Ulinzi wa chuo na msaada wa afya",
    icon: ShieldCheck,
    accent: {
      topGradient: "from-emerald-600 to-green-700",
      cardBg: "bg-gradient-to-b from-green-50/50 via-white to-white",
      borderColor: "border-green-200/80 hover:border-green-600",
      iconBg: "bg-green-100/90 text-green-900 border-green-200",
      dotColor: "bg-green-600",
      unitColor: "text-green-700",
    },
  },
  {
    href: "/graduation",
    labelEn: "Graduation and Vault",
    labelSw: "Utoaji wa Shahada & Kibali",
    categoryEn: "Clearances",
    categorySw: "Idhini",
    statNumberEn: "Cleared",
    statUnitEn: "",
    statNumberSw: "Imeidhinishwa",
    statUnitSw: "",
    detailEn: "Certificates and credentials",
    detailSw: "Vyeti na stakabadhi rasmi",
    icon: GraduationCap,
    accent: {
      topGradient: "from-[#C59B27] to-[#0B1D33]",
      cardBg: "bg-gradient-to-b from-amber-50/60 via-white to-white",
      borderColor: "border-amber-300/80 hover:border-[#C59B27]",
      iconBg: "bg-amber-100/90 text-[#0B1D33] border-amber-200",
      dotColor: "bg-[#C59B27]",
      unitColor: "text-[#C59B27]",
    },
  },
  {
    href: "/help-desk",
    labelEn: "Help Desk and Inquiries",
    labelSw: "Dawati la Msaada",
    categoryEn: "Assistance",
    categorySw: "Huduma",
    statNumberEn: "Desk Open",
    statUnitEn: "",
    statNumberSw: "Dawati Wazi",
    statUnitSw: "",
    detailEn: "Service tickets and contacts",
    detailSw: "Tiketi za huduma na mawasiliano",
    icon: LifeBuoy,
    accent: {
      topGradient: "from-cyan-500 to-blue-600",
      cardBg: "bg-gradient-to-b from-cyan-50/50 via-white to-white",
      borderColor: "border-cyan-200/80 hover:border-cyan-500",
      iconBg: "bg-cyan-100/90 text-cyan-900 border-cyan-200",
      dotColor: "bg-cyan-500",
      unitColor: "text-cyan-700",
    },
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
          const statNumber = language === "sw" ? card.statNumberSw : card.statNumberEn;
          const statUnit = language === "sw" ? card.statUnitSw : card.statUnitEn;
          const detail = language === "sw" ? card.detailSw : card.detailEn;

          const isCompactStat = statNumber.length <= 4;

          return (
            <Link
              key={card.href + card.labelEn}
              href={card.href}
              className={`aspect-square flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border ${card.accent.borderColor} ${card.accent.cardBg} shadow-xs hover:shadow-md transition-all text-center group focus:outline-hidden focus:ring-2 focus:ring-[#C59B27] relative overflow-hidden`}
            >
              {/* 3px Creative Top Accent Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accent.topGradient}`} />

              {/* 1. Category Eyebrow with Colored Dot + Icon Badge in Top Right */}
              <div className="w-full flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1.5 truncate pr-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${card.accent.dotColor} shrink-0`} />
                  <span className="font-semibold uppercase tracking-wider text-[8.5px] sm:text-[9.5px] text-[#0B1D33]/70 truncate text-left">
                    {category}
                  </span>
                </div>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${card.accent.iconBg} border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* 2. Big Hero Stat in the Center + 3. Title Below */}
              <div className="flex flex-col items-center justify-center my-auto py-0.5">
                <div
                  className={`font-serif font-black tracking-tight leading-none text-[#0B1D33] ${
                    isCompactStat
                      ? "text-2xl sm:text-3xl"
                      : "text-lg sm:text-xl"
                  }`}
                >
                  {statNumber}
                  {statUnit && (
                    <span className={`ml-1 text-xs sm:text-sm font-sans font-bold ${card.accent.unitColor} tracking-normal`}>
                      {statUnit}
                    </span>
                  )}
                </div>

                <span className="font-serif font-bold text-xs sm:text-sm text-[#0B1D33] leading-tight line-clamp-1 mt-1 group-hover:text-[#0B1D33]">
                  {label}
                </span>
              </div>

              {/* 4. Subtitle at the Bottom */}
              <p className="text-[9.5px] sm:text-[10px] text-slate-500 font-sans leading-tight line-clamp-2 px-0.5 pb-0.5">
                {detail}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
