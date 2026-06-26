'use client';

import { memo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { CompactList, StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleResearchSection = memo(function CapsuleResearchSection({
  research,
}: {
  research: CapsuleWorkbenchViewModel['research'];
}) {
  const sourceItems = research.sourceSpine.slice(0, 5).map((source) => (
    `${source.label} (${source.role}, tier ${source.reliabilityTier ?? 'n/a'})`
  ));
  const claimItems = [
    `${research.claimPosture.supported} supported`,
    `${research.claimPosture.weak} weak`,
    `${research.claimPosture.missing} missing`,
    `${research.claimPosture.stale} stale`,
  ];
  const graphItems = [
    `${research.graphProjection.provider} ${research.graphProjection.status}`,
    `${research.graphProjection.namedGraph}: ${research.graphProjection.nodeCount} nodes / ${research.graphProjection.edgeCount} edges`,
    research.graphProjection.canonicalStore,
    research.graphProjection.promotionGate,
  ];
  const ontologyItems = [
    ...research.ontologyCoverage.activeOntologyIds.slice(0, 4),
    ...research.ontologyCoverage.graphNodeTypes.slice(0, 4),
    `${research.ontologyCoverage.activeCount} active ontology item(s)`,
  ];

  return (
    <WorkbenchSection title="Research dossier" icon={BookOpenCheck}>
      <div className="grid gap-3" data-testid="capsule-research-dossier">
        <div className="flex flex-wrap items-center gap-2">
          <StatePill state="advisory" label={research.status} />
          <StatePill state={research.refresh.status.includes('refresh') ? 'proposed' : 'reviewed'} label={`refresh ${research.refresh.status}`} />
          <StatePill state={research.unsupportedClaimCount ? 'proposed' : 'reviewed'} label={`${research.unsupportedClaimCount} unsupported`} />
        </div>
        <p className="text-sm leading-6 text-slate-700">{research.humanJob}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ResearchRail title="Source receipts" testId="capsule-source-receipts" items={sourceItems} empty="No source spine attached yet." />
          <ResearchRail title="Claim ledger" testId="capsule-claim-ledger-summary" items={claimItems} empty="No claim posture available." />
          <ResearchRail title="Reasoning graph" testId="capsule-reasoning-graph-summary" items={graphItems} empty="No advisory graph projection." />
          <ResearchRail title="Ontology stack" testId="capsule-ontology-stack-summary" items={ontologyItems} empty="No ontology coverage available." />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ResearchRail title="Evidence gaps" testId="capsule-evidence-gaps" items={research.evidenceGaps.slice(0, 5)} empty="No visible evidence gaps." />
          <ResearchRail title="Agent workflow" testId="capsule-agent-workflow-summary" items={research.workflow.steps.slice(0, 5)} empty="No workflow steps attached." />
          <ResearchRail title="Review queue" testId="capsule-review-gates-summary" items={research.reviewGates.slice(0, 5)} empty="No review gates attached." />
        </div>
      </div>
    </WorkbenchSection>
  );
});

function ResearchRail({
  title,
  testId,
  items,
  empty,
}: {
  title: string;
  testId: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2" data-testid={testId}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      <CompactList items={items} empty={empty} />
    </div>
  );
}
