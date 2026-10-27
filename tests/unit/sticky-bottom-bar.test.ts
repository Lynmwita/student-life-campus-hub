import { describe, it, expect } from "vitest";
import { BOTTOM_BAR_ITEMS } from "@/components/shared/sticky-bottom-bar";

describe("Sticky Bottom Bar Verification", () => {
  it("contains exactly 4 navigation destinations", () => {
    expect(BOTTOM_BAR_ITEMS).toHaveLength(4);
  });

  it("links to the exact expected routes", () => {
    const routes = BOTTOM_BAR_ITEMS.map((item) => item.href);
    expect(routes).toEqual(["/dashboard", "/safety", "/help-desk", "/profile"]);
  });

  it("contains authentic English and Kiswahili labels without emojis or dashes", () => {
    const expected = [
      { href: "/dashboard", en: "Home", sw: "Mwanzo" },
      { href: "/safety", en: "SOS", sw: "SOS" },
      { href: "/help-desk", en: "Help Desk", sw: "Msaada" },
      { href: "/profile", en: "Profile", sw: "Wasifu" },
    ];

    BOTTOM_BAR_ITEMS.forEach((item, index) => {
      expect(item.href).toBe(expected[index].href);
      expect(item.labelEn).toBe(expected[index].en);
      expect(item.labelSw).toBe(expected[index].sw);
      expect(item.icon).toBeDefined();

      // Rule: No emojis, no em dashes
      expect(item.labelEn).not.toMatch(/[\u{1F300}-\u{1F6FF}|—|–]/u);
      expect(item.labelSw).not.toMatch(/[\u{1F300}-\u{1F6FF}|—|–]/u);
    });
  });
});
