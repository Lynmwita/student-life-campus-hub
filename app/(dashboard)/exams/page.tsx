import { Metadata } from 'next';
import { AppHeader } from '@/components/shared/app-header';
import { ExamsClient } from './exams-client';
import {
  getDigitalExamPassAction,
  getExamTimetableAction,
} from '@/lib/actions/exams';

export const metadata: Metadata = {
  title: 'Examinations & Pass | Student Life & Campus Hub',
  description: 'Official Digital Examination Pass, registrar clearance status, and semester paper timetable.',
};

export default async function ExamsPage() {
  const [passRes, timetableRes] = await Promise.all([
    getDigitalExamPassAction(),
    getExamTimetableAction(),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />
      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 font-sans">
        <ExamsClient
          initialPass={passRes.pass}
          initialTimetable={timetableRes.timetable}
          nextExam={timetableRes.nextExam || null}
          daysToNextExam={timetableRes.daysToNextExam ?? null}
          isDemo={passRes.isDemo}
        />
      </main>
    </div>
  );
}
