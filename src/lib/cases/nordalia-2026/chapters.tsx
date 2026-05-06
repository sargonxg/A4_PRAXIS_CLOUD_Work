import type { ReactNode } from 'react';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';
import { DEMO_CONFLICT } from '@/lib/constants/demo-conflict';

function NordaliaPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      <div className="text-sm leading-6 text-slate-650">{children}</div>
    </div>
  );
}

export const nordalia2026Chapters: Record<WorkbenchChapterId, () => ReactNode> = {
  'situation-frame': () => (
    <NordaliaPanel title="Synthetic situation frame">
      <p>{DEMO_CONFLICT.description}</p>
    </NordaliaPanel>
  ),
  'source-receipts': () => (
    <NordaliaPanel title="Source receipts">
      <p>
        This example is intentionally synthetic. It uses a structured fixture rather than public-source receipts, which keeps
        validation deterministic while exercising the same workbench shell.
      </p>
    </NordaliaPanel>
  ),
  'conflict-graph': () => (
    <NordaliaPanel title="Conflict graph">
      <p>
        {DEMO_CONFLICT.actors.length} actors, {DEMO_CONFLICT.relationships.length} relationships, {DEMO_CONFLICT.events.length}
        {' '}events, and {DEMO_CONFLICT.commitments.length} commitments are available for graph inspection.
      </p>
    </NordaliaPanel>
  ),
  'dialectica-reasoning': () => (
    <NordaliaPanel title="DIALECTICA reasoning">
      <p>
        Use this case to validate leverage tracing, commitment checks, and path search without binding the product story to a
        real-world Syria file.
      </p>
    </NordaliaPanel>
  ),
  'decision-product': () => (
    <NordaliaPanel title="Decision product">
      <p>
        Draft a mediator-facing brief that separates contested claims, graph-supported evidence, and analyst judgments.
      </p>
    </NordaliaPanel>
  ),
};
