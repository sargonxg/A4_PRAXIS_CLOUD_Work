import { TaskletPraxisWorkbench } from '@/components/praxis/tasklet-praxis-workbench';

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
