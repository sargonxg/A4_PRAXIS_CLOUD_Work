import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const TaskletPraxisWorkbench = dynamic(
  () => import('@/components/praxis/tasklet-praxis-workbench').then((module) => module.TaskletPraxisWorkbench),
  { loading: () => <WorkbenchLoadingSkeleton /> },
);

type AgentWorkspacePageProps = {
  params: Promise<{ runId: string }>;
};

export default async function AgentWorkspacePage({ params }: AgentWorkspacePageProps) {
  const { runId } = await params;

  return (
    <TaskletPraxisWorkbench
      mode="app"
      activeCapsuleName="Agent workspace"
      capsuleId="default"
      focusedRunId={runId}
    />
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
