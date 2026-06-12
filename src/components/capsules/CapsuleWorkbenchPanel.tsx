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
import { CapsuleAgentWorkflowSection } from '@/components/capsules/workbench/CapsuleAgentWorkflowSection';
import { CapsuleAnatomySection } from '@/components/capsules/workbench/CapsuleAnatomySection';
import { CapsuleCausalChainSection } from '@/components/capsules/workbench/CapsuleCausalChainSection';
import { CapsuleClaimReceiptsSection } from '@/components/capsules/workbench/CapsuleClaimReceiptsSection';
import { CapsuleGraphSection } from '@/components/capsules/workbench/CapsuleGraphSection';
import { CapsuleHistorySection } from '@/components/capsules/workbench/CapsuleHistorySection';
import { CapsuleOutputsSection } from '@/components/capsules/workbench/CapsuleOutputsSection';
import { CapsulePillarsSection } from '@/components/capsules/workbench/CapsulePillarsSection';
import { CapsuleQualitySection } from '@/components/capsules/workbench/CapsuleQualitySection';
import { CapsuleReviewQueueSection } from '@/components/capsules/workbench/CapsuleReviewQueueSection';
import { CapsuleSourceabilityGatesSection } from '@/components/capsules/workbench/CapsuleSourceabilityGatesSection';
import { CapsuleStudioOverviewSection } from '@/components/capsules/workbench/CapsuleStudioOverviewSection';
import { CapsuleTacitKnowledgeSection } from '@/components/capsules/workbench/CapsuleTacitKnowledgeSection';
import { CapsuleTimelineSection } from '@/components/capsules/workbench/CapsuleTimelineSection';
import { CapsuleWorkbenchHeader } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

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
      <CapsuleWorkbenchHeader
        title={model.title}
        summary={model.summary}
        readiness={model.readiness}
        graphNodeCount={model.graph.nodes.length}
        reviewQueueCount={model.reviewQueue.length}
        compact={compact}
        dialecticaLineage={dialecticaLineage}
      />
      <CapsuleStudioOverviewSection
        evidence={model.evidence}
        outputs={model.outputs}
        readiness={model.readiness}
        summaryFacts={model.summaryFacts}
        graphEdges={model.graph.edges}
        capsuleVersion={model.capsuleVersion}
      />
      <CapsuleSourceabilityGatesSection coreSourceability={model.coreSourceability} />
      <CapsuleHistorySection capsuleId={model.capsuleId} currentVersion={model.capsuleVersion} />
      <CapsulePillarsSection pillars={model.pillars} />
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]')}>
        <CapsuleTimelineSection timeline={model.timeline} />
        <CapsuleCausalChainSection causalChains={model.causalChains} />
      </div>
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1fr)]')}>
        <CapsuleQualitySection quality={model.quality} />
        <CapsuleClaimReceiptsSection claims={model.claims} />
      </div>
      <CapsuleAnatomySection
        compact={compact}
        summaryFacts={model.summaryFacts}
        evidence={model.evidence}
        sparse={sparse}
        anatomy={model.anatomy}
        graphSection={graphSection}
      />
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-2')}>
        <CapsuleTacitKnowledgeSection tacitKnowledge={model.tacitKnowledge} />
        <CapsuleAgentWorkflowSection agents={model.agents} />
      </div>
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-2')}>
        <CapsuleOutputsSection outputs={model.outputs} />
        <CapsuleReviewQueueSection reviewQueue={model.reviewQueue} />
      </div>
    </section>
  );
}
