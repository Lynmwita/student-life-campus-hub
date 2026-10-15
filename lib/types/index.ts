export type UserRole = "student" | "staff" | "admin" | "super_admin";

export type VerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "requires_review"
  | "suspended";

export type NotificationPriority = "P1" | "P2" | "P3" | "P4";

export type AnnouncementTargetScope = "all" | "campus" | "faculty" | "department" | "year";

export type HelpRequestStatus =
  | "submitted"
  | "under_review"
  | "in_progress"
  | "resolved"
  | "closed";

export type HelpRequestCategory =
  | "academic"
  | "facilities"
  | "welfare"
  | "finance_aid"
  | "hostel"
  | "general";

export interface University {
  id: string;
  name: string;
  slug: string;
  code: string;
  domain: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: string;
  university_id: string;
  name: string;
  code: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UniversityMembership {
  id: string;
  user_id: string;
  university_id: string;
  campus_id: string | null;
  role: UserRole;
  registration_number?: string | null;
  faculty?: string | null;
  department?: string | null;
  program_of_study?: string | null;
  year_of_study?: number | null;
  verification_status: VerificationStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
  updated_at: string;
}
