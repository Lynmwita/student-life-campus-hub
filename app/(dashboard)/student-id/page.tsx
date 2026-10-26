import { Metadata } from 'next';
import { AppHeader } from '@/components/shared/app-header';
import { StudentIdClient } from './student-id-client';
import { getDigitalStudentIdAction } from '@/lib/actions/student-id';

export const metadata: Metadata = {
  title: 'Digital Student ID Badge | Student Life & Campus Hub',
  description: 'Official digital student identity pass with verification QR and library barcode.',
};

export default async function StudentIdPage() {
  const res = await getDigitalStudentIdAction();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 font-sans">
        <StudentIdClient card={res.card} isDemo={res.isDemo} />
      </main>
    </div>
  );
}
