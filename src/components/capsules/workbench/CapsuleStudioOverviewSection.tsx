'use client';

import { memo } from 'react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { CompactList } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleStudioOverviewSection = memo(function CapsuleStudioOverviewSection({
  evidence,
  research,
  outputs,
  readiness,
  summaryFacts,
  graphEdges,
  capsuleVersion,
}: {
  evidence: CapsuleWorkbenchViewModel['evidence'];
  research: CapsuleWorkbenchViewModel['research'];
  outputs: CapsuleWorkbenchViewModel['outputs'];
  readiness: CapsuleWorkbenchViewModel['readiness'];
  summaryFacts: CapsuleWorkbenchViewModel['summaryFacts'];
  graphEdges: CapsuleWorkbenchViewModel['graph']['edges'];
  capsuleVersion: number;
}) {
  const sourceItems = evidence.sourceIds.slice(0, 3).map((id) => `${id} backs ${claimCountForSource(graphEdges, id)} claim(s)`);
  const claimItems = [
    ...evidence.supportedClaims.map((claim) => `supported: ${claim}`),
    ...evidence.weakClaims.map((claim) => `weak: ${claim}`),
    ...evidence.unsupportedClaims.map((claim) => `unsupported: ${claim}`),
  ];
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label="Capsule Studio overview">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {['Sources & freshness', 'Claim ledger', 'Tools attached', 'Outputs produced', 'Memory & tacit knowledge', 'Trust & readiness', 'History/diff'].map((label) => (
          <span key={label} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
            {label}
          </span>
        ))}
      </div>
      <div className="grid gap-3 text-xs leading-5 text-slate-600 lg:grid-cols-4">
        <StudioRail title="Sources & freshness" items={sourceItems.length ? sourceItems : [evidence.sourcePosture]} />
        <StudioRail title="Claim ledger" items={claimItems.length ? claimItems.slice(0, 4) : ['No claim ledger entries yet.']} />
        <StudioRail title="Outputs produced" items={outputs.length ? outputs.map((output) => `${output.label} from v${capsuleVersion}`) : ['No output capsule or memo linked yet.']} />
        <StudioRail
          title="Trust & readiness"
          items={[
            `Trust ${readiness.tier} / ${readiness.score}`,
            ...(readiness.diagnostics.length ? readiness.diagnostics.slice(0, 2) : [summaryFacts.nextAction]),
            `${research.sourceSpineCount} source-spine receipt(s); ${research.evidenceGapCount} evidence gap(s)`,
          ]}
        />
      </div>
    </section>
  );
});

function StudioRail({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      <CompactList items={items} empty="Nothing attached yet." />
    </div>
  );
}

function claimCountForSource(graphEdges: CapsuleWorkbenchViewModel['graph']['edges'], sourceId: string): number {
  return graphEdges.filter((edge) => edge.target === `source:${sourceId}` && edge.source.startsWith('claim:')).length;
}
