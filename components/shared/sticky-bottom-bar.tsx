"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShieldAlert, LifeBuoy, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export interface BottomBarItem {
  href: string;
  labelEn: string;
  labelSw: string;
  icon: React.ComponentType<{ className?: string }>;
  exactMatch?: boolean;
}

export const BOTTOM_BAR_ITEMS: BottomBarItem[] = [
  {
    href: "/dashboard",
    labelEn: "Home",
    labelSw: "Mwanzo",
    icon: Home,
    exactMatch: true,
  },
  {
    href: "/safety",
    labelEn: "SOS",
    labelSw: "SOS",
    icon: ShieldAlert,
    exactMatch: false,
  },
  {
    href: "/help-desk",
    labelEn: "Help Desk",
    labelSw: "Msaada",
    icon: LifeBuoy,
    exactMatch: false,
  },
  {
    href: "/profile",
    labelEn: "Profile",
    labelSw: "Wasifu",
    icon: User,
    exactMatch: false,
  },
];

export function StickyBottomBar() {
  const pathname = usePathname();
  const { language } = useLanguage();

  return (
    <nav
      aria-label="Bottom Bar Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1D33] border-t border-[#C59B27]/30 shadow-lg backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-around h-16 px-2 sm:px-6">
        {BOTTOM_BAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exactMatch
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const label = language === "sw" ? item.labelSw : item.labelEn;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all group ${
                isActive
                  ? "text-[#FCD34D]"
                  : "text-slate-400 hover:text-white"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={`relative flex items-center justify-center p-1 rounded-lg transition-transform group-hover:scale-105 ${
                  isActive ? "bg-[#06101E] border border-[#C59B27]/40 shadow-xs" : ""
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-[#FCD34D]" : "text-slate-400 group-hover:text-white"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] sm:text-xs font-serif font-semibold tracking-wide mt-0.5 leading-none ${
                  isActive ? "text-[#FCD34D]" : "text-slate-400 group-hover:text-white"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
