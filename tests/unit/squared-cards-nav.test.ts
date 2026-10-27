import { describe, it, expect } from "vitest";
import { NAV_CARDS } from "@/components/shared/squared-cards-nav";

describe("Squared-Cards Navigation Verification", () => {
  it("contains exactly 14 cards", () => {
    expect(NAV_CARDS).toHaveLength(14);
  });

  it("contains all expected routes without changes", () => {
    const routes = NAV_CARDS.map((c) => c.href);
    expect(routes).toEqual([
      "/dashboard",
      "/fees",
      "/student-id",
      "/library",
      "/units",
      "/exams",
      "/hostels",
      "/results",
      "/feedback",
      "/timetable",
      "/campus-life",
      "/safety",
      "/graduation",
      "/help-desk",
    ]);
  });

  it("contains authentic English and Kiswahili labels matching the specification", () => {
    const expectedLabels = [
      { en: "Campus Feed", sw: "Mlisho wa Chuo" },
      { en: "Fee Statement", sw: "Ada za Masomo" },
      { en: "Digital Student ID", sw: "Kitambulisho cha Mwanafunzi" },
      { en: "Library", sw: "Maktaba" },
      { en: "Unit Registration", sw: "Usajili wa Kozi" },
      { en: "Exam Pass and Timetable", sw: "Ratiba ya Mitihani & Pasi" },
      { en: "Hostels and Residence", sw: "Bweni na Makazi" },
      { en: "Results", sw: "Matokeo ya Mitihani" },
      { en: "Pilot feedback", sw: "Maoni ya Majaribio" },
      { en: "Weekly Timetable", sw: "Ratiba ya Wiki" },
      { en: "Campus Life and Clubs", sw: "Maisha ya Chuo na Vilabu" },
      { en: "Community and Safety", sw: "Usalama na Faragha" },
      { en: "Graduation and Vault", sw: "Utoaji wa Shahada & Kibali" },
      { en: "Help Desk and Inquiries", sw: "Dawati la Msaada" },
    ];

    NAV_CARDS.forEach((card, index) => {
      expect(card.labelEn).toBe(expectedLabels[index].en);
      expect(card.labelSw).toBe(expectedLabels[index].sw);
      expect(card.icon).toBeDefined();

      // Rule: No emojis, no em dashes
      expect(card.labelEn).not.toMatch(/[\u{1F300}-\u{1F6FF}|—|–]/u);
      expect(card.labelSw).not.toMatch(/[\u{1F300}-\u{1F6FF}|—|–]/u);
    });
  });
});
