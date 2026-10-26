export type StudentIdStatus = 'active' | 'suspended' | 'graduated' | 'pending';

export interface DigitalStudentIdCard {
  id: string;
  studentName: string;
  admissionNumber: string;
  nationalIdNumber?: string;
  programme: string;
  faculty: string;
  department?: string;
  campusName: string;
  academicYear: string;
  status: StudentIdStatus;
  issueDate: string;
  validUntil: string;
  photoUrl?: string;
  qrPayload: string;
  libraryBarcode: string;
  emergencyContact?: string;
  isDemo?: boolean;
}
