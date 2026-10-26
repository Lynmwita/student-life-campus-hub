import { getUnitRegistrationAction } from '@/lib/actions/unit-registration';
import { UnitsClient } from './units-client';
import { AppHeader } from '@/components/shared/app-header';

export const metadata = {
  title: 'Unit Registration | Student Life Hub',
  description: 'Register semester course units, validate prerequisites, and monitor credit loads.',
};

export default async function UnitsPage() {
  const { rules, availableUnits, registeredUnits, isDemo } =
    await getUnitRegistrationAction();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <UnitsClient
          initialRules={rules}
          initialAvailableUnits={availableUnits}
          initialRegisteredUnits={registeredUnits}
          isDemo={isDemo}
        />
      </main>
    </div>
  );
}
