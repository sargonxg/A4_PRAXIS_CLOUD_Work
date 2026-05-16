import { AskPraxisHome } from '@/components/dashboard/ask-praxis-home';
import { listExampleCases } from '@/lib/cases/registry';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

export default function DashboardPage() {
  const exampleCases = listExampleCases().map((caseModule) => ({
    id: caseModule.id,
    name: caseModule.manifest.name,
    region: caseModule.manifest.region,
    summary: caseModule.manifest.summary,
    risk: caseModule.manifest.risk,
    glaslStage: caseModule.manifest.glaslStage,
    tags: caseModule.manifest.tags,
  }));

  return (
    <AskPraxisHome
      exampleCases={exampleCases}
      marketplaceToolCount={MARKETPLACE_TOOLS.length}
    />
  );
}
