import { WriteWithPraxisPage } from '@/components/write/WriteWithPraxisPage';
import { HERO_TOOLS } from '@/lib/constants/tool-registry';
import { listExampleCases } from '@/lib/cases/registry';

export const metadata = {
  title: 'Write with PRAXIS | PRAXIS',
  description: 'Draft, revise, and export policy work from attached PRAXIS cores.',
};

export default function WritePage() {
  const exampleCases = listExampleCases().slice(0, 4).map((item) => ({
    id: item.id,
    name: item.manifest.name,
    region: item.manifest.region,
    summary: item.manifest.summary,
  }));

  return <WriteWithPraxisPage exampleCases={exampleCases} suggestedTools={HERO_TOOLS.slice(0, 8)} />;
}
