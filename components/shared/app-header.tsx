"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  MapPin,
  Megaphone,
  Calendar,
  Compass,
  LifeBuoy,
  User,
  LogOut,
  ShieldAlert,
  PlusCircle,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction, getUserRoleAction } from "@/lib/actions/auth";

interface AppHeaderProps {
  universityName?: string;
  campusName?: string;
}

export function AppHeader({
  universityName = "Summit Metropolitan University",
  campusName = "Main Campus (Westlands)",
}: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
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

  const navLinks = [
    { href: "/dashboard", label: "Campus Feed", icon: Megaphone },
    { href: "/timetable", label: "Weekly Timetable", icon: Calendar },
    { href: "/campus-life", label: "Campus Life & Clubs", icon: Compass },
    { href: "/help-desk", label: "Help Desk & Inquiries", icon: LifeBuoy },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0B1D33] text-white border-b border-[#06101E] px-4 py-2.5 sm:px-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & University */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#06101E] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D] transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-sm text-white leading-tight">
                {universityName}
              </h1>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 font-sans">
                <MapPin className="w-3 h-3 text-[#FCD34D]" /> {campusName}
              </p>
            </div>
          </Link>

          {/* Right actions: Staff/Admin Links (only if staff) + Profile + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            {userInfo.isStaff && (
              <>
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#C59B27]/40 text-[#FCD34D] hover:text-white hover:bg-[#06101E]"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-1 text-[#FCD34D]" />
                    Staff Console
                  </Button>
                </Link>
                <Link href="/announcements/new" className="hidden sm:inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-700 text-slate-300 hover:bg-[#06101E]"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1 text-[#FCD34D]" />
                    Post Notice
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
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-xs border-red-900/40 text-red-300 hover:bg-red-950/40 hover:text-red-200 hover:border-red-700 flex items-center gap-1.5 px-2.5"
                title="Sign out of your session"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-1.5 text-slate-300 hover:text-white"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-slate-800 space-y-1 pb-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive
                      ? "bg-[#06101E] text-[#FCD34D] border border-[#C59B27]/30"
                      : "text-slate-300 hover:bg-[#06101E]/50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#C59B27]" />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-[#06101E]/50"
            >
              <User className="w-4 h-4 text-[#C59B27]" />
              My Academic Profile
            </Link>
          </div>
        )}
      </header>

      {/* Desktop Navigation Sub-bar */}
      <nav className="bg-[#06101E] border-b border-[#C59B27]/20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-xs font-semibold overflow-x-auto py-2.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`pb-1 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-[#FCD34D] border-b-2 border-[#C59B27]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#FCD34D]" : ""}`} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
