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
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_CARDS: NavCardItem[] = [
  {
    href: "/dashboard",
    labelEn: "Campus Feed",
    labelSw: "Mlisho wa Chuo",
    icon: Megaphone,
  },
  {
    href: "/fees",
    labelEn: "Fee Statement",
    labelSw: "Ada za Masomo",
    icon: Receipt,
  },
  {
    href: "/student-id",
    labelEn: "Digital Student ID",
    labelSw: "Kitambulisho cha Mwanafunzi",
    icon: IdCard,
  },
  {
    href: "/library",
    labelEn: "Library",
    labelSw: "Maktaba",
    icon: BookOpen,
  },
  {
    href: "/units",
    labelEn: "Unit Registration",
    labelSw: "Usajili wa Kozi",
    icon: GraduationCap,
  },
  {
    href: "/exams",
    labelEn: "Exam Pass and Timetable",
    labelSw: "Ratiba ya Mitihani & Pasi",
    icon: FileText,
  },
  {
    href: "/hostels",
    labelEn: "Hostels and Residence",
    labelSw: "Bweni na Makazi",
    icon: Building,
  },
  {
    href: "/results",
    labelEn: "Results",
    labelSw: "Matokeo ya Mitihani",
    icon: GraduationCap,
  },
  {
    href: "/feedback",
    labelEn: "Pilot feedback",
    labelSw: "Maoni ya Majaribio",
    icon: LifeBuoy,
  },
  {
    href: "/timetable",
    labelEn: "Weekly Timetable",
    labelSw: "Ratiba ya Wiki",
    icon: Calendar,
  },
  {
    href: "/campus-life",
    labelEn: "Campus Life and Clubs",
    labelSw: "Maisha ya Chuo na Vilabu",
    icon: Compass,
  },
  {
    href: "/safety",
    labelEn: "Community and Safety",
    labelSw: "Usalama na Faragha",
    icon: ShieldCheck,
  },
  {
    href: "/graduation",
    labelEn: "Graduation and Vault",
    labelSw: "Utoaji wa Shahada & Kibali",
    icon: GraduationCap,
  },
  {
    href: "/help-desk",
    labelEn: "Help Desk and Inquiries",
    labelSw: "Dawati la Msaada",
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
          return (
            <Link
              key={card.href + card.labelEn}
              href={card.href}
              className="aspect-square flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-[#C59B27]/40 bg-white shadow-xs hover:border-[#C59B27] hover:shadow-sm transition-all text-center group focus:outline-hidden focus:ring-2 focus:ring-[#C59B27]"
            >
              <div className="flex items-center justify-center mb-2.5 sm:mb-3">
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#0B1D33] group-hover:scale-105 transition-transform" />
              </div>
              <span className="font-serif font-bold text-xs sm:text-sm text-[#0B1D33] leading-snug line-clamp-2 px-1">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
