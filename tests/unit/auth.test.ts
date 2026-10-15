import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, onboardingSchema } from "@/lib/validations/auth";

describe("Authentication & Onboarding Schemas", () => {
  describe("loginSchema", () => {
    it("validates valid student login credentials", () => {
      const valid = {
        email: "student@summit.ac.ke",
        password: "securepassword123",
      };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("fails on invalid email format", () => {
      const invalid = {
        email: "not-an-email",
        password: "securepassword123",
      };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("fails on short password", () => {
      const invalid = {
        email: "student@summit.ac.ke",
        password: "123",
      };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("validates matching registration passwords", () => {
      const valid = {
        fullName: "Faith Chepkemoi",
        email: "f.chepkemoi@summit.ac.ke",
        password: "password1234",
        confirmPassword: "password1234",
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const invalid = {
        fullName: "Faith Chepkemoi",
        email: "f.chepkemoi@summit.ac.ke",
        password: "password1234",
        confirmPassword: "differentpassword",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Passwords do not match");
      }
    });
  });

  describe("onboardingSchema", () => {
    it("validates complete student onboarding profile", () => {
      const valid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        campusId: "00000000-0000-0000-0000-000000000011",
        registrationNumber: "SMU/BCS/2024/0142",
        faculty: "School of Computing & Informatics",
        department: "Computer Science",
        programOfStudy: "Bachelor of Science in Computer Science",
        yearOfStudy: 2,
        idDocumentUrl: "https://example.com/id.pdf",
      };
      const result = onboardingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid year of study (must be between 1 and 7)", () => {
      const invalid = {
        universityId: "00000000-0000-0000-0000-000000000001",
        campusId: "00000000-0000-0000-0000-000000000011",
        registrationNumber: "SMU/BCS/2024/0142",
        faculty: "School of Computing",
        department: "Computer Science",
        programOfStudy: "Computer Science",
        yearOfStudy: 9,
      };
      const result = onboardingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
