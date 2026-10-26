export type DepartmentClearanceStatus = 'cleared' | 'blocked' | 'pending';

export interface ClearanceDepartmentItem {
  id: string;
  departmentName: string;
  category: 'library' | 'hostels' | 'sports' | 'finance' | 'registrar';
  status: DepartmentClearanceStatus;
  clearedAt?: string;
  officerName?: string;
  officerRole?: string;
  blockingReason?: string;
  resolutionActionUrl?: string;
  resolutionActionLabel?: string;
}

export interface StudentClearanceSummary {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  programme: string;
  faculty: string;
  campus: string;
  academicYear: string;
  isFullyCleared: boolean;
  clearedDepartmentsCount: number;
  totalDepartmentsCount: number;
  finalClearanceCertificateRef?: string;
  departments: ClearanceDepartmentItem[];
}

export interface VaultDocument {
  id: string;
  title: string;
  type: 'admission_letter' | 'fee_receipt' | 'provisional_transcript' | 'clearance_certificate';
  description: string;
  referenceNumber: string;
  issuedDate: string;
  fileFormat: 'PDF' | 'JSON';
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface TranscriptRequest {
  id: string;
  trackingReference: string;
  destinationInstitution: string;
  destinationEmail: string;
  format: 'electronic_certified' | 'embossed_hardcopy';
  status: 'submitted' | 'processing' | 'dispatched' | 'delivered';
  requestedAt: string;
  dispatchedAt?: string;
  notes?: string;
}

export interface SponsorViewSummary {
  studentName: string;
  admissionNumber: string;
  programme: string;
  faculty: string;
  campus: string;
  academicYear: string;
  currentSemester: number;
  academicStanding: string;
  feeSummary: {
    totalBilled: number;
    totalPaid: number;
    balance: number;
    dueDate: string;
    paybillNumber: string;
    accountNumber: string;
    bankDetails: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      branch: string;
    };
  };
  enrolledUnitsCount: number;
  enrolledUnits: Array<{
    code: string;
    title: string;
    creditHours: number;
  }>;
}
