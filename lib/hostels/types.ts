export type RoomType = 'single' | 'double' | 'quad' | 'suite';

export interface RoommateInfo {
  id: string;
  name: string;
  admissionNumber: string;
  program: string;
  yearOfStudy: number;
  phone?: string;
  email: string;
  bedLabel: string; // e.g. "Bed 1", "Bed 2"
  isPrimaryUser?: boolean;
}

export interface RoomAllocation {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  academicYear: string;
  semester: number;
  hallName: string; // e.g. "Hall 3 - Mount Kenya Residence"
  hallType: 'female' | 'male' | 'mixed';
  block: string; // e.g. "Block B"
  floor: number; // e.g. 2
  roomNumber: string; // e.g. "B-204"
  roomType: RoomType;
  capacity: number;
  bedAssigned: string; // e.g. "Bed 2 (Window Side)"
  checkInDate: string;
  checkOutDeadline: string;
  checkInStatus: 'confirmed' | 'pending_key_collection' | 'checked_out';
  roommates: RoommateInfo[];
  wardenName: string;
  wardenContact: string;
  janitorContact: string;
  amenities: string[];
}

export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'carpentry'
  | 'lock_key'
  | 'wifi_network'
  | 'window_glass'
  | 'pest_control'
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'urgent';
export type TicketStatus = 'reported' | 'in_progress' | 'resolved' | 'cancelled';

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  category: MaintenanceCategory;
  categoryLabel: string;
  title: string;
  description: string;
  hallName: string;
  roomNumber: string;
  priority: TicketPriority;
  status: TicketStatus;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  technicianAssigned?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'allocated'
  | 'waitlisted'
  | 'rejected';

export interface HostelApplication {
  id: string;
  applicationNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  academicYear: string;
  semester: number;
  status: ApplicationStatus;
  firstPreferenceHall: string;
  secondPreferenceHall: string;
  preferredRoomType: RoomType;
  specialNeedsDescription?: string;
  submittedAt: string;
  decisionDate?: string;
  allocatedHall?: string;
  allocatedRoom?: string;
  paymentDeadline?: string;
}

export interface RoommatePreferences {
  sleepSchedule: 'early_bird' | 'night_owl' | 'flexible';
  studyHabit: 'quiet_room' | 'soft_music' | 'library_goer';
  cleanliness: 'very_tidy' | 'moderately_clean' | 'relaxed';
  guestPreference: 'weekends_only' | 'no_guests' | 'anytime_friendly';
  noiseTolerance: 'low' | 'medium' | 'high';
  degreeCategory?: string;
}

export interface RoommateMatchProfile {
  id: string;
  name: string;
  admissionNumber: string;
  program: string;
  yearOfStudy: number;
  bio: string;
  matchScore: number; // 0 - 100%
  preferences: RoommatePreferences;
  mutualInterests: string[];
  contactEmail: string;
  preferredHall?: string;
}

export interface WardenAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'inspection' | 'maintenance' | 'rules' | 'security' | 'general';
  hallScope: string; // e.g. "Hall 3" or "All Campus Halls"
  wardenName: string;
  wardenRole: string;
  publishedAt: string;
  isImportant: boolean;
  expiresAt?: string;
}

export interface VerifiedOffCampusHouse {
  id: string;
  name: string;
  propertyType: 'hostel' | 'apartment' | 'bedsitter' | 'studio';
  location: string;
  distanceFromCampusKm: number;
  walkTimeMinutes: number;
  monthlyRentKes: number;
  roomTypesAvailable: string[];
  accreditationLevel: 'gold_standard' | 'verified_standard';
  accreditationReference: string;
  amenities: string[];
  caretakerName: string;
  contactPhone: string;
  contactEmail?: string;
  securityRating: number; // 1-5
  waterReliability: string; // e.g. "24/7 Borehole + City Council"
  backupGenerator: boolean;
  address: string;
}
