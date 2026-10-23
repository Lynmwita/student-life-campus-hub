export type FeeCategory =
  | 'tuition'
  | 'hostel'
  | 'library'
  | 'examination'
  | 'activity'
  | 'medical'
  | 'ict'
  | 'union'
  | 'other';

export type FeeItemStatus = 'billed' | 'settled' | 'partial';

export interface FeeItem {
  id: string;
  category: FeeCategory;
  title: string;
  description: string;
  amount: number;
  status: FeeItemStatus;
  due_date?: string;
}

export interface FeeFundingSource {
  name: string;
  amount: number;
  reference?: string;
}

export interface FeeStatementData {
  statement_id: string;
  student_id?: string;
  student_email?: string;
  admission_number?: string;
  student_name?: string;
  academic_year: string;
  semester: number;
  semester_label: string;
  currency: 'KES';
  total_billed: number;
  funding_applied: number;
  paid_by_student: number;
  total_paid: number;
  balance: number;
  funding_sources?: FeeFundingSource[];
  items: FeeItem[];
  is_published: boolean;
  issued_at: string;
  updated_at?: string;
}

export type PaymentChannel = 'mpesa' | 'bank_deposit' | 'helb' | 'bursary' | 'direct';

export interface PaymentRecord {
  id: string;
  receipt_number: string;
  reference_code: string; // e.g. M-Pesa code QHK9821PX4 or bank slip
  channel: PaymentChannel;
  channel_label: string;
  amount: number;
  currency: 'KES';
  paid_at: string;
  academic_year: string;
  semester_label: string;
  student_name: string;
  admission_number: string;
  degree_program?: string;
  allocated_to: string;
  status: 'verified' | 'reversed';
  is_published?: boolean;
}
