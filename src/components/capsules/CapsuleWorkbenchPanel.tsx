'use client';

import { useMemo } from 'react';
import {
  buildCapsuleWorkbenchViewModel,
  type CapsuleWorkbenchAgentRunInput,
  type CapsuleWorkbenchCapsuleInput,
  type CapsuleWorkbenchDocumentInput,
  type CapsuleWorkbenchTacitMemoryInput,
} from '@/lib/context/capsule-workbench-view-model';
import { cn } from '@/lib/utils/cn';
import { CapsuleOntologyWorkbench } from '@/components/capsules/CapsuleOntologyWorkbench';
import { CapsuleAdvancedDrawer } from '@/components/capsules/workbench/CapsuleAdvancedDrawer';
import { CapsuleGraphSection } from '@/components/capsules/workbench/CapsuleGraphSection';
import { StatePill } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export function CapsuleWorkbenchPanel({
  capsule,
  repositoryDocuments = [],
  agentRuns = [],
  tacitMemories = [],
  compact = false,
}: {
  capsule: CapsuleWorkbenchCapsuleInput;
  repositoryDocuments?: CapsuleWorkbenchDocumentInput[];
  agentRuns?: CapsuleWorkbenchAgentRunInput[];
  tacitMemories?: CapsuleWorkbenchTacitMemoryInput[];
  compact?: boolean;
}) {
  const model = useMemo(
    () => buildCapsuleWorkbenchViewModel({ capsule, repositoryDocuments, agentRuns, tacitMemories }),
    [capsule, repositoryDocuments, agentRuns, tacitMemories],
  );
  const sparse = model.evidence.sourceCount === 0;
  const capsuleTags = useMemo(() => (capsule as { community?: { tags?: string[] } }).community?.tags ?? [], [capsule]);
  const dialecticaLineage = capsuleTags.includes('dialectica');
  const graphSection = useMemo(() => (
    <CapsuleGraphSection
      graph={model.graph}
      capsuleId={model.capsuleId}
      capsuleVersion={model.capsuleVersion}
      reviewQueue={model.reviewQueue}
      ontology={model.ontology}
    />
  ), [model.capsuleId, model.capsuleVersion, model.graph, model.ontology, model.reviewQueue]);

  return (
    <section
      className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]', compact ? 'space-y-4' : 'space-y-5')}
      data-testid="capsule-workbench-panel"
    >
      <CompactCapsuleHeader
        title={model.title}
        readiness={model.readiness}
        version={model.capsuleVersion}
        dialecticaLineage={dialecticaLineage}
      />
      <CapsuleOntologyWorkbench
        capsuleId={model.capsuleId}
        capsuleVersion={model.capsuleVersion}
        ontology={model.ontology}
        graph={model.graph}
        reviewQueue={model.reviewQueue}
      />
      <CapsuleEvidenceStrip evidence={model.evidence} />
      <CapsuleAdvancedDrawer
        model={model}
        compact={compact}
        sparse={sparse}
        graphSection={graphSection}
        agentRuns={agentRuns}
      />
    </section>
  );
}

function CompactCapsuleHeader({
  title,
  readiness,
  version,
  dialecticaLineage,
}: {
  title: string;
  readiness: ReturnType<typeof buildCapsuleWorkbenchViewModel>['readiness'];
  version: number;
  dialecticaLineage: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h2 className="truncate text-base font-semibold text-slate-950">{title}</h2>
        {dialecticaLineage ? (
          <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-800" data-testid="capsule-dialectica-lineage">
            DIALECTICA lineage
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <StatePill state={readiness.tier} label={`Ready ${readiness.score}`} />
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">v{version}</span>
      </div>
    </header>
  );
}

function CapsuleEvidenceStrip({ evidence }: { evidence: ReturnType<typeof buildCapsuleWorkbenchViewModel>['evidence'] }) {
  const totalClaims = evidence.supportedClaims.length + evidence.weakClaims.length + evidence.unsupportedClaims.length;
  const sourceBackedPct = totalClaims ? Math.round((evidence.supportedClaims.length / totalClaims) * 100) : 0;

  return (
    <section className="grid gap-2 rounded-md border border-slate-200 bg-white p-2 sm:grid-cols-3" aria-label="Evidence strip">
      <EvidenceMetric label="Sources" value={`${evidence.sourceIds.length}`} />
      <EvidenceMetric label="Documents" value={`${evidence.documentIds.length}`} />
      <EvidenceMetric label="Source-backed claims" value={`${sourceBackedPct}%`} tone={sourceBackedPct >= 70 ? 'green' : sourceBackedPct ? 'amber' : 'red'} />
    </section>
  );
}

function EvidenceMetric({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'green' | 'amber' | 'red' | 'slate' }) {
  const toneClass = {
    green: 'text-emerald-800',
    amber: 'text-amber-800',
    red: 'text-rose-800',
    slate: 'text-slate-900',
  }[tone];
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={cn('text-lg font-semibold', toneClass)}>{value}</p>
    </div>
  );
}
