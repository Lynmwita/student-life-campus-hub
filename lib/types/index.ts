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
  logo_url?: string | null;
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
  staff_id?: string | null;
  faculty?: string | null;
  department?: string | null;
  program_of_study?: string | null;
  year_of_study?: number | null;
  verification_status: VerificationStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  verification_notes?: string | null;
  id_document_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  university_id: string;
  campus_id?: string | null;
  author_id: string;
  title: string;
  content: string;
  priority: NotificationPriority;
  target_scope: AnnouncementTargetScope;
  target_faculty?: string | null;
  target_department?: string | null;
  target_year?: number | null;
  is_published: boolean;
  published_at: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementRead {
  id: string;
  announcement_id: string;
  user_id: string;
  read_at: string;
}

export interface HelpRequest {
  id: string;
  reference_no: string;
  university_id: string;
  campus_id?: string | null;
  student_id: string;
  assigned_staff_id?: string | null;
  category: HelpRequestCategory;
  priority: NotificationPriority;
  subject: string;
  description: string;
  status: HelpRequestStatus;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelpRequestUpdate {
  id: string;
  help_request_id: string;
  author_id: string;
  status_from?: string | null;
  status_to?: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
}
