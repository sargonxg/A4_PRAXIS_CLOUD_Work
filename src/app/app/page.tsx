import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const PraxisAppLaunchpad = dynamic(
  () => import('@/components/app/praxis-app-launchpad').then((module) => module.PraxisAppLaunchpad),
  { loading: () => <AppLaunchpadLoadingSkeleton /> },
);

export default function AppIndexPage() {
  return (
    <Suspense fallback={null}>
      <PraxisAppLaunchpad />
    </Suspense>
  );
}

function AppLaunchpadLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-emerald-50/30 p-4" data-testid="app-launchpad-loading-skeleton">
      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <Skeleton className="hidden h-[32rem] lg:block" />
        <div className="grid gap-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-[30rem] w-full" />
        </div>
      </div>
    </main>
  );
}
