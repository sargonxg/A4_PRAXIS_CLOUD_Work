'use client';

import { PraxisGraphView } from '@/components/graph/PraxisGraphView';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';

export function GraphTab() {
  const { caseModule } = useWorkbenchScope();
  return <PraxisGraphView graph={buildWorkbenchCaseGraph(caseModule)} />;
}
