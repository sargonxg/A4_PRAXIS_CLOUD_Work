'use client';

import { PraxisWriter } from '@/components/writer/PraxisWriter';
import type { ToolDefinition } from '@/types/situation';

type ExampleCase = {
  id: string;
  name: string;
  region: string;
  summary: string;
};

export function WriteWithPraxisPage({
  exampleCases: _exampleCases,
  suggestedTools: _suggestedTools,
}: {
  exampleCases?: ExampleCase[];
  suggestedTools?: ToolDefinition[];
}) {
  return <PraxisWriter mode="write" title="Policy note" templateId="policy-memo" />;
}
