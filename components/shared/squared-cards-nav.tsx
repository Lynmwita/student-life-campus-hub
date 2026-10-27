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
  statNumberEn: string;
  statUnitEn: string;
  statNumberSw: string;
  statUnitSw: string;
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
    statNumberEn: "2",
    statUnitEn: "New",
    statNumberSw: "2",
    statUnitSw: "Mapya",
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
    statNumberEn: "KES 24.5k",
    statUnitEn: "Due",
    statNumberSw: "KES 24.5k",
    statUnitSw: "Baki",
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
    statNumberEn: "Gate Active",
    statUnitEn: "",
    statNumberSw: "Kinafanya Kazi",
    statUnitSw: "",
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
    statNumberEn: "0",
    statUnitEn: "Overdue",
    statNumberSw: "0",
    statUnitSw: "Madeni",
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
    statNumberEn: "6",
    statUnitEn: "Enrolled",
    statNumberSw: "6",
    statUnitSw: "Kozi",
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
    statNumberEn: "Pass Ready",
    statUnitEn: "",
    statNumberSw: "Pasi Tayari",
    statUnitSw: "",
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
    statNumberEn: "Room B-12",
    statUnitEn: "",
    statNumberSw: "Chumba B-12",
    statUnitSw: "",
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
    statNumberEn: "3.78",
    statUnitEn: "GPA",
    statNumberSw: "3.78",
    statUnitSw: "GPA",
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
    statNumberEn: "Build v2.4",
    statUnitEn: "",
    statNumberSw: "Toleo 2.4",
    statUnitSw: "",
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
    statNumberEn: "1",
    statUnitEn: "Today",
    statNumberSw: "1",
    statUnitSw: "Leo",
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
    statNumberEn: "3",
    statUnitEn: "Active",
    statNumberSw: "3",
    statUnitSw: "Vilabu",
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
    statNumberEn: "24/7",
    statUnitEn: "Desk",
    statNumberSw: "24/7",
    statUnitSw: "Ulinzi",
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
    statNumberEn: "Cleared",
    statUnitEn: "",
    statNumberSw: "Imeidhinishwa",
    statUnitSw: "",
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
    statNumberEn: "Desk Open",
    statUnitEn: "",
    statNumberSw: "Dawati Wazi",
    statUnitSw: "",
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
          const statNumber = language === "sw" ? card.statNumberSw : card.statNumberEn;
          const statUnit = language === "sw" ? card.statUnitSw : card.statUnitEn;
          const detail = language === "sw" ? card.detailSw : card.detailEn;

          const isCompactStat = statNumber.length <= 4;

          return (
            <Link
              key={card.href + card.labelEn}
              href={card.href}
              className="aspect-square flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border border-[#C59B27]/40 bg-white shadow-xs hover:border-[#C59B27] hover:shadow-sm transition-all text-center group focus:outline-hidden focus:ring-2 focus:ring-[#C59B27]"
            >
              {/* 1. Category Eyebrow at Top */}
              <div className="w-full flex items-center justify-between text-[8.5px] sm:text-[9.5px]">
                <span className="font-semibold uppercase tracking-wider text-[#0B1D33]/65 truncate text-left">
                  {category}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27]/40 shrink-0" />
              </div>

              {/* 2. Big Hero Stat in the Center with the Icon + 3. Title Below */}
              <div className="flex flex-col items-center justify-center my-auto py-1">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1">
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#C59B27] shrink-0 group-hover:scale-110 transition-transform" />
                  <div
                    className={`font-serif font-black tracking-tight leading-none text-[#0B1D33] ${
                      isCompactStat
                        ? "text-2xl sm:text-3xl"
                        : "text-lg sm:text-xl"
                    }`}
                  >
                    {statNumber}
                    {statUnit && (
                      <span className="ml-1 text-xs sm:text-sm font-sans font-bold text-[#C59B27] tracking-normal">
                        {statUnit}
                      </span>
                    )}
                  </div>
                </div>

                <span className="font-serif font-bold text-xs sm:text-sm text-[#0B1D33] leading-tight line-clamp-1">
                  {label}
                </span>
              </div>

              {/* 4. Subtitle at the Bottom */}
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
