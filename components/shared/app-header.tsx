"use client";

import * as React from "react";
import {clearPrivateOffline,setOfflineAccount} from "@/lib/offline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  MapPin,
  User,
  LogOut,
  ShieldAlert,
  PlusCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction, getUserRoleAction } from "@/lib/actions/auth";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { OfflineStatusBanner } from "@/components/shared/offline-status-banner";
import { useLanguage } from "@/lib/i18n/context";
import { NAV_CARDS } from "@/components/shared/squared-cards-nav";

interface AppHeaderProps {
  universityName?: string;
  campusName?: string;
}

export function AppHeader({
  universityName = "Your university",
  campusName = "Your campus",
}: AppHeaderProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [userInfo, setUserInfo] = React.useState<{
    isAuthenticated: boolean;
    role: string;
    email?: string | null;
    fullName?: string | null;
    isAdmin: boolean;
    isStaff: boolean;
  }>({
    isAuthenticated: false,
    role: "student",
    email: null,
    fullName: null,
    isAdmin: false,
    isStaff: false,
  });

  React.useEffect(() => {
    let ignore = false;
    async function loadUser() {
      try {
        const res = await getUserRoleAction();
        if (!ignore && res.isAuthenticated) {
          if (res.accountId || res.email) setOfflineAccount(res.accountId || res.email!);
          else clearPrivateOffline();
          const isStaffOrAdmin =
            res.role === "staff" ||
            res.role === "admin" ||
            res.role === "super_admin";
          setUserInfo({
            isAuthenticated: true,
            role: res.role,
            email: res.email || null,
            fullName: res.fullName || res.email?.split("@")[0] || "User",
            isAdmin: res.role === "admin" || res.role === "super_admin",
            isStaff: isStaffOrAdmin,
          });
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
      }
    }
    loadUser();
    return () => {
      ignore = true;
    };
  }, []);

  const currentNav = NAV_CARDS.find((item) =>
    pathname.startsWith(item.href) && item.href !== "/dashboard"
      ? true
      : pathname === item.href
  );

  return (
    <>
      <OfflineStatusBanner />
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0B1D33] text-white border-b border-[#06101E] px-4 py-2.5 sm:px-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & University */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#06101E] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D] transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div suppressHydrationWarning>
              <div className="flex items-center gap-1.5" suppressHydrationWarning>
                <h1 className="font-serif font-bold text-sm text-white leading-tight" suppressHydrationWarning>
                  {universityName}
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#C59B27]/25 text-[#FCD34D] border border-[#C59B27]/50 tracking-wider uppercase">
                  Internal Test Build
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 font-sans" suppressHydrationWarning>
                <MapPin className="w-3 h-3 text-[#FCD34D]" /> {campusName}
              </p>
            </div>
          </Link>

          {/* Right actions: Language Toggle + Staff/Admin Links + Profile + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />

            {userInfo.isStaff && (
              <>
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#C59B27]/40 text-[#FCD34D] hover:text-white hover:bg-[#06101E]"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-1 text-[#FCD34D]" />
                    {language === "sw" ? "Wafanyakazi" : "Staff Console"}
                  </Button>
                </Link>
                <Link href="/announcements/new" className="hidden sm:inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-700 text-slate-300 hover:bg-[#06101E]"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1 text-[#FCD34D]" />
                    {language === "sw" ? "Tangazo" : "Post Notice"}
                  </Button>
                </Link>
              </>
            )}

            {/* Profile & Identity */}
            <Link
              href="/profile"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-xs ${
                pathname === "/profile"
                  ? "border-[#C59B27] bg-[#06101E] text-[#FCD34D]"
                  : "border-slate-800 hover:border-[#C59B27]/40 hover:bg-[#06101E]/60 text-slate-200"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#06101E] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D] font-bold text-[10px]">
                {userInfo.fullName ? userInfo.fullName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="font-semibold text-white max-w-[120px] truncate">
                  {userInfo.fullName || "Student"}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {userInfo.role}
                </span>
              </div>
            </Link>

            {/* Sign Out Button */}
            <form action={signOutAction} onSubmit={clearPrivateOffline}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-xs border-red-900/40 text-red-300 hover:bg-red-950/40 hover:text-red-200 hover:border-red-700 flex items-center gap-1.5 px-2.5"
                title="Sign out of your session"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">{language === "sw" ? "Toka" : "Sign Out"}</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Clear back control inside any section returning to the navigation grid */}
      {pathname !== "/dashboard" && pathname !== "/" && (
        <nav aria-label="Section navigation" className="bg-[#06101E] border-b border-[#C59B27]/20 px-4 sm:px-6 py-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#FCD34D] hover:text-white transition-colors group py-1"
              aria-label={language === "sw" ? "Rudi kwenye Menyu Kuu" : "Back to Navigation"}
            >
              <ArrowLeft className="w-4 h-4 text-[#C59B27] group-hover:-translate-x-0.5 transition-transform" />
              <span>{language === "sw" ? "Rudi kwenye Menyu Kuu" : "Back to Navigation"}</span>
            </Link>
            {currentNav && (
              <span className="text-[11px] font-sans font-medium text-slate-300">
                {language === "sw" ? currentNav.labelSw : currentNav.labelEn}
              </span>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
