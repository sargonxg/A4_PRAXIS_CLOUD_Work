'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, type CSSProperties } from 'react';
import { FileText, Info, Search, Target, UserRound, Wrench, type LucideIcon } from 'lucide-react';
import {
  buildCapsuleWorkbenchViewModel,
  type CapsuleWorkbenchAgentRunInput,
  type CapsuleWorkbenchCapsuleInput,
  type CapsuleWorkbenchDocumentInput,
  type CapsuleWorkbenchPillarId,
  type CapsuleWorkbenchTacitMemoryInput,
  type CapsuleWorkbenchViewModel,
} from '@/lib/context/capsule-workbench-view-model';
import {
  CAPSULE_CATEGORY_IDS,
  getCapsuleCategoryPalette,
  type CapsuleCategoryIconName,
  type CapsuleCategoryId,
} from '@/lib/constants/aco-colors';
import { cn } from '@/lib/utils/cn';
import { CapsuleOntologyWorkbench } from '@/components/capsules/CapsuleOntologyWorkbench';
import { CapsuleAdvancedDrawer } from '@/components/capsules/workbench/CapsuleAdvancedDrawer';
import { CapsuleGraphSection } from '@/components/capsules/workbench/CapsuleGraphSection';
import { CapsuleResearchSection } from '@/components/capsules/workbench/CapsuleResearchSection';
import { StatePill } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

const CapsuleAgentView = dynamic(() => import('@/components/capsules/CapsuleAgentView'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-md border border-slate-200 bg-slate-50" aria-label="Loading agent context" />,
});

const CATEGORY_ICONS: Record<CapsuleCategoryIconName, LucideIcon> = {
  UserRound,
  Target,
  Wrench,
  FileText,
};

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
  const [workbenchView, setWorkbenchView] = useState<'graph' | 'agent'>('graph');
  const [inspectedCategory, setInspectedCategory] = useState<CapsuleCategoryId | null>(null);
  const categoryCards = useMemo(() => buildCapsuleCategoryCards(model), [model]);
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
      <CapsuleCategoryOverview
        categories={categoryCards}
        inspectedCategory={inspectedCategory}
        onInspect={(category) => setInspectedCategory(category.id)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CapsuleWorkbenchViewToggle value={workbenchView} onChange={setWorkbenchView} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Open the full capsule depth: ontology, graph, reasoning paths, source receipts, situation, tools, and outputs."
            onClick={() => setInspectedCategory((current) => current ?? 'situation')}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-900 bg-slate-950 px-3 text-xs font-semibold text-white"
          >
            <Search className="h-3.5 w-3.5" />
            Inspect
          </button>
          {inspectedCategory ? (
            <button
              type="button"
              onClick={() => setInspectedCategory(null)}
              className="inline-flex min-h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
      {inspectedCategory ? (
        <CapsuleInspectionDepth
          capsuleId={model.capsuleId}
          capsuleVersion={model.capsuleVersion}
          inspectedCategory={inspectedCategory}
          ontology={model.ontology}
          reviewQueue={model.reviewQueue}
          graphModel={model.graph}
          research={model.research}
          workbenchView={workbenchView}
        />
      ) : null}
      {inspectedCategory && workbenchView === 'agent' ? (
        <div data-testid="capsule-workbench-agent-context">
          <CapsuleAgentView capsuleId={model.capsuleId} />
        </div>
      ) : null}
      {inspectedCategory && workbenchView === 'graph' ? (
        <div data-testid="capsule-workbench-human-graph">
          {graphSection}
        </div>
      ) : null}
      <CapsuleAdvancedDrawer
        key={inspectedCategory ?? 'default'}
        model={model}
        compact={compact}
        sparse={sparse}
        graphSection={graphSection}
        agentRuns={agentRuns}
        inspectionCategory={inspectedCategory}
      />
    </section>
  );
}

function CapsuleWorkbenchViewToggle({
  value,
  onChange,
}: {
  value: 'graph' | 'agent';
  onChange: (value: 'graph' | 'agent') => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2" data-testid="capsule-workbench-agent-toggle">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Proof surface</p>
      <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Capsule proof surface">
        {([
          ['graph', 'Graph (human)'],
          ['agent', 'Agent context'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={value === id}
            onClick={() => onChange(id)}
            className={cn(
              'rounded px-2.5 py-1.5 text-xs font-semibold',
              value === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

type CapsuleCategoryCard = {
  id: CapsuleCategoryId;
  stateLine: string;
  detail: string;
  ready: boolean;
};

function CapsuleCategoryOverview({
  categories,
  inspectedCategory,
  onInspect,
}: {
  categories: CapsuleCategoryCard[];
  inspectedCategory: CapsuleCategoryId | null;
  onInspect: (category: CapsuleCategoryCard) => void;
}) {
  return (
    <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Capsule categories">
      {categories.map((category) => {
        const palette = getCapsuleCategoryPalette(category.id);
        const Icon = CATEGORY_ICONS[palette.icon];
        const active = inspectedCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            data-testid={`capsule-category-chip-${category.id}`}
            onClick={() => onInspect(category)}
            title={`${palette.label}: ${category.detail} Click to inspect the full capsule depth for this category.`}
            className={cn(
              'flex min-h-20 min-w-0 items-center gap-3 rounded-md border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-offset-1',
              active ? 'ring-2 ring-offset-1' : 'hover:bg-slate-50',
            )}
            style={{
              backgroundColor: palette.bg,
              borderColor: active ? palette.accent : palette.border,
              color: palette.text,
              ['--tw-ring-color' as string]: palette.accent,
            } as CSSProperties}
          >
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: palette.soft, color: palette.accent }}
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em]">
                {palette.label}
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.ready ? palette.accent : '#94A3B8' }} aria-hidden />
              </span>
              <span className="mt-1 block truncate text-sm font-semibold text-slate-950">{category.stateLine}</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

function CapsuleInspectionDepth({
  capsuleId,
  capsuleVersion,
  graphModel,
  inspectedCategory,
  ontology,
  reviewQueue,
  research,
  workbenchView,
}: {
  capsuleId: string;
  capsuleVersion: number;
  graphModel: CapsuleWorkbenchViewModel['graph'];
  inspectedCategory: CapsuleCategoryId;
  ontology: CapsuleWorkbenchViewModel['ontology'];
  reviewQueue: CapsuleWorkbenchViewModel['reviewQueue'];
  research: CapsuleWorkbenchViewModel['research'];
  workbenchView: 'graph' | 'agent';
}) {
  const palette = getCapsuleCategoryPalette(inspectedCategory);
  const Icon = CATEGORY_ICONS[palette.icon];

  return (
    <section
      className="grid gap-3 rounded-md border p-3"
      data-testid="capsule-inspection-depth"
      style={{ backgroundColor: '#FFFFFF', borderColor: palette.border }}
      aria-label={`${palette.label} capsule inspection`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: palette.soft, color: palette.accent }} aria-hidden>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: palette.text }}>{palette.label}</p>
            <p className="truncate text-sm font-semibold text-slate-950">Full depth is open below.</p>
          </div>
        </div>
        <span title="Ontology, graph, agent packet, reasoning paths, receipts, and review state stay hidden until inspection." className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Info className="h-3.5 w-3.5" />
          On inspect
        </span>
      </div>
      <CapsuleOntologyWorkbench
        capsuleId={capsuleId}
        capsuleVersion={capsuleVersion}
        ontology={ontology}
        graph={graphModel}
        reviewQueue={reviewQueue}
      />
      <CapsuleResearchSection research={research} />
      <div className="sr-only">{workbenchView === 'agent' ? 'Agent context selected' : 'Graph human view selected'}</div>
    </section>
  );
}

function buildCapsuleCategoryCards(model: CapsuleWorkbenchViewModel): CapsuleCategoryCard[] {
  const pillars = new Map(model.pillars.map((pillar) => [normalizePillarCategory(pillar.id), pillar]));
  return CAPSULE_CATEGORY_IDS.map((id) => {
    const pillar = pillars.get(id);
    const primaryFact = pillar?.facts[0] ?? null;
    const ready = pillar?.facts.some((fact) => fact.reviewState === 'canonical') ?? false;
    return {
      id,
      stateLine: primaryFact ? `${primaryFact.label}: ${primaryFact.value}` : 'Open',
      detail: pillar?.description ?? `${getCapsuleCategoryPalette(id).label} capsule context.`,
      ready,
    };
  });
}

function normalizePillarCategory(id: CapsuleWorkbenchPillarId): CapsuleCategoryId {
  if (id === 'users') return 'user';
  if (id === 'tools') return 'tools';
  return id;
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
