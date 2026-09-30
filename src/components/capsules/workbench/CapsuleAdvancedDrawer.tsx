'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type {
  CapsuleWorkbenchAgentRunInput,
  CapsuleWorkbenchCapsuleInput,
  CapsuleWorkbenchViewModel,
} from '@/lib/context/capsule-workbench-view-model';
import type { CapsuleCategoryId } from '@/lib/constants/aco-colors';
import { cn } from '@/lib/utils/cn';
import { CapsuleAgentWorkflowSection } from '@/components/capsules/workbench/CapsuleAgentWorkflowSection';
import { CapsuleAnatomySection } from '@/components/capsules/workbench/CapsuleAnatomySection';
import { CapsuleCausalChainSection } from '@/components/capsules/workbench/CapsuleCausalChainSection';
import { CapsuleClaimReceiptsSection } from '@/components/capsules/workbench/CapsuleClaimReceiptsSection';
import { CapsuleHistorySection } from '@/components/capsules/workbench/CapsuleHistorySection';
import { CapsuleOutputsSection } from '@/components/capsules/workbench/CapsuleOutputsSection';
import { CapsulePillarsSection } from '@/components/capsules/workbench/CapsulePillarsSection';
import { CapsuleQualitySection } from '@/components/capsules/workbench/CapsuleQualitySection';
import { CapsuleResearchSection } from '@/components/capsules/workbench/CapsuleResearchSection';
import { CapsuleReviewQueueSection } from '@/components/capsules/workbench/CapsuleReviewQueueSection';
import { CapsuleSourceabilityGatesSection } from '@/components/capsules/workbench/CapsuleSourceabilityGatesSection';
import { CapsuleStudioOverviewSection } from '@/components/capsules/workbench/CapsuleStudioOverviewSection';
import { CapsuleTacitKnowledgeSection } from '@/components/capsules/workbench/CapsuleTacitKnowledgeSection';
import { CapsuleTimelineSection } from '@/components/capsules/workbench/CapsuleTimelineSection';

type AdvancedTabId =
  | 'overview'
  | 'graph'
  | 'pillars'
  | 'timeline'
  | 'causal'
  | 'quality'
  | 'anatomy'
  | 'memory'
  | 'agents'
  | 'outputs'
  | 'review';

export function CapsuleAdvancedDrawer({
  model,
  compact,
  sparse,
  graphSection,
  agentRuns,
  inspectionCategory,
  onReviewed,
  reviewEnabled = true,
}: {
  model: CapsuleWorkbenchViewModel;
  compact: boolean;
  sparse: boolean;
  graphSection: ReactNode;
  agentRuns: CapsuleWorkbenchAgentRunInput[];
  inspectionCategory?: CapsuleCategoryId | null;
  onReviewed?: (capsule: CapsuleWorkbenchCapsuleInput) => void;
  reviewEnabled?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(inspectionCategory));
  const [activeTab, setActiveTab] = useState<AdvancedTabId>(
    inspectionCategory ? categoryToTab(inspectionCategory) : 'overview',
  );
  const tabs = useMemo(() => advancedTabs(), []);
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <section className="rounded-md border border-slate-200 bg-white" data-testid="capsule-advanced-drawer">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Inspect</span>
          <span className="block text-sm font-semibold text-slate-900">Ontologies, graph, reasoning, receipts</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', open ? 'rotate-180' : '')} />
      </button>

      {open ? (
        <div className="border-t border-slate-200 p-3">
          <div className="flex gap-1 overflow-x-auto pb-2" role="tablist" aria-label="Advanced capsule sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-semibold',
                  activeTab === tab.id
                    ? 'border-slate-900 bg-slate-950 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="pt-2" role="tabpanel">
            {renderTab(active.id, { model, compact, sparse, graphSection, agentRuns, onReviewed, reviewEnabled })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function categoryToTab(category: CapsuleCategoryId): AdvancedTabId {
  if (category === 'user') return 'memory';
  if (category === 'situation') return 'graph';
  if (category === 'tools') return 'agents';
  return 'outputs';
}

function advancedTabs(): Array<{ id: AdvancedTabId; label: string }> {
  return [
    { id: 'overview', label: 'Overview' },
    { id: 'graph', label: 'Graph' },
    { id: 'pillars', label: 'Pillars' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'causal', label: 'Causal' },
    { id: 'quality', label: 'Quality' },
    { id: 'anatomy', label: 'Anatomy' },
    { id: 'memory', label: 'Tacit' },
    { id: 'agents', label: 'Runs' },
    { id: 'outputs', label: 'Outputs' },
    { id: 'review', label: 'Review' },
  ];
}

function renderTab(
  id: AdvancedTabId,
  input: {
    model: CapsuleWorkbenchViewModel;
    compact: boolean;
    sparse: boolean;
    graphSection: ReactNode;
    agentRuns: CapsuleWorkbenchAgentRunInput[];
    onReviewed?: (capsule: CapsuleWorkbenchCapsuleInput) => void;
    reviewEnabled: boolean;
  },
) {
  const { model, compact, sparse, graphSection, agentRuns } = input;
  if (id === 'overview') {
    return (
      <div className="grid gap-3">
        <CapsuleStudioOverviewSection
          evidence={model.evidence}
          research={model.research}
          outputs={model.outputs}
          readiness={model.readiness}
          summaryFacts={model.summaryFacts}
          graphEdges={model.graph.edges}
          capsuleVersion={model.capsuleVersion}
        />
        <CapsuleResearchSection research={model.research} />
        <CapsuleSourceabilityGatesSection coreSourceability={model.coreSourceability} />
      </div>
    );
  }
  if (id === 'graph') {
    return (
      <div className="grid gap-3">
        {graphSection}
        <CapsuleHistorySection capsuleId={model.capsuleId} currentVersion={model.capsuleVersion} />
      </div>
    );
  }
  if (id === 'pillars') return <CapsulePillarsSection pillars={model.pillars} />;
  if (id === 'timeline') return <CapsuleTimelineSection timeline={model.timeline} />;
  if (id === 'causal') return <CapsuleCausalChainSection causalChains={model.causalChains} />;
  if (id === 'quality') {
    return (
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1fr)]')}>
        <CapsuleQualitySection
          quality={model.quality}
          capsuleId={model.capsuleId}
          capsuleVersion={model.capsuleVersion}
          agentRuns={agentRuns}
        />
        <CapsuleClaimReceiptsSection claims={model.claims} />
      </div>
    );
  }
  if (id === 'anatomy') {
    return (
      <CapsuleAnatomySection
        compact={compact}
        summaryFacts={model.summaryFacts}
        evidence={model.evidence}
        sparse={sparse}
        anatomy={model.anatomy}
        graphSection={graphSection}
      />
    );
  }
  if (id === 'memory') return <CapsuleTacitKnowledgeSection tacitKnowledge={model.tacitKnowledge} />;
  if (id === 'agents') return <CapsuleAgentWorkflowSection agents={model.agents} />;
  if (id === 'outputs') return <CapsuleOutputsSection outputs={model.outputs} />;
  return <CapsuleReviewQueueSection key={model.capsuleId} capsuleId={input.reviewEnabled ? model.capsuleId : undefined} reviewQueue={model.reviewQueue} onReviewed={input.onReviewed} />;
}
