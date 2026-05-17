import { TaskletPraxisWorkbench } from '@/components/praxis/tasklet-praxis-workbench';

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ capsuleId?: string }>;
};

export default async function ConversationPage({ params, searchParams }: ConversationPageProps) {
  const [{ conversationId }, query] = await Promise.all([params, searchParams]);
  const capsuleId = query.capsuleId || 'default';

  return (
    <TaskletPraxisWorkbench
      mode="app"
      capsuleId={capsuleId}
      initialConversationId={conversationId}
      initialPanel="ask"
    />
  );
}
