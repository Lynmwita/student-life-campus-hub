import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  onboardingSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  isAcademicEmail,
} from "@/lib/validations/auth";

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

  describe("registerSchema (Password Complexity & Matching)", () => {
    it("validates compliant password meeting full complexity criteria", () => {
      const valid = {
        fullName: "Faith Chepkemoi",
        email: "f.chepkemoi@summit.ac.ke",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects password missing uppercase letter", () => {
      const invalid = {
        fullName: "Faith Chepkemoi",
        email: "f.chepkemoi@summit.ac.ke",
        password: "strongpassword123!",
        confirmPassword: "strongpassword123!",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Password must contain at least one uppercase letter"
        );
      }
    });

    it("rejects password missing special character", () => {
      const invalid = {
        fullName: "Faith Chepkemoi",
        email: "f.chepkemoi@summit.ac.ke",
        password: "StrongPassword123",
        confirmPassword: "StrongPassword123",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Password must contain at least one special character"
        );
      }
    });

    it("rejects mismatched passwords", () => {
      const invalid = {
        fullName: "Faith Chepkemoi",
        email: "f.chepkemoi@summit.ac.ke",
        password: "StrongPassword123!",
        confirmPassword: "DifferentPassword123!",
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
        idDocumentUrl: "00000000-0000-0000-0000-000000000001/id_card.png",
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

  describe("forgotPasswordSchema & resetPasswordSchema", () => {
    it("validates valid email for password recovery", () => {
      const valid = { email: "student@summit.ac.ke" };
      const result = forgotPasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email for password recovery", () => {
      const invalid = { email: "invalid-email" };
      const result = forgotPasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("validates compliant new password matching confirmation", () => {
      const valid = {
        password: "NewComplexPassword123#",
        confirmPassword: "NewComplexPassword123#",
      };
      const result = resetPasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects new password when passwords do not match", () => {
      const invalid = {
        password: "NewComplexPassword123#",
        confirmPassword: "MismatchPassword123#",
      };
      const result = resetPasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("isAcademicEmail", () => {
    it("recognizes Kenyan institutional email (.ac.ke)", () => {
      expect(isAcademicEmail("student@summit.ac.ke")).toBe(true);
      expect(isAcademicEmail("lecturer@zetech.ac.ke")).toBe(true);
      expect(isAcademicEmail("admin@uonbi.ac.ke")).toBe(true);
    });

    it("recognizes general higher-education academic email (.edu)", () => {
      expect(isAcademicEmail("scholar@mit.edu")).toBe(true);
    });

    it("rejects personal commercial email providers", () => {
      expect(isAcademicEmail("user@gmail.com")).toBe(false);
      expect(isAcademicEmail("user@yahoo.com")).toBe(false);
      expect(isAcademicEmail("")).toBe(false);
    });
  });
});
