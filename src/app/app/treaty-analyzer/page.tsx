'use client';

import { ToolPageShell } from '@/components/praxis/tool-page-shell';
import { DemoTreatyAnalyzerPage } from './_demo';

export default function TreatyAnalyzerPage() {
  return (
    <ToolPageShell
      toolId="treaty-analyzer"
      toolName="Treaty Analysis"
      toolDataKey="treaty_analysis"
      apiEndpoint="/api/ai/treaty-analyze"
      creditCost={3}
      renderDemo={(situation) => (
        <DemoTreatyAnalyzerPage situationName={situation?.name} />
      )}
    />
  );
}
