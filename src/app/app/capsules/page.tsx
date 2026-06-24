import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const CapsuleLibraryWithTry = dynamic(
  () => import('@/components/capsules/CapsuleLibrary').then((module) => module.CapsuleLibraryWithTry),
  { loading: () => <LibraryLoadingSkeleton /> },
);

const TaskletPraxisWorkbench = dynamic(
  () => import('@/components/praxis/tasklet-praxis-workbench').then((module) => module.TaskletPraxisWorkbench),
  { loading: () => <WorkbenchLoadingSkeleton /> },
);

type CapsulesPageProps = {
  searchParams: Promise<{ lane?: string; panel?: string; starter?: string; tab?: string }>;
};

export default async function CapsulesPage({ searchParams }: CapsulesPageProps) {
  const { lane, panel, starter, tab } = await searchParams;
  const initialFactoryLane = lane === 'repository' || lane === 'sources' ? 'sources' : undefined;
  const initialPanel = panel === 'ask' || tab === 'work' ? 'ask' : 'capsules';

  return (
    <>
      <div className="bg-emerald-50/30 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <CapsuleLibraryWithTry initialCategory="all" />
        </div>
      </div>
      <TaskletPraxisWorkbench
        mode="app"
        capsuleId={starter || 'default'}
        initialPanel={initialPanel}
        initialFactoryLane={lane === 'inspect' ? 'inspect' : initialFactoryLane}
      />
    </>
  );
}

function WorkbenchLoadingSkeleton() {
  return (
    <main className="grid min-h-screen gap-4 bg-emerald-50/30 p-4" data-testid="tasklet-workbench-loading-skeleton">
      <Skeleton className="h-16 w-full" />
      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-[32rem] w-full" />
        <Skeleton className="hidden h-[32rem] w-full lg:block" />
      </div>
    </main>
  );
}

function LibraryLoadingSkeleton() {
  return (
    <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]" data-testid="capsule-library-loading-skeleton">
      <Skeleton className="h-6 w-40" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </section>
  );
}
