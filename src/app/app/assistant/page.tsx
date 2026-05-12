import { AskWorkspacePage } from '@/components/ask/AskWorkspacePage';
import { listExampleCases } from '@/lib/cases/registry';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

export const metadata = { title: 'Ask PRAXIS | PRAXIS' };

export default function AskPraxisPage() {
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
    <AskWorkspacePage
      exampleCases={exampleCases}
      marketplaceToolCount={MARKETPLACE_TOOLS.length}
    />
  );
}
