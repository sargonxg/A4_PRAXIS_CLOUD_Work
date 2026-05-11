import { AskHomepage } from '@/components/ask/AskHomepage';
import { listExampleCases } from '@/lib/cases/registry';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';

export default function AppIndexPage() {
  const contexts = listExampleCases().map((caseModule) => ({
    id: caseModule.id,
    name: caseModule.manifest.name,
    region: caseModule.manifest.region,
    summary: caseModule.manifest.summary,
  }));

  return <AskHomepage userModels={PUBLIC_USER_MODELS} contexts={contexts} />;
}
