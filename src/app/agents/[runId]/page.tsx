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
      className="app-light praxis-app-surface"
    />
  );
}

function WorkbenchLoadingSkeleton() {
  return (
    <main className="app-light praxis-app-surface praxis-checker-constellation grid min-h-screen gap-4 p-4" data-testid="tasklet-workbench-loading-skeleton">
      <Skeleton className="h-16 w-full rounded-[var(--radius-xl)]" />
      <div className="grid min-h-0 gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <Skeleton className="hidden h-[32rem] w-full rounded-[var(--radius-xl)] lg:block" />
        <Skeleton className="h-[32rem] w-full rounded-[var(--radius-xl)]" />
      </div>
    </main>
  );
}
