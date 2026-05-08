'use client';

import { PraxisGraphView } from '@/components/graph/PraxisGraphView';
import { GraphIntelligencePanels } from '@/components/workbench/graph/GraphIntelligencePanels';
import { EmptyStateGuidance } from '@/components/workbench/empty-state/EmptyStateGuidance';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';

export function WorkbenchGraphPanel() {
  const { caseModule, situation } = useWorkbenchScope();
  const graph = buildWorkbenchCaseGraph(caseModule);
  return (
    <div className="space-y-4">
      <EmptyStateGuidance tabId="graph" caseModule={caseModule} userRole={situation.userRole} />
      <PraxisGraphView graph={graph} />
      <GraphIntelligencePanels caseModule={caseModule} graph={graph} />
    </div>
  );
}
