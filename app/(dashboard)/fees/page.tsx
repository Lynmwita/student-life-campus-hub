import { Suspense } from 'react';
import { connection } from 'next/server';
import { AppHeader } from '@/components/shared/app-header';
import { getStudentFeeStatementsAction, getStudentPaymentHistoryAction } from '@/lib/actions/fees';
import { FeeStatementClient } from './fee-statement-client';
import { redirect } from 'next/navigation';

export const instant = false;

export const metadata = {
  title: 'Fees & Payment Receipts | Student Life & Campus Hub',
  description: 'Itemized semester fee assessment, payment history, and official downloadable receipts.',
};

export default function FeeStatementPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#0B1D33] border-t-[#C59B27] rounded-full animate-spin mx-auto mb-3" />
            <p role="status" className="text-xs text-slate-500 font-medium">
              Loading financial records and receipts...
            </p>
          </div>
        }
      >
        <FeeStatementLoader />
      </Suspense>
    </div>
  );
}

async function FeeStatementLoader() {
  await connection();
  const [feeResult, paymentResult] = await Promise.all([
    getStudentFeeStatementsAction(),
    getStudentPaymentHistoryAction(),
  ]);

  if (
    (!feeResult.success && feeResult.error?.includes('Unauthorized')) ||
    (!paymentResult.success && paymentResult.error?.includes('Unauthorized'))
  ) {
    redirect('/login');
  }

  const isDemo = feeResult.isDemo || paymentResult.isDemo;
  const errorMessage = !feeResult.success ? feeResult.error : !paymentResult.success ? paymentResult.error : undefined;

  return (
    <main>
      <FeeStatementClient
        statements={feeResult.statements}
        payments={paymentResult.payments}
        isDemo={isDemo}
        errorMessage={errorMessage}
      />
    </main>
  );
}
