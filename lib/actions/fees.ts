'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { demoSessionEmail } from '@/lib/security/demo-session';
import { FeeStatementData, PaymentRecord } from '@/lib/finance/types';
import { DEMO_FEE_STATEMENTS, DEMO_PAYMENT_RECORDS } from '@/lib/finance/demo-data';

export interface FeeStatementResponse {
  success: boolean;
  statements: FeeStatementData[];
  isDemo: boolean;
  error?: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  payments: PaymentRecord[];
  isDemo: boolean;
  error?: string;
}

export async function getStudentFeeStatementsAction(): Promise<FeeStatementResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {
    // Offline or network error
  }

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return {
      success: false,
      statements: [],
      isDemo: false,
      error: 'Unauthorized access. Please log in to view your fee statement.',
    };
  }

  // 1. Real Authenticated Student: query database strictly for own student_id
  if (user) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('uams_academic_records')
        .select('id, data, source_updated_at')
        .eq('kind', 'fee_statement')
        .eq('student_id', user.id)
        .order('source_updated_at', { ascending: false });

      if (error) {
        return {
          success: false,
          statements: [],
          isDemo: false,
          error: 'Unable to retrieve fee records from the institutional registry.',
        };
      }

      const statements: FeeStatementData[] = (data || []).map((row: any) => ({
        ...(row.data as FeeStatementData),
        statement_id: row.data?.statement_id || row.id,
      }));

      // Rule 2: Real students NEVER receive demo fallback money
      return {
        success: true,
        statements,
        isDemo: false,
      };
    } catch (err) {
      return {
        success: false,
        statements: [],
        isDemo: false,
        error: err instanceof Error ? err.message : 'Database error while querying fee records.',
      };
    }
  }

  // 2. Demo Student Session: strictly returned for demo session
  if (demoEmail) {
    return {
      success: true,
      statements: DEMO_FEE_STATEMENTS,
      isDemo: true,
    };
  }

  return {
    success: false,
    statements: [],
    isDemo: false,
    error: 'Session expired or unauthenticated.',
  };
}

export async function getStudentPaymentHistoryAction(): Promise<PaymentHistoryResponse> {
  let user = null;
  try {
    const supabase = await createClient();
    const authRes = await supabase.auth.getUser();
    user = authRes.data.user;
  } catch {
    // Offline or network error
  }

  const cookieStore = await cookies();
  const demoEmail = demoSessionEmail(cookieStore.get('smu_demo_session')?.value);

  if (!user && !demoEmail) {
    return {
      success: false,
      payments: [],
      isDemo: false,
      error: 'Unauthorized access. Please log in to view payment history.',
    };
  }

  // 1. Real Authenticated Student: query database strictly for own student_id
  if (user) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('uams_academic_records')
        .select('id, data, source_updated_at')
        .eq('kind', 'payment_record')
        .eq('student_id', user.id)
        .order('source_updated_at', { ascending: false });

      if (error) {
        return {
          success: false,
          payments: [],
          isDemo: false,
          error: 'Unable to retrieve payment records from the institutional registry.',
        };
      }

      const payments: PaymentRecord[] = (data || []).map((row: any) => ({
        ...(row.data as PaymentRecord),
        id: row.data?.id || row.id,
      }));

      // Rule 2: Real students NEVER receive demo fallback payments
      return {
        success: true,
        payments,
        isDemo: false,
      };
    } catch (err) {
      return {
        success: false,
        payments: [],
        isDemo: false,
        error: err instanceof Error ? err.message : 'Database error while querying payment records.',
      };
    }
  }

  // 2. Demo Student Session: strictly returned for demo session
  if (demoEmail) {
    return {
      success: true,
      payments: DEMO_PAYMENT_RECORDS,
      isDemo: true,
    };
  }

  return {
    success: false,
    payments: [],
    isDemo: false,
    error: 'Session expired or unauthenticated.',
  };
}
