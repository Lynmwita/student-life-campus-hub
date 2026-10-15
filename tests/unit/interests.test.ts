import { describe, it, expect } from "vitest";
import { CANONICAL_INTERESTS, CANONICAL_INTEREST_IDS } from "@/lib/constants/interests";
import {
  KENYAN_CAMPUS_DIRECTORY,
  CAREER_ALERT_TRACKS,
  NOTIFICATION_STYLE_OPTIONS,
} from "@/lib/constants/campus-directory";
import {
  saveStudentInterestsAction,
  getStudentOnboardingDataAction,
  completeSmartOnboardingAction,
} from "@/lib/actions/interests";

describe("Mandatory Student Interests Logic", () => {
  it("contains all 10 canonical student interest categories", () => {
    expect(CANONICAL_INTERESTS.length).toBe(10);
    expect(CANONICAL_INTEREST_IDS).toContain("technology");
    expect(CANONICAL_INTEREST_IDS).toContain("sports");
    expect(CANONICAL_INTEREST_IDS).toContain("arts");
    expect(CANONICAL_INTEREST_IDS).toContain("music");
    expect(CANONICAL_INTEREST_IDS).toContain("faith");
    expect(CANONICAL_INTEREST_IDS).toContain("leadership");
    expect(CANONICAL_INTEREST_IDS).toContain("community_service");
    expect(CANONICAL_INTEREST_IDS).toContain("entrepreneurship");
    expect(CANONICAL_INTEREST_IDS).toContain("health");
    expect(CANONICAL_INTEREST_IDS).toContain("environment");
  });

  it("rejects saving when fewer than 3 interests are selected", async () => {
    const result = await saveStudentInterestsAction(["technology", "sports"]);
    expect(result.success).toBe(false);
    expect(result.message).toContain("Please select at least 3 interests");
  });

  it("rejects unrecognized or non-canonical interests", async () => {
    const result = await saveStudentInterestsAction([
      "technology",
      "sports",
      "non_canonical_interest_xyz",
    ]);
    expect(result.success).toBe(false);
    expect(result.message).toContain("not recognized");
  });
});

describe("Smart Onboarding & Kenyan Campus Directory", () => {
  it("seeds full Kenyan campus directory across sports, faith, tech, arts, civic, and academic guilds", () => {
    expect(KENYAN_CAMPUS_DIRECTORY.length).toBeGreaterThanOrEqual(20);

    const categories = new Set(KENYAN_CAMPUS_DIRECTORY.map((c) => c.category));
    expect(categories.has("technology")).toBe(true);
    expect(categories.has("sports")).toBe(true);
    expect(categories.has("faith")).toBe(true);
    expect(categories.has("arts")).toBe(true);
    expect(categories.has("community_service")).toBe(true);
    expect(categories.has("leadership")).toBe(true);
    expect(categories.has("academic")).toBe(true);

    // Verify key Kenyan campus chapters exist
    const names = KENYAN_CAMPUS_DIRECTORY.map((c) => c.name);
    expect(names.some((n) => n.includes("GDSC"))).toBe(true);
    expect(names.some((n) => n.includes("Christian Union"))).toBe(true);
    expect(names.some((n) => n.includes("Red Cross"))).toBe(true);
    expect(names.some((n) => n.includes("Rugby"))).toBe(true);
    expect(names.some((n) => n.includes("Football"))).toBe(true);
  });

  it("provides career alert tracks and collegiate notification delivery styles", () => {
    expect(CAREER_ALERT_TRACKS.length).toBeGreaterThanOrEqual(4);
    expect(NOTIFICATION_STYLE_OPTIONS.length).toBe(3);
    expect(NOTIFICATION_STYLE_OPTIONS.some((n) => n.isRecommended)).toBe(true);
  });

  it("retrieves pre-filled student studies data for step 1 verification", async () => {
    const data = await getStudentOnboardingDataAction();
    expect(data.success).toBe(true);
    expect(data.studies).toBeDefined();
    expect(data.studies.registrationNumber).toBeTruthy();
    expect(data.studies.universityName).toBeTruthy();
    expect(data.studies.faculty).toBeTruthy();
    expect(data.studies.programOfStudy).toBeTruthy();
  });

  it("rejects completeSmartOnboardingAction if studies are not confirmed", async () => {
    const result = await completeSmartOnboardingAction({
      studiesConfirmed: false,
      communityIds: ["gdsc-chapter", "varsity-football-club", "christian-union-cu"],
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("confirm your pre-filled academic studies");
  });

  it("filters faculty suggestions accurately by the student's faculty (not recommending tech to law students)", () => {
    // Law student test
    const lawFaculty = "School of Law";
    const lawMatched = KENYAN_CAMPUS_DIRECTORY.filter((c) => {
      if (!c.facultyMatches) return false;
      const studentFaculty = lawFaculty.toLowerCase();
      return c.facultyMatches.some(
        (f) =>
          studentFaculty.includes(f.toLowerCase()) ||
          (studentFaculty.includes("computing") && f.toLowerCase().includes("computing"))
      );
    });

    const lawNames = lawMatched.map((c) => c.name);
    expect(lawNames.some((n) => n.includes("Law") || n.includes("Debate"))).toBe(true);
    expect(lawNames.some((n) => n.includes("GDSC"))).toBe(false);
    expect(lawNames.some((n) => n.includes("Cyber Security"))).toBe(false);

    // Computing student test
    const computingFaculty = "School of Computing & Informatics";
    const compMatched = KENYAN_CAMPUS_DIRECTORY.filter((c) => {
      if (!c.facultyMatches) return false;
      const studentFaculty = computingFaculty.toLowerCase();
      return c.facultyMatches.some(
        (f) =>
          studentFaculty.includes(f.toLowerCase()) ||
          (studentFaculty.includes("computing") && f.toLowerCase().includes("computing"))
      );
    });

    const compNames = compMatched.map((c) => c.name);
    expect(compNames.some((n) => n.includes("GDSC"))).toBe(true);
    expect(compNames.some((n) => n.includes("Cyber Security"))).toBe(true);
  });
});

