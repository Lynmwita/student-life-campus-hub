"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  CheckCircle2,
  Search,
  Sparkles,
  Bell,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  KENYAN_CAMPUS_DIRECTORY,
  CAREER_ALERT_TRACKS,
  NOTIFICATION_STYLE_OPTIONS,
} from "@/lib/constants/campus-directory";
import {
  StudentStudiesData,
  completeSmartOnboardingAction,
  getStudentOnboardingDataAction,
} from "@/lib/actions/interests";

const DEFAULT_STUDIES: StudentStudiesData = {
  fullName: "Alex Mutua",
  email: "alex.mutua@summit.ac.ke",
  registrationNumber: "BIT/2023/8849",
  universityName: "Summit Metropolitan University",
  campusName: "Main Campus (Westlands, Nairobi)",
  faculty: "School of Computing & Informatics",
  department: "Computer Science",
  programOfStudy: "Bachelor of Science in Information Technology",
  yearOfStudy: 2,
  semester: 1,
  verificationStatus: "verified",
  isPreFilled: true,
};

interface SmartOnboardingWizardProps {
  initialStudies?: StudentStudiesData;
}

export default function SmartOnboardingWizard({
  initialStudies,
}: SmartOnboardingWizardProps = {}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);
  const [studies, setStudies] = React.useState<StudentStudiesData>(
    initialStudies || DEFAULT_STUDIES
  );

  // Step 1 State: Studies Confirmation (starts unchecked)
  const [studiesConfirmed, setStudiesConfirmed] = React.useState(false);

  // Step 2 State: Community Selection (starts with zero pre-selected communities)
  const [selectedCommunityIds, setSelectedCommunityIds] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  // Step 3 State: Personalization
  const [notificationStyle, setNotificationStyle] = React.useState<string>("smart_digest");
  const [selectedCareerTracks, setSelectedCareerTracks] = React.useState<string[]>([
    "software_engineering",
    "hackathons_competitions",
  ]);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load latest data on mount
  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getStudentOnboardingDataAction();
        if (!ignore && res.success && res.studies) {
          setStudies(res.studies);
          if (res.savedInterests?.length > 0) {
            const matched = KENYAN_CAMPUS_DIRECTORY.filter((c) =>
              res.savedInterests.includes(c.canonicalInterestId)
            ).map((c) => c.id);
            if (matched.length > 0) {
              setSelectedCommunityIds(matched);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load student studies in wizard", e);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Filter communities by category and query
  const filteredCommunities = React.useMemo(() => {
    return KENYAN_CAMPUS_DIRECTORY.filter((comm) => {
      const matchesCategory =
        selectedCategory === "all" || comm.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        comm.name.toLowerCase().includes(q) ||
        comm.description.toLowerCase().includes(q) ||
        comm.tags.some((t) => t.toLowerCase().includes(q)) ||
        (comm.patronName && comm.patronName.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Faculty-matched suggestions for Step 3
  const facultyMatchedCommunities = React.useMemo(() => {
    const studentFaculty = studies.faculty?.toLowerCase() || "";
    const matched = KENYAN_CAMPUS_DIRECTORY.filter((c) => {
      if (!c.facultyMatches) return false;
      return c.facultyMatches.some(
        (f) =>
          studentFaculty.includes(f.toLowerCase()) ||
          (studentFaculty.includes("computing") && f.toLowerCase().includes("computing"))
      );
    });
    return matched.slice(0, 4);
  }, [studies.faculty]);

  function toggleCommunity(id: string) {
    setError(null);
    setSelectedCommunityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleCareerTrack(id: string) {
    setSelectedCareerTracks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  const meetsStep2Requirement = selectedCommunityIds.length >= 3;

  async function handleFinalSubmit() {
    if (!studiesConfirmed) {
      setError("Please confirm your academic studies records in Step 1.");
      setCurrentStep(1);
      return;
    }

    if (selectedCommunityIds.length < 3) {
      setError("Please select at least 3 campus communities to personalize your hub.");
      setCurrentStep(2);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await completeSmartOnboardingAction({
        studiesConfirmed,
        communityIds: selectedCommunityIds,
        notificationStyle,
        careerAlertTracks: selectedCareerTracks,
      });

      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.message);
        setSaving(false);
      }
    } catch {
      setError("An unexpected error occurred while completing onboarding. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Top Institutional Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 text-xs font-semibold shadow-xs">
            <GraduationCap className="w-3.5 h-3.5 text-[#FCD34D]" />
            Official University Matriculation
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#0B1D33]">
            Smart Student Onboarding
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-sans">
            Personalize your collegiate hub in three simple steps: verify your enrolled studies, choose your campus societies, and set your academic alerts.
          </p>
        </div>

        {/* 3-Step Collegiate Stepper */}
        <div className="relative border-b border-[#C59B27]/25 pb-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2.5 text-xs font-semibold transition-colors ${
                currentStep === 1
                  ? "text-[#0B1D33]"
                  : "text-slate-600 hover:text-[#0B1D33]"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                  currentStep === 1
                    ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                    : currentStep > 1
                    ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                    : "bg-white text-slate-400 border-slate-300"
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
              </span>
              <span className="hidden sm:inline">1. Confirm Studies</span>
            </button>

            <div className="h-0.5 flex-1 mx-3 bg-[#C59B27]/20" />

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (studiesConfirmed) setCurrentStep(2);
              }}
              className={`flex items-center gap-2.5 text-xs font-semibold transition-colors ${
                currentStep === 2
                  ? "text-[#0B1D33]"
                  : "text-slate-600 hover:text-[#0B1D33]"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                  currentStep === 2
                    ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                    : currentStep > 2
                    ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                    : "bg-white text-slate-400 border-slate-300"
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
              </span>
              <span className="hidden sm:inline">2. Pick Communities</span>
            </button>

            <div className="h-0.5 flex-1 mx-3 bg-[#C59B27]/20" />

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                if (meetsStep2Requirement) setCurrentStep(3);
              }}
              className={`flex items-center gap-2.5 text-xs font-semibold transition-colors ${
                currentStep === 3
                  ? "text-[#0B1D33]"
                  : "text-slate-600 hover:text-[#0B1D33]"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                  currentStep === 3
                    ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                    : "bg-white text-slate-400 border-slate-300"
                }`}
              >
                3
              </span>
              <span className="hidden sm:inline">3. Smart Personalization</span>
            </button>
          </div>
        </div>

        {/* Error notification alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: CONFIRM PRE-FILLED STUDIES                             */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0B1D33]">
                  Step 1: Confirm Enrolled Academic Studies
                </h2>
                <p className="text-xs text-slate-600 font-sans mt-0.5">
                  Pre-filled directly from the University Academic Management System (UAMS) registry.
                </p>
              </div>
              <Badge variant="info" className="text-xs">
                Verified Registration Record
              </Badge>
            </div>

            {/* Academic Credentials Card */}
            <Card className="border border-[#C59B27]/30 bg-white p-6 shadow-xs space-y-6">
              {/* Institution Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#C59B27]/20 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0B1D33] flex items-center justify-center text-[#FCD34D] border border-[#C59B27]/40 shadow-xs">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[#0B1D33] text-base">
                      {studies.universityName}
                    </h3>
                    <p className="text-xs text-slate-600 font-sans">
                      {studies.campusName} • Academic Year 2026/2027
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Active Enrollment
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Full Student Name
                  </div>
                  <div className="text-sm font-bold text-[#0B1D33] font-sans">
                    {studies.fullName}
                  </div>
                  <div className="text-xs text-slate-500 font-sans">{studies.email}</div>
                </div>

                <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Registration Number
                  </div>
                  <div className="text-sm font-mono font-bold text-[#0B1D33]">
                    {studies.registrationNumber}
                  </div>
                  <div className="text-xs text-emerald-600 font-semibold">
                    Registrar Synced
                  </div>
                </div>

                <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Academic Standing
                  </div>
                  <div className="text-sm font-bold text-[#0B1D33] font-sans">
                    Year {studies.yearOfStudy} • Semester {studies.semester}
                  </div>
                  <div className="text-xs text-slate-500 font-sans">Full-Time Undergraduate</div>
                </div>

                <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Degree / Academic Program
                  </div>
                  <div className="text-sm font-bold text-[#0B1D33] font-sans">
                    {studies.programOfStudy}
                  </div>
                  <div className="text-xs text-slate-500 font-sans">
                    {studies.faculty} • {studies.department}
                  </div>
                </div>

                <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Campus
                  </div>
                  <div className="text-sm font-bold text-[#0B1D33] font-sans">
                    {studies.campusName}
                  </div>
                  <div className="text-xs text-slate-500 font-sans">Timetables mapped</div>
                </div>
              </div>

              {/* Student Attestation Checkbox */}
              <div className="pt-2 border-t border-[#C59B27]/20">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={studiesConfirmed}
                    onChange={(e) => setStudiesConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0B1D33] focus:ring-[#C59B27]"
                  />
                  <div className="text-xs leading-relaxed text-slate-700 font-sans">
                    <span className="font-semibold text-[#0B1D33]">
                      I confirm these academic records match my university admission.
                    </span>{" "}
                    My personalized academic timetable and official notices will be scoped to this department and cohort.
                  </div>
                </label>
              </div>

              {/* Discrepancy Note */}
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed font-sans">
                <span className="font-semibold">Notice an academic discrepancy?</span> Your profile is synchronized with UAMS. You can safely complete onboarding today, and request adjustments with the Registrar&apos;s office through the student help desk.
              </div>
            </Card>

            {/* Navigation Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!studiesConfirmed}
                className="bg-[#0B1D33] hover:bg-[#0B1D33]/90 text-white border border-[#C59B27]/40 font-semibold px-6 py-2.5 h-auto text-sm gap-2 shadow-xs"
              >
                <span>Confirm & Pick Communities</span>
                <ArrowRight className="w-4 h-4 text-[#FCD34D]" />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PICK COMMUNITIES                                       */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0B1D33]">
                  Step 2: Join Kenyan Campus Societies & Fellowships
                </h2>
                <p className="text-xs text-slate-600 font-sans mt-0.5">
                  Select at least 3 communities to join their event feeds, discussion circles, and notices.
                </p>
              </div>

              {/* Requirement Counter Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  meetsStep2Requirement
                    ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                    : "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {selectedCommunityIds.length} Selected (Minimum 3 required)
                </span>
              </div>
            </div>

            {/* Filter Bar: Search & Category Tabs */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search societies, sports leagues, tech clubs, fellowships, or patrons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-[#C59B27]/30 focus:border-[#C59B27] focus:ring-[#C59B27] text-xs h-10"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: "all", label: "All Communities" },
                  { id: "technology", label: "Tech & Innovation" },
                  { id: "sports", label: "Sports & Athletics" },
                  { id: "faith", label: "Faith Fellowships" },
                  { id: "arts", label: "Arts & Culture" },
                  { id: "community_service", label: "Civic & Community" },
                  { id: "leadership", label: "Leadership" },
                  { id: "academic", label: "Academic Guilds" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium text-xs transition-colors border ${
                      selectedCategory === cat.id
                        ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#C59B27]/50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Communities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCommunities.map((comm) => {
                const isSelected = selectedCommunityIds.includes(comm.id);

                return (
                  <div
                    key={comm.id}
                    onClick={() => toggleCommunity(comm.id)}
                    className={`cursor-pointer rounded-xl p-4 transition-all duration-150 border select-none ${
                      isSelected
                        ? "border-[#C59B27] bg-[#0B1D33]/[0.03] shadow-xs ring-1 ring-[#C59B27]"
                        : "border-[#C59B27]/30 bg-white hover:border-[#C59B27]/60 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27]">
                            {comm.categoryLabel}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-[11px] text-slate-500 font-sans">
                            {comm.memberCount}
                          </span>
                        </div>
                        <h3 className="font-sans font-bold text-sm text-[#0B1D33]">
                          {comm.name}
                        </h3>
                      </div>

                      {/* Select Toggle Button */}
                      <button
                        type="button"
                        aria-label={isSelected ? "Leave community" : "Join community"}
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                            : "bg-slate-50 text-slate-400 border-slate-300 hover:border-[#C59B27]"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 text-[#FCD34D]" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 font-sans mt-2 line-clamp-2 leading-relaxed">
                      {comm.description}
                    </p>

                    {/* Metadata line */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                      <div>
                        {comm.meetingSchedule} • {comm.venue}
                      </div>
                      {comm.patronName && (
                        <div className="text-[10px] text-slate-400 italic">
                          Patron: {comm.patronName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 2 Bottom Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-[#C59B27]/25">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="border-[#C59B27]/40 text-[#0B1D33] text-xs gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Studies</span>
              </Button>

              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!meetsStep2Requirement}
                className="bg-[#0B1D33] hover:bg-[#0B1D33]/90 text-white border border-[#C59B27]/40 font-semibold px-6 py-2.5 h-auto text-sm gap-2 shadow-xs"
              >
                <span>Continue to Personalization</span>
                <ArrowRight className="w-4 h-4 text-[#FCD34D]" />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: FACULTY SUGGESTIONS + NOTIFICATIONS + CAREERS          */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0B1D33]">
                Step 3: Smart Personalization & Career Alerts
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5">
                Curate discipline-specific feeds, notification frequency, and career internship alert channels.
              </p>
            </div>

            {/* A. Faculty-Matched Smart Suggestions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <h3 className="font-serif font-bold text-base text-[#0B1D33]">
                  Faculty-Matched Recommendations for {studies.faculty}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {facultyMatchedCommunities.map((item) => {
                  const isSelected = selectedCommunityIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCommunity(item.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-[#C59B27] bg-[#0B1D33]/[0.04]"
                          : "border-[#C59B27]/30 bg-white hover:border-[#C59B27]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-[10px] uppercase font-bold text-[#C59B27]">
                            Matched to {studies.department || "Your Major"}
                          </div>
                          <div className="text-xs font-bold text-[#0B1D33] font-sans">
                            {item.name}
                          </div>
                        </div>
                        <Badge
                          variant={isSelected ? "info" : "default"}
                          className="text-[10px]"
                        >
                          {isSelected ? "Added" : "+ Add"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 font-sans mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B. Collegiate Notification Delivery Style */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#C59B27]" />
                <h3 className="font-serif font-bold text-base text-[#0B1D33]">
                  Official Bulletin & Notification Style
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {NOTIFICATION_STYLE_OPTIONS.map((opt) => {
                  const isSelected = notificationStyle === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setNotificationStyle(opt.id)}
                      className={`cursor-pointer p-4 rounded-xl border select-none transition-all ${
                        isSelected
                          ? "border-[#C59B27] bg-[#0B1D33]/[0.04] shadow-xs ring-1 ring-[#C59B27]"
                          : "border-[#C59B27]/30 bg-white hover:border-[#C59B27]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B1D33] font-sans">
                          {opt.title}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#C59B27] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-sans mt-1.5 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C. Career & Internship Alert Tracks */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#C59B27]" />
                <h3 className="font-serif font-bold text-base text-[#0B1D33]">
                  Targeted Career, Internship & Grant Tracks
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {CAREER_ALERT_TRACKS.map((track) => {
                  const isSelected = selectedCareerTracks.includes(track.id);
                  return (
                    <div
                      key={track.id}
                      onClick={() => toggleCareerTrack(track.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border select-none transition-all ${
                        isSelected
                          ? "border-[#C59B27] bg-[#0B1D33]/[0.04] ring-1 ring-[#C59B27]"
                          : "border-[#C59B27]/30 bg-white hover:border-[#C59B27]/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-bold text-[#C59B27] uppercase">
                          {track.badge}
                        </span>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-[#FCD34D]" />}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-[#0B1D33] font-sans mt-1">
                        {track.title}
                      </div>
                      <p className="text-[11px] text-slate-600 font-sans mt-1 line-clamp-2 leading-relaxed">
                        {track.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Completion Summary & Button */}
            <div className="p-4 rounded-xl border border-[#C59B27]/30 bg-[#0B1D33] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-sm font-serif font-bold text-[#FCD34D]">
                  Ready to Enter Your Campus Hub
                </div>
                <div className="text-xs text-slate-300 font-sans">
                  {selectedCommunityIds.length} societies joined • {selectedCareerTracks.length} career tracks active • Studies verified
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="border-[#C59B27]/40 text-white hover:bg-white/10 text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={saving}
                  className="bg-[#C59B27] hover:bg-[#C59B27]/90 text-[#0B1D33] font-bold px-6 py-2.5 h-auto text-sm gap-2 shadow-xs shrink-0"
                >
                  {saving ? (
                    <span>Finalizing Enrollment...</span>
                  ) : (
                    <>
                      <span>Complete Enrollment & Enter Hub</span>
                      <ArrowRight className="w-4 h-4 text-[#0B1D33]" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collegiate Footer */}
      <footer className="mt-12 text-center text-xs text-slate-500 border-t border-[#C59B27]/20 pt-4 font-sans">
        <p>Summit Metropolitan University • Student Life & Campus Hub</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Academic Identity and Course Records Managed via UAMS Registrar Integration
        </p>
      </footer>
    </div>
  );
}
