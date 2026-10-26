import {
  getStudentClearanceSummaryAction,
  getTranscriptRequestsAction,
  getVaultDocumentsAction,
  getSponsorViewSummaryAction,
} from '@/lib/actions/graduation';
import { GraduationClient } from './graduation-client';
import { AppHeader } from '@/components/shared/app-header';

export const metadata = {
  title: 'Graduation, Clearance & Documents Vault | Student Life Hub',
  description: 'Multi-department graduation clearance checklist, certified documents vault, alumni services, and sponsor view.',
};

export default async function GraduationPage() {
  const [clearanceRes, vaultRes, requestsRes, sponsorRes] = await Promise.all([
    getStudentClearanceSummaryAction(),
    getVaultDocumentsAction(),
    getTranscriptRequestsAction(),
    getSponsorViewSummaryAction(),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <GraduationClient
          initialSummary={clearanceRes.summary}
          initialDocuments={vaultRes.documents || []}
          initialRequests={requestsRes.requests || []}
          initialSponsorView={sponsorRes.summary}
          isDemo={clearanceRes.isDemo}
        />
      </main>
    </div>
  );
}
