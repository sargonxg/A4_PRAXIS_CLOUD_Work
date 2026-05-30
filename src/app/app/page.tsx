import { Suspense } from 'react';
import { PraxisAppLaunchpad } from '@/components/app/praxis-app-launchpad';

export default function AppIndexPage() {
  return (
    <Suspense fallback={null}>
      <PraxisAppLaunchpad />
    </Suspense>
  );
}
