import { getLibraryAccountAction } from '@/lib/actions/library';
import { LibraryClient } from './library-client';
import { AppHeader } from '@/components/shared/app-header';

export const metadata = {
  title: 'Library & Learning Commons | Student Life Hub',
  description: 'Manage active book loans, renewal requests, due dates, and library clearance.',
};

export default async function LibraryPage() {
  const { clearance, borrowedBooks, isDemo } = await getLibraryAccountAction();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <LibraryClient
          initialClearance={clearance}
          initialBooks={borrowedBooks}
          isDemo={isDemo}
        />
      </main>
    </div>
  );
}
