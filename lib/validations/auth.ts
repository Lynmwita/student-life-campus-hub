import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid university or personal email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password confirmation must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const onboardingSchema = z.object({
  universityId: z.string().regex(uuidRegex, "Please select a valid university"),
  campusId: z.string().regex(uuidRegex, "Please select your campus"),
  registrationNumber: z
    .string()
    .min(3, "Registration number is required")
    .max(50, "Registration number is too long"),
  faculty: z.string().min(2, "Faculty or School is required"),
  department: z.string().min(2, "Department is required"),
  programOfStudy: z.string().min(2, "Program of study is required"),
  yearOfStudy: z.coerce
    .number()
    .int()
    .min(1, "Year of study must be between 1 and 7")
    .max(7, "Year of study must be between 1 and 7"),
  idDocumentUrl: z.string().url("Please provide a valid document link").optional().or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
