export type LostFoundType = 'lost' | 'found';
export type LostFoundStatus = 'open' | 'claimed' | 'handed_over';
export type EmergencyCategory = 'security' | 'medical' | 'fire' | 'facility';

export interface LostFoundItem {
  id: string;
  type: LostFoundType;
  title: string;
  category: 'electronics' | 'identification' | 'keys' | 'books' | 'apparel' | 'other';
  location: string;
  dateReported: string; // ISO date 'YYYY-MM-DD'
  description: string;
  status: LostFoundStatus;
  ticketReference?: string;
  reportedByStudentId: string;
  isVerifiedHandover: boolean;
}

export interface EmergencySosResult {
  success: boolean;
  ticketNumber: string;
  dispatchedTo: string;
  campusSecurityPhone: string;
  campusHealthCentrePhone: string;
  studentLocation: string;
  dispatchedAt: string;
  message: string;
}

export interface KdpaDataPackage {
  exportedAt: string;
  legalBasis: string;
  dataController: string;
  studentProfile: {
    fullName: string;
    admissionNumber: string;
    email: string;
    programme: string;
    faculty: string;
    campus: string;
  };
  records: {
    academicGradesCount: number;
    academicGrades: Array<{
      courseCode: string;
      courseName: string;
      grade: string;
      score: number;
      academicYear: string;
      semester: number;
    }>;
    feeStatementsCount: number;
    feeStatements: Array<{
      statementNumber: string;
      totalBilled: number;
      totalPaid: number;
      balance: number;
    }>;
    libraryLoansCount: number;
    libraryLoans: Array<{
      accessionNumber: string;
      title: string;
      borrowedDate: string;
      dueDate: string;
      status: string;
    }>;
    unitRegistrationsCount: number;
    unitRegistrations: Array<{
      courseCode: string;
      courseName: string;
      creditHours: number;
      status: string;
    }>;
  };
  kdpaRightsSummary: {
    rightToAccess: string;
    rightToRectification: string;
    rightToErasure: string;
    retentionPolicy: string;
  };
}
