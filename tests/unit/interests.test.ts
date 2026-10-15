import { describe, it, expect } from "vitest";
import { CANONICAL_INTERESTS, CANONICAL_INTEREST_IDS } from "@/lib/constants/interests";
import { saveStudentInterestsAction } from "@/lib/actions/interests";

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
