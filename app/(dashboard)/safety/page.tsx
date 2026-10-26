import {
  getKdpaStudentDataExportAction,
  getLostAndFoundItemsAction,
} from '@/lib/actions/community-safety';
import { SafetyClient } from './safety-client';
import { AppHeader } from '@/components/shared/app-header';

export const metadata = {
  title: 'Community, Safety & Privacy Centre | Student Life Hub',
  description: 'Emergency SOS alerts, verified lost and found custody, and statutory KDPA data protection exports.',
};

export default async function SafetyPage() {
  const [lostFoundRes, kdpaRes] = await Promise.all([
    getLostAndFoundItemsAction(),
    getKdpaStudentDataExportAction(),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <SafetyClient
          initialItems={lostFoundRes.items || []}
          initialKdpaPackage={kdpaRes.package}
          isDemo={lostFoundRes.isDemo}
        />
      </main>
    </div>
  );
}
