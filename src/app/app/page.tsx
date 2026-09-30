import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const PraxisChatFirstShell = dynamic(
  () => import('@/components/app/praxis-chat-first-shell').then((module) => module.PraxisChatFirstShell),
  { loading: () => <AppLaunchpadLoadingSkeleton /> },
);

const TaskletPraxisWorkbench = dynamic(
  () => import('@/components/praxis/tasklet-praxis-workbench').then((module) => module.TaskletPraxisWorkbench),
  { loading: () => <AppLaunchpadLoadingSkeleton /> },
);

type AppIndexPageProps = {
  searchParams: Promise<{ memoId?: string | string[]; capsuleId?: string | string[] }>;
};

export default async function AppIndexPage({ searchParams }: AppIndexPageProps) {
  const query = await searchParams;
  // Repeated or oversized IDs are ambiguous; let the normal Home view handle them.
  const memoId = singleResourceId(query.memoId);
  if (memoId) {
    return <TaskletPraxisWorkbench mode="app" capsuleId={singleResourceId(query.capsuleId) || 'default'} initialMemoId={memoId} initialPanel="ask" />;
  }
  return (
    <Suspense fallback={null}>
      <PraxisChatFirstShell mode="authenticated" />
    </Suspense>
  );
}

function singleResourceId(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  return id && id.length <= 256 && !/[\u0000-\u001f\u007f/\\]/.test(id) ? id : null;
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
