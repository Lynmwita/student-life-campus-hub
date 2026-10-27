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
    detailEn: "Official alerts and circulars",
    detailSw: "Taarifa na matangazo rasmi",
    icon: Megaphone,
  },
  {
    href: "/fees",
    labelEn: "Fee Statement",
    labelSw: "Ada za Masomo",
    categoryEn: "Finance",
    categorySw: "Fedha",
    detailEn: "Ledger, balance and receipts",
    detailSw: "Daftari, baki na risiti",
    icon: Receipt,
  },
  {
    href: "/student-id",
    labelEn: "Digital Student ID",
    labelSw: "Kitambulisho cha Mwanafunzi",
    categoryEn: "Identity",
    categorySw: "Kitambulisho",
    detailEn: "Gate barcode and credentials",
    detailSw: "Msimbo wa geti na stakabadhi",
    icon: IdCard,
  },
  {
    href: "/library",
    labelEn: "Library",
    labelSw: "Maktaba",
    categoryEn: "Academics",
    categorySw: "Taaluma",
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
    detailEn: "Semester course enrolment",
    detailSw: "Usajili wa masomo ya muhula",
    icon: GraduationCap,
  },
  {
    href: "/exams",
    labelEn: "Exam Pass and Timetable",
    labelSw: "Ratiba ya Mitihani & Pasi",
    categoryEn: "Assessments",
    categorySw: "Tathmini",
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
    detailEn: "Room allocations and bookings",
    detailSw: "Ugawaji vyumba na nafasi",
    icon: Building,
  },
  {
    href: "/results",
    labelEn: "Results",
    labelSw: "Matokeo ya Mitihani",
    categoryEn: "Academics",
    categorySw: "Taaluma",
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
    detailEn: "Campus security and first aid",
    detailSw: "Ulinzi wa chuo na huduma ya kwanza",
    icon: ShieldCheck,
  },
  {
    href: "/graduation",
    labelEn: "Graduation and Vault",
    labelSw: "Utoaji wa Shahada & Kibali",
    categoryEn: "Clearances",
    categorySw: "Idhini",
    detailEn: "Certificates, clearances and gowns",
    detailSw: "Vyeti, idhini na mavazi",
    icon: GraduationCap,
  },
  {
    href: "/help-desk",
    labelEn: "Help Desk and Inquiries",
    labelSw: "Dawati la Msaada",
    categoryEn: "Assistance",
    categorySw: "Huduma",
    detailEn: "Service tickets and contacts",
    detailSw: "Tiketi za msaada na mawasiliano",
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
          const detail = language === "sw" ? card.detailSw : card.detailEn;

          return (
            <Link
              key={card.href + card.labelEn}
              href={card.href}
              className="aspect-square flex flex-col items-center justify-between p-3 sm:p-3.5 rounded-xl border border-[#C59B27]/40 bg-white shadow-xs hover:border-[#C59B27] hover:shadow-sm transition-all text-center group focus:outline-hidden focus:ring-2 focus:ring-[#C59B27]"
            >
              <div className="w-full flex items-center justify-center">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#C59B27] bg-[#C59B27]/10 px-2 py-0.5 rounded-full border border-[#C59B27]/20">
                  {category}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center my-auto">
                <div className="w-10 h-10 rounded-full bg-[#0B1D33]/5 border border-[#C59B27]/25 flex items-center justify-center text-[#0B1D33] group-hover:bg-[#0B1D33] group-hover:text-[#FCD34D] transition-all mb-1 sm:mb-1.5">
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <span className="font-serif font-bold text-xs sm:text-sm text-[#0B1D33] leading-tight line-clamp-1">
                  {label}
                </span>
              </div>

              <p className="text-[10px] sm:text-[11px] text-slate-500 font-sans leading-tight line-clamp-2 px-0.5">
                {detail}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
