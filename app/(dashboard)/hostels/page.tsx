import { Suspense } from 'react';
import { connection } from 'next/server';
import { AppHeader } from '@/components/shared/app-header';
import {
  getMyRoomAllocationAction,
  getHostelMaintenanceTicketsAction,
  getHostelApplicationAction,
  getRoommateMatchesAction,
  getWardenAnnouncementsAction,
  getVerifiedOffCampusHousesAction,
} from '@/lib/actions/hostels';
import { HostelsClient } from './hostels-client';
import { redirect } from 'next/navigation';

export const instant = false;

export const metadata = {
  title: 'Hostels & Residence | Student Life & Campus Hub',
  description: 'On-campus room allocation, maintenance requests, roommate compatibility matching, and verified private student housing.',
};

export default function HostelsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#0B1D33] border-t-[#C59B27] rounded-full animate-spin mx-auto mb-3" />
            <p role="status" className="text-xs text-slate-500 font-medium">
              Loading residence records and hostel allocations...
            </p>
          </div>
        }
      >
        <HostelsLoader />
      </Suspense>
    </div>
  );
}

async function HostelsLoader() {
  await connection();
  const [
    allocResult,
    ticketsResult,
    appResult,
    matchesResult,
    wardenResult,
    housesResult,
  ] = await Promise.all([
    getMyRoomAllocationAction(),
    getHostelMaintenanceTicketsAction(),
    getHostelApplicationAction(),
    getRoommateMatchesAction(),
    getWardenAnnouncementsAction(),
    getVerifiedOffCampusHousesAction(),
  ]);

  if (!allocResult.success && allocResult.error?.includes('Unauthorized')) {
    redirect('/login');
  }

  const isDemo = allocResult.isDemo || ticketsResult.isDemo;

  return (
    <main>
      <HostelsClient
        initialAllocation={allocResult.allocation}
        initialTickets={ticketsResult.tickets}
        initialApplication={appResult.application}
        initialMatches={matchesResult.matches}
        initialAnnouncements={wardenResult.announcements}
        initialOffCampusHouses={housesResult.houses}
        isDemo={isDemo}
      />
    </main>
  );
}
