import { AskPraxisHome } from '@/components/dashboard/ask-praxis-home';
import { listExampleCases } from '@/lib/cases/registry';

type AppIndexPageProps = {
  searchParams?: Promise<{
    memoId?: string;
    draftId?: string;
  }>;
};

export default async function AppIndexPage({ searchParams }: AppIndexPageProps) {
  const query = await searchParams;
  const exampleCases = listExampleCases().map((caseModule) => ({
    id: caseModule.id,
    name: caseModule.manifest.name,
    region: caseModule.manifest.region,
    summary: caseModule.manifest.summary,
    risk: caseModule.manifest.risk,
    glaslStage: caseModule.manifest.glaslStage,
    tags: caseModule.manifest.tags,
  }));

  return <AskPraxisHome exampleCases={exampleCases} marketplaceToolCount={0} initialMemoId={query?.memoId ?? query?.draftId ?? null} />;
}
