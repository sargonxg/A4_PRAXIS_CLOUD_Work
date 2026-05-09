import { V7AskSurface } from '@/components/v7/v7-ask-surface';

interface V7AskPageProps {
  searchParams?: Promise<{ skill?: string; query?: string }>;
}

export default async function V7AskPage({ searchParams }: V7AskPageProps) {
  const params = await searchParams;
  const stagedSkillId = typeof params?.skill === 'string' ? params.skill : null;
  const initialQuery = typeof params?.query === 'string' ? params.query : '';

  return <V7AskSurface stagedSkillId={stagedSkillId} initialQuery={initialQuery} />;
}
