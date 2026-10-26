export type RegistrationStatus = 'registered' | 'pending_approval' | 'dropped';

export interface CourseUnitPrerequisite {
  courseCode: string;
  minimumGrade: string;
  isSatisfied: boolean;
}

export interface AvailableCourseUnit {
  id: string;
  code: string;
  name: string;
  faculty: string;
  department: string;
  yearOfStudy: number;
  semester: number;
  creditHours: number;
  lectureHoursPerWeek: number;
  isCore: boolean;
  prerequisites: CourseUnitPrerequisite[];
  isEligible: boolean;
  ineligibilityReason?: string;
}

export interface RegisteredUnit {
  unitId: string;
  code: string;
  name: string;
  creditHours: number;
  registeredAt: string;
  status: RegistrationStatus;
  registrationRef: string;
}

export interface UnitRegistrationRules {
  minCreditHours: number;
  maxCreditHours: number;
  currentRegisteredCredits: number;
  academicYear: string;
  semester: number;
  semesterLabel: string;
  registrationDeadline: string;
  isOpen: boolean;
}

export interface UnitRegistrationResponse {
  success: boolean;
  rules: UnitRegistrationRules;
  availableUnits: AvailableCourseUnit[];
  registeredUnits: RegisteredUnit[];
  isDemo: boolean;
  error?: string;
}

export interface UnitRegistrationSubmissionResult {
  success: boolean;
  registrationReference?: string;
  registeredUnits?: RegisteredUnit[];
  totalCredits?: number;
  rejectionReasons?: string[];
  message: string;
}
