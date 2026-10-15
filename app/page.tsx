import Link from "next/link";
import { GraduationCap, ArrowRight, ShieldCheck, Megaphone, Calendar, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#06101E] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-[#06101E] bg-[#0B1D33] text-white px-4 py-3.5 sm:px-6 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#06101E] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-sm tracking-tight text-white">
              Student Life & Campus Hub
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#C59B27]/40 text-[#FCD34D] hover:bg-[#06101E] hover:border-[#C59B27]"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FCD34D]" />
          The University Follows The Student
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-[#0B1D33] dark:text-white max-w-2xl leading-[1.15]">
          Official Campus Communications, Clean & Real-Time.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl font-sans">
          Say goodbye to noisy WhatsApp groups and missed noticeboards. Connect directly to your verified university tenant for targeted broadcasts, priority alerts, and academic lecture timetables.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-3.5 bg-[#0B1D33] text-white hover:bg-[#06101E] border border-[#C59B27]/40 hover:border-[#C59B27]"
            >
              Sign In to Campus Hub <ArrowRight className="w-4 h-4 ml-2 text-[#FCD34D]" />
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base px-6 border-[#C59B27]/40 text-[#0B1D33] dark:text-[#FCD34D] hover:bg-[#0B1D33]/5"
            >
              Preview Broadcast Feed
            </Button>
          </Link>
        </div>

        {/* Feature Transparency Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left w-full">
          <div className="p-5 rounded-xl bg-white dark:bg-[#06101E] border border-[#C59B27]/30 hover:border-[#C59B27]/70 transition-all space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B1D33] dark:text-[#FCD34D] bg-[#0B1D33]/5 dark:bg-white/10 px-2 py-0.5 rounded border border-[#C59B27]/30">
                Active • Phase 4
              </span>
            </div>
            <h3 className="font-serif font-bold text-sm text-[#0B1D33] dark:text-white">
              Targeted Broadcasts
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Prioritized P1 to P4 official notices filtered specifically to your campus, faculty, and year of study.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#06101E] border border-[#C59B27]/30 hover:border-[#C59B27]/70 transition-all space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B1D33] dark:text-[#FCD34D] bg-[#0B1D33]/5 dark:bg-white/10 px-2 py-0.5 rounded border border-[#C59B27]/30">
                Active • Phase 5
              </span>
            </div>
            <h3 className="font-serif font-bold text-sm text-[#0B1D33] dark:text-white">
              Course Timetables & Campus Life
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Live course schedules, lecture venues, instructor details, and student club communities.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#06101E] border border-[#C59B27]/30 hover:border-[#C59B27]/70 transition-all space-y-2 shadow-xs opacity-90">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Roadmap • Phase 6
              </span>
            </div>
            <h3 className="font-serif font-bold text-sm text-[#0B1D33] dark:text-white">
              Direct Student Help Desk
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Submit academic inquiries with unique tracking codes and status timelines arriving in Phase 6.
            </p>
          </div>
        </div>
      </main>

      {/* Footer in Deep Navy */}
      <footer className="bg-[#06101E] border-t border-[#C59B27]/20 py-6 text-center text-xs text-slate-400 font-sans">
        <p>© 2026 Student Life & Campus Hub • Built for Kenyan Universities.</p>
      </footer>
    </div>
  );
}
