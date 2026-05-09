import { V7AskSurface } from '@/components/v7/v7-ask-surface';

interface V7AskPageProps {
  searchParams?: Promise<{ skill?: string; query?: string; mode?: string; situationId?: string; attachedCoreIds?: string }>;
}

export default async function V7AskPage({ searchParams }: V7AskPageProps) {
  const params = await searchParams;
  const stagedSkillId = typeof params?.skill === 'string' ? params.skill : null;
  const initialQuery = typeof params?.query === 'string' ? params.query : '';
  const initialMode = parseAskMode(params?.mode);
  const initialSituationId = typeof params?.situationId === 'string' ? params.situationId : undefined;
  const initialAttachedCoreIds =
    typeof params?.attachedCoreIds === 'string'
      ? params.attachedCoreIds.split(',').map((id) => id.trim()).filter(Boolean)
      : [];

  return (
    <V7AskSurface
      stagedSkillId={stagedSkillId}
      initialQuery={initialQuery}
      initialMode={initialMode}
      initialSituationId={initialSituationId}
      initialAttachedCoreIds={initialAttachedCoreIds}
    />
  );
}

function parseAskMode(value: unknown) {
  return value === 'deep' || value === 'plan' || value === 'memo' || value === 'brief' || value === 'talking_points'
    ? value
    : 'quick';
}
