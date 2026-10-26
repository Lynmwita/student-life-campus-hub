export type ClearanceStatus = 'cleared' | 'blocked' | 'pending';

export interface RegisteredExamUnit {
  code: string;
  name: string;
  units: number;
  status: 'confirmed' | 'provisional';
}

export interface ExamClearanceRecord {
  status: ClearanceStatus;
  clearanceReference?: string;
  clearedAt?: string;
  clearedBy?: string;
  blockingReasons?: string[];
  financialBalance?: number;
  financialCleared: boolean;
  academicApproved: boolean;
}

export interface DigitalExamPassData {
  passNumber: string;
  studentName: string;
  admissionNumber: string;
  programme: string;
  faculty: string;
  campusName: string;
  academicYear: string;
  semester: number;
  semesterLabel: string;
  registeredUnits: RegisteredExamUnit[];
  clearance: ExamClearanceRecord;
  qrPayload: string;
  photoUrl?: string;
  issuedAt: string;
  isDemo?: boolean;
}

export interface ExamTimetableEntry {
  id: string;
  courseCode: string;
  courseName: string;
  examDate: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  seatNumber: string;
  paperType?: string; // e.g. "Main Paper", "Practical", "Theory"
  instructions?: string;
}

export interface ResultsDigestAlert {
  id: string;
  studentId: string;
  academicYear: string;
  semester: number;
  unitCodes: string[];
  publishedAt: string;
  message: string;
  isRead?: boolean;
}

export interface SemesterGpaTrendPoint {
  semesterLabel: string;
  academicYear: string;
  semester: number;
  gpa: number;
  cgpa: number;
  totalUnits: number;
}
