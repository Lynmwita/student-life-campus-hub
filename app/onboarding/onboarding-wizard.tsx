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
  Laptop,
  Trophy,
  Heart,
  Palette,
  Compass,
  Users,
  BookOpen,
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

function getCategoryIcon(cat: string) {
  switch (cat) {
    case "technology":
      return <Laptop className="w-3.5 h-3.5 shrink-0" />;
    case "sports":
      return <Trophy className="w-3.5 h-3.5 shrink-0" />;
    case "faith":
      return <Heart className="w-3.5 h-3.5 shrink-0" />;
    case "arts":
      return <Palette className="w-3.5 h-3.5 shrink-0" />;
    case "leadership":
      return <Compass className="w-3.5 h-3.5 shrink-0" />;
    case "community_service":
      return <Users className="w-3.5 h-3.5 shrink-0" />;
    case "academic":
    default:
      return <BookOpen className="w-3.5 h-3.5 shrink-0" />;
  }
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

  async function handleFinishOnboarding() {
    if (!studiesConfirmed) {
      setError("Please confirm your academic studies record in Step 1.");
      setCurrentStep(1);
      return;
    }

    if (!meetsStep2Requirement) {
      setError("Please select at least 3 campus communities or societies.");
      setCurrentStep(2);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await completeSmartOnboardingAction({
        studiesConfirmed: true,
        communityIds: selectedCommunityIds,
        notificationStyle,
        careerAlertTracks: selectedCareerTracks,
      });

      if (!res.success) {
        setError(res.message || "Failed to save preferences.");
        setSaving(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1D33] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Institutional Masthead */}
        <div className="text-center space-y-2 border-b border-[#C59B27]/25 pb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/40 shadow-xs mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight">
            Student Life & Campus Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-lg mx-auto">
            Academic Identity Synchronization & Campus Discovery Onboarding
          </p>
        </div>

        {/* 3-Step Breadcrumb / Progress Bar */}
        <div className="bg-white border border-[#C59B27]/30 rounded-xl p-3 shadow-xs">
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
        {/* STEP 2: PICK COMMUNITIES (ROUND/OVAL PILL CHIPS)               */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0B1D33]">
                  Step 2: Join Kenyan Campus Societies & Fellowships
                </h2>
                <p className="text-xs text-slate-600 font-sans mt-0.5">
                  Tap to toggle communities. Choose at least 3 to curate your activity feed, societies, and alerts.
                </p>
              </div>

              {/* Requirement Counter Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${
                  meetsStep2Requirement
                    ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                    : "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#FCD34D]" />
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
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium text-xs transition-colors border ${
                      selectedCategory === cat.id
                        ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27]"
                        : "bg-white text-[#0B1D33] border-[#C59B27]/40 hover:border-[#C59B27]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Faculty-Matched Suggestions Row (Pills) */}
            {facultyMatchedCommunities.length > 0 && (
              <div className="space-y-2.5 p-4 rounded-2xl bg-white border border-[#C59B27]/30 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B1D33]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Faculty-Matched Suggestions for {studies.faculty}:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {facultyMatchedCommunities.map((item) => {
                    const isSelected = selectedCommunityIds.includes(item.id);
                    return (
                      <button
                        key={`faculty-${item.id}`}
                        type="button"
                        onClick={() => toggleCommunity(item.id)}
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-150 select-none border ${
                          isSelected
                            ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27] shadow-xs"
                            : "bg-[#FFFFFF] text-[#0B1D33] border-[#C59B27]/40 hover:border-[#C59B27] hover:bg-slate-50"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#FCD34D]" />
                        ) : (
                          <span className="text-[#C59B27]">{getCategoryIcon(item.category)}</span>
                        )}
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pill Chips Container (TikTok / Spotify interest picker style) */}
            <Card className="border border-[#C59B27]/30 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Select Communities & Societies:</span>
                <span>{filteredCommunities.length} available</span>
              </div>

              {filteredCommunities.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No societies match your query &quot;{searchQuery}&quot;. Try clearing the search or category filter.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                  {filteredCommunities.map((comm) => {
                    const isSelected = selectedCommunityIds.includes(comm.id);

                    return (
                      <button
                        key={comm.id}
                        type="button"
                        onClick={() => toggleCommunity(comm.id)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 select-none border ${
                          isSelected
                            ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27] shadow-sm"
                            : "bg-[#FFFFFF] text-[#0B1D33] border-[#C59B27]/40 hover:border-[#C59B27] hover:bg-slate-50"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#FCD34D]" />
                        ) : (
                          <span className="text-[#C59B27]">{getCategoryIcon(comm.category)}</span>
                        )}
                        <span>{comm.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Requirement reminder */}
              <div className="mt-6 pt-4 border-t border-[#C59B27]/20 flex items-center justify-between text-xs text-slate-600 font-sans">
                <div>
                  Selected: <strong className="text-[#0B1D33]">{selectedCommunityIds.length}</strong> of minimum 3
                </div>
                {meetsStep2Requirement ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Requirement satisfied
                  </span>
                ) : (
                  <span className="text-[#C59B27] font-medium">
                    Pick {3 - selectedCommunityIds.length} more to continue
                  </span>
                )}
              </div>
            </Card>

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

              <div className="flex flex-wrap gap-2.5">
                {facultyMatchedCommunities.map((item) => {
                  const isSelected = selectedCommunityIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleCommunity(item.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all select-none shadow-xs border ${
                        isSelected
                          ? "bg-[#0B1D33] text-[#FCD34D] border-[#C59B27] ring-1 ring-[#C59B27]"
                          : "bg-white text-[#0B1D33] border-[#C59B27]/40 hover:border-[#C59B27] hover:bg-slate-50"
                      }`}
                    >
                      <span className={isSelected ? "text-[#FCD34D]" : "text-[#C59B27]"}>
                        {isSelected ? <Check className="w-4 h-4 stroke-[2.5]" /> : getCategoryIcon(item.category)}
                      </span>
                      <span>{item.name}</span>
                      <span className="text-[10px] text-[#C59B27] font-semibold uppercase">
                        Matched Major
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. Official Notification Style */}
            <Card className="border border-[#C59B27]/30 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#C59B27]" />
                <h3 className="font-serif font-bold text-sm text-[#0B1D33]">
                  Official Broadcast Delivery Preference
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Choose how priority bulletins from Academic Affairs, Faculty Deans, and Campus Security are surfaced.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {NOTIFICATION_STYLE_OPTIONS.map((opt) => {
                  const isChosen = notificationStyle === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setNotificationStyle(opt.id)}
                      className={`cursor-pointer p-4 rounded-xl border text-left transition-all ${
                        isChosen
                          ? "border-[#C59B27] bg-[#0B1D33]/[0.03] ring-1 ring-[#C59B27]"
                          : "border-slate-200 bg-white hover:border-[#C59B27]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-serif font-bold text-[#0B1D33]">
                          {opt.title}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChosen
                              ? "border-[#C59B27] bg-[#0B1D33] text-[#FCD34D]"
                              : "border-slate-300"
                          }`}
                        >
                          {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-[#FCD34D]" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 font-sans leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* C. Career Alerts & Internship Tracks */}
            <Card className="border border-[#C59B27]/30 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#C59B27]" />
                <h3 className="font-serif font-bold text-sm text-[#0B1D33]">
                  Kenyan Industry Career Tracks & Internship Bulletins
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Receive fast-track notices for Safaricom, Microsoft ADC, Equity Leaders, and Kenya national innovation challenges.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CAREER_ALERT_TRACKS.map((track) => {
                  const isChecked = selectedCareerTracks.includes(track.id);
                  return (
                    <div
                      key={track.id}
                      onClick={() => toggleCareerTrack(track.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                        isChecked
                          ? "border-[#C59B27] bg-[#0B1D33]/[0.03] ring-1 ring-[#C59B27]"
                          : "border-slate-200 bg-white hover:border-[#C59B27]/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="mt-0.5 rounded border-slate-300 text-[#0B1D33] focus:ring-[#C59B27]"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#0B1D33] font-sans">
                          {track.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans">
                          {track.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Step 3 Bottom Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-[#C59B27]/25">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="border-[#C59B27]/40 text-[#0B1D33] text-xs gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Communities</span>
              </Button>

              <Button
                type="button"
                onClick={handleFinishOnboarding}
                isLoading={saving}
                className="bg-[#0B1D33] hover:bg-[#0B1D33]/90 text-white border border-[#C59B27]/40 font-semibold px-8 py-3 h-auto text-sm gap-2 shadow-xs"
              >
                <span>Save Preferences & Open Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#FCD34D]" />
              </Button>
            </div>
          </div>
        )}

        {/* Institutional Footer */}
        <footer className="mt-12 text-center text-xs text-slate-500 border-t border-[#C59B27]/20 pt-4 font-sans">
          <p>Summit Metropolitan University • Student Life & Campus Hub</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Academic Identity and Course Records Managed via UAMS Registrar Integration
          </p>
        </footer>
      </div>
    </div>
  );
}
