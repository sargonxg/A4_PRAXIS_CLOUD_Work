import { V7AskSurface } from '@/components/v7/v7-ask-surface';

interface V7AskThreadPageProps {
  params?: Promise<{ threadId?: string }>;
  searchParams?: Promise<{ skill?: string; query?: string; mode?: string; situationId?: string; attachedCoreIds?: string }>;
}

export default async function V7AskThreadPage({ params, searchParams }: V7AskThreadPageProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const stagedSkillId = typeof query?.skill === 'string' ? query.skill : null;
  const initialQuery = typeof query?.query === 'string' ? query.query : '';
  const initialAttachedCoreIds =
    typeof query?.attachedCoreIds === 'string'
      ? query.attachedCoreIds.split(',').map((id) => id.trim()).filter(Boolean)
      : [];
  const threadId = typeof resolvedParams?.threadId === 'string' ? resolvedParams.threadId : undefined;

  return (
    <V7AskSurface
      stagedSkillId={stagedSkillId}
      initialQuery={initialQuery}
      initialThreadId={threadId}
      initialAttachedCoreIds={initialAttachedCoreIds}
    />
  );
}
