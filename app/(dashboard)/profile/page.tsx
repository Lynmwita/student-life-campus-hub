"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  BookOpen,
  Calendar,
  Compass,
  LifeBuoy,
  LogOut,
  Mail,
  User,
  Sparkles,
  Award,
  CheckCircle2,
} from "lucide-react";
import { AppHeader } from "@/components/shared/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOutAction, getUserRoleAction } from "@/lib/actions/auth";
import { getStudentOnboardingDataAction, type StudentStudiesData } from "@/lib/actions/interests";

export default function ProfilePage() {
  const [studies, setStudies] = React.useState<StudentStudiesData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userInfo, setUserInfo] = React.useState<{
    email?: string | null;
    fullName?: string | null;
    role?: string | null;
    registrationNumber?: string | null;
  }>({});

  React.useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      try {
        const [roleRes, studiesRes] = await Promise.all([
          getUserRoleAction(),
          getStudentOnboardingDataAction(),
        ]);

        if (!ignore) {
          if (roleRes.isAuthenticated) {
            setUserInfo({
              email: roleRes.email,
              fullName: roleRes.fullName,
              role: roleRes.role,
              registrationNumber: roleRes.registrationNumber,
            });
          }
          if (studiesRes.success && studiesRes.studies) {
            setStudies(studiesRes.studies);
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 flex flex-col items-center justify-center">
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-sm w-full space-y-3">
            <div className="w-8 h-8 border-2 border-[#0B1D33] border-t-[#C59B27] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading profile credentials & status...</p>
          </div>
        </main>
      </div>
    );
  }

  const isStaffOrAdmin = userInfo.role === "staff" || userInfo.role === "admin" || userInfo.role === "super_admin";
  const fullName = userInfo.fullName || studies?.fullName || (isStaffOrAdmin ? "University Administrator" : "Student");
  const email = userInfo.email || studies?.email || "";
  const regNumber = userInfo.registrationNumber || studies?.registrationNumber || (isStaffOrAdmin ? "STAFF/OFFICIAL" : "");
  const program = isStaffOrAdmin ? "Institutional Administration & Governance" : (studies?.programOfStudy || "Bachelor of Science in Information Technology");
  const faculty = isStaffOrAdmin ? "Administrative Directorate" : (studies?.faculty || "School of Computing & Informatics");
  const department = isStaffOrAdmin ? "Enterprise Administration" : (studies?.department || "Department of Information Technology");
  const yearOfStudy = studies?.yearOfStudy || 1;
  const semester = studies?.semester || 1;
  const university = studies?.universityName || "Summit Metropolitan University";
  const campus = studies?.campusName || "Main Campus (Westlands, Nairobi)";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <AppHeader universityName={university} campusName={campus} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Profile Masthead Card */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0B1D33] to-[#06101E] border border-[#C59B27]/40 p-6 sm:p-8 text-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#06101E] border-2 border-[#C59B27] flex items-center justify-center text-[#FCD34D] font-serif font-black text-2xl sm:text-3xl shadow-sm">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {isStaffOrAdmin ? "Verified University Official" : "Verified Active Enrollment"}
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
                  {fullName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                  <span className="font-mono text-[#FCD34D] font-bold">{regNumber}</span>
                  <span>•</span>
                  <span>{email}</span>
                </p>
              </div>
            </div>

            <form action={signOutAction} className="shrink-0">
              <Button
                type="submit"
                variant="outline"
                className="border-red-900/60 bg-red-950/30 text-red-200 hover:bg-red-900/40 hover:border-red-600 text-xs flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                Sign Out of Portal
              </Button>
            </form>
          </div>
        </div>

        {/* Academic Enrollment Identity Details */}
        <Card className="p-6 border-[#C59B27]/30 bg-white shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-serif font-bold text-base text-[#0B1D33] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#C59B27]" />
              Official Registrar Academic Records
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              UAMS Synced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Degree Program
              </span>
              <span className="text-sm font-bold text-[#0B1D33] block">
                {program}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Academic Standing
              </span>
              <span className="text-sm font-bold text-[#0B1D33] block">
                Year {yearOfStudy} • Semester {semester}
              </span>
              <span className="text-xs text-slate-500">Full-Time Undergraduate</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Registration / Student ID
              </span>
              <span className="text-sm font-mono font-bold text-[#0B1D33] block">
                {regNumber}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">Active In Registrar</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Faculty & Department
              </span>
              <span className="text-sm font-bold text-[#0B1D33] block">
                {faculty}
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">
                {department}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Enrolled Campus
              </span>
              <span className="text-sm font-bold text-[#0B1D33] block">
                {campus}
              </span>
              <span className="text-xs text-slate-500">Timetable Scoped</span>
            </div>
          </div>
        </Card>

        {/* Quick Links & Services */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/timetable">
            <Card className="p-4 border-[#C59B27]/25 hover:border-[#C59B27] bg-white transition-all shadow-xs group cursor-pointer">
              <Calendar className="w-6 h-6 text-[#C59B27] mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                Weekly Timetable
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                View lecture halls, times, and unit schedules.
              </p>
            </Card>
          </Link>

          <Link href="/help-desk">
            <Card className="p-4 border-[#C59B27]/25 hover:border-[#C59B27] bg-white transition-all shadow-xs group cursor-pointer">
              <LifeBuoy className="w-6 h-6 text-[#C59B27] mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                Student Help Desk
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                File queries, track issues, or submit academic grievance reviews.
              </p>
            </Card>
          </Link>

          <Link href="/campus-life">
            <Card className="p-4 border-[#C59B27]/25 hover:border-[#C59B27] bg-white transition-all shadow-xs group cursor-pointer">
              <Compass className="w-6 h-6 text-[#C59B27] mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                Campus Life & Clubs
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Discover guilds, sports clubs, fellowships, and tech societies.
              </p>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
