'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  GripVertical,
  Library,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  UserCircle,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CoreRepositorySpineProps {
  activeCaseId: string;
  activeCaseName: string;
  marketplaceToolCount: number;
}

interface RustSemanticaHealth {
  status: 'ok' | 'degraded' | 'error';
  validation?: {
    engine?: string;
    result?: {
      nodeCount: number;
      edgeCount: number;
      semanticaReady: boolean;
      orphanEdgeCount: number;
    };
  };
}

const repositoryStages = [
  {
    id: 'user-core',
    label: 'User Core',
    href: '/app/cores/user',
    icon: UserCircle,
    accent: 'bg-diplomatic-blue/10 text-diplomatic-blue border-diplomatic-blue/25',
    prompt: 'Use my User Core. Show the assumptions about my role, audience, writing style, and analytic red lines before you answer.',
  },
  {
    id: 'context-core',
    label: 'Situation Core',
    href: '/app/cores/context',
    icon: Target,
    accent: 'bg-gold-50 text-gold-800 border-gold-200',
    prompt: 'Inspect this Situation Core first. Include graph, sources, actors, claims, and which facts need source support.',
  },
  {
    id: 'tools',
    label: 'Suggested Tools',
    href: '/app/tools',
    icon: Wrench,
    accent: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    prompt: 'Suggest the best PRAXIS tools for this situation, explain the order, and avoid running anything until I confirm.',
  },
  {
    id: 'memo',
    label: 'Memo Drafting',
    href: '',
    icon: FileText,
    accent: 'bg-rose-50 text-rose-800 border-rose-200',
    prompt: 'Draft a policy memo plan from the current cores: thesis, evidence, options, risks, and next research gaps.',
  },
] as const;

type RepositoryStage = typeof repositoryStages[number];

const toolSuggestions = [
  {
    id: 'context-builder',
    label: 'Context Builder',
    hrefTab: 'context',
    detail: 'Repair the Situation Core: frame, actors, gaps, and ontology before deeper analysis.',
    needs: ['user-core', 'context-core'],
  },
  {
    id: 'source-scout',
    label: 'Source Scout',
    hrefTab: 'library',
    detail: 'Find the missing receipts and unresolved evidence for the active Situation Core.',
    needs: ['context-core'],
  },
  {
    id: 'memo-drafter',
    label: 'Memo Drafter',
    hrefTab: 'memos',
    detail: 'Turn selected cores into a reviewable memo outline with citations and gaps visible.',
    needs: ['user-core', 'context-core', 'memo'],
  },
] as const;

export function CoreRepositorySpine({ activeCaseId, activeCaseName, marketplaceToolCount }: CoreRepositorySpineProps) {
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>(['user-core', 'context-core', 'tools', 'memo']);
  const [stageOrder, setStageOrder] = useState<string[]>(repositoryStages.map((stage) => stage.id));
  const [draggingStageId, setDraggingStageId] = useState<string | null>(null);
  const [rustHealth, setRustHealth] = useState<RustSemanticaHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health/semantica-core', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: RustSemanticaHealth) => {
        if (!cancelled) setRustHealth(payload);
      })
      .catch(() => {
        if (!cancelled) setRustHealth({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stages = useMemo(
    () => {
      const stageById = new Map<string, RepositoryStage>(repositoryStages.map((stage) => [stage.id, stage]));
      return stageOrder.flatMap((stageId) => {
        const stage = stageById.get(stageId);
        if (!stage) return [];
        return [
          {
            ...stage,
            href: stage.href || `/app/workbench/${activeCaseId}${stage.id === 'memo' ? '?openChapter=memos' : '?tab=graph'}`,
            selected: selectedStageIds.includes(stage.id),
          },
        ];
      });
    },
    [activeCaseId, selectedStageIds, stageOrder],
  );

  const selectedStages = stages.filter((stage) => stage.selected);
  const rustReady = rustHealth?.status === 'ok' && rustHealth.validation?.result?.semanticaReady === true;
  const recommendedTools = toolSuggestions
    .map((tool) => ({
      ...tool,
      score: tool.needs.filter((stageId) => selectedStageIds.includes(stageId)).length,
    }))
    .filter((tool) => tool.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  function toggleStage(stageId: string) {
    setSelectedStageIds((current) => {
      if (current.includes(stageId)) return current.filter((id) => id !== stageId);
      return [...current, stageId];
    });
  }

  function dropStage(targetStageId: string) {
    if (!draggingStageId || draggingStageId === targetStageId) return;
    setStageOrder((current) => {
      const withoutDragged = current.filter((id) => id !== draggingStageId);
      const targetIndex = withoutDragged.indexOf(targetStageId);
      if (targetIndex < 0) return current;
      const next = [...withoutDragged];
      next.splice(targetIndex, 0, draggingStageId);
      return next;
    });
    setDraggingStageId(null);
  }

  function askWithSelectedCores() {
    const prompt = [
      `For ${activeCaseName}, use this Repository stack before answering: ${selectedStages.map((stage) => stage.label).join(' -> ')}.`,
      ...selectedStages.map((stage) => stage.prompt),
      `Prioritize these suggested tools if relevant: ${recommendedTools.map((tool) => tool.label).join(', ') || 'Context Builder, Source Scout, Memo Drafter'}.`,
      'Return a concise analysis plan, the tools you recommend, the missing evidence, and the first memo outline.',
    ].join('\n');
    window.dispatchEvent(new CustomEvent('open-praxis-chat', { detail: { prompt } }));
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-navy-950/10 backdrop-blur" data-testid="core-repository-spine">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Repository Spine</p>
              <h2 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
                Attach two cores. PRAXIS suggests the tools and memo path.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                Keep the daily workflow focused: User Core, Situation Core, suggested tools, memo drafting. Drag only when the priority changes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/app/cores/user" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-diplomatic-blue/30 bg-white px-4 py-2 text-sm font-semibold text-diplomatic-blue hover:bg-diplomatic-blue/5">
                <UserCircle className="h-4 w-4" />
                Build User Core
              </Link>
              <Link href="/app/cores/context" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-gold-300 bg-white px-4 py-2 text-sm font-semibold text-gold-800 hover:bg-gold-50">
                <Target className="h-4 w-4" />
                Build Situation Core
              </Link>
              <button
                type="button"
                onClick={askWithSelectedCores}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-navy-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-navy-950/15 hover:bg-navy-800"
              >
                <MessageSquareText className="h-4 w-4" />
                Ask with stack
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-4" aria-label="Selectable PRAXIS repository line">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <div key={stage.id} className="relative">
                  {index > 0 ? <div className="absolute -left-3 top-10 hidden h-px w-6 bg-slate-300 lg:block" aria-hidden="true" /> : null}
                  <button
                    type="button"
                    onClick={() => toggleStage(stage.id)}
                    draggable
                    onDragStart={() => setDraggingStageId(stage.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropStage(stage.id)}
                    onDragEnd={() => setDraggingStageId(null)}
                    className={cn(
                      'group flex min-h-[156px] w-full cursor-grab flex-col justify-between rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-navy-950/10 active:cursor-grabbing',
                      stage.accent,
                      stage.selected ? 'ring-2 ring-navy-950/15' : 'opacity-72 grayscale-[0.25]',
                      draggingStageId === stage.id && 'scale-[0.98] opacity-60',
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/75 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                      <GripVertical className="h-4 w-4 text-slate-500" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{stage.label}</span>
                      <span className="mt-2 block text-xs leading-5 text-slate-700">
                        {stage.selected ? 'Attached to Ask PRAXIS' : 'Click to attach'}
                      </span>
                    </span>
                  </button>
                  <Link
                    href={stage.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-diplomatic-blue hover:text-navy-950"
                  >
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Suggested by attached cores</p>
                <h3 className="mt-1 text-base font-semibold text-navy-950">Run fewer tools, in the right order.</h3>
              </div>
              <BrainCircuit className="h-5 w-5 text-diplomatic-blue" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {recommendedTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/app/workbench/${activeCaseId}${tool.hrefTab === 'memos' ? '?openChapter=memos' : `?tab=${tool.hrefTab}`}`}
                  className="group rounded-lg border border-white bg-white p-3 shadow-sm shadow-navy-950/5 transition hover:border-diplomatic-blue/30 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-diplomatic-blue">Recommended</span>
                  <span className="mt-1 block text-sm font-semibold text-navy-950">{tool.label}</span>
                  <span className="mt-2 block text-xs leading-5 text-slate-700">{tool.detail}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-navy-800">
                    Open tool <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <aside className="border-t border-navy-100 bg-navy-950 p-5 text-white xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold-300">Live substrate</p>
              <h3 className="mt-1 text-lg font-semibold">Semantica + tools</h3>
            </div>
            <Bot className="h-5 w-5 text-gold-300" />
          </div>

          <div className="mt-5 space-y-3">
            <StatusRow
              icon={rustReady ? CheckCircle2 : ShieldCheck}
              label="Rust semantic core"
              value={rustReady ? 'Live' : rustHealth ? 'Needs attention' : 'Checking'}
              tone={rustReady ? 'ready' : 'pending'}
            />
            <StatusRow icon={Database} label="Graph seed" value={rustHealth?.validation?.result ? `${rustHealth.validation.result.nodeCount} nodes` : 'Inspectable'} tone="ready" />
            <StatusRow icon={Library} label="Source posture" value="Review-gated" tone="ready" />
            <StatusRow icon={Wrench} label="Tools" value={`${marketplaceToolCount} mapped`} tone="ready" />
            <StatusRow icon={Sparkles} label="Memo path" value="Draftable" tone="ready" />
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/8 p-4">
            <p className="text-xs font-semibold uppercase text-navy-200">Prompt stack</p>
            <ol className="mt-3 space-y-2">
              {selectedStages.map((stage, index) => (
                <li key={stage.id} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-300 text-[11px] font-bold text-navy-950">{index + 1}</span>
                  <span>{stage.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  tone: 'ready' | 'pending';
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/8 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <Icon className={cn('h-4 w-4 shrink-0', tone === 'ready' ? 'text-gold-300' : 'text-amber-300')} />
        <span className="truncate text-sm text-navy-100">{label}</span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-white">{value}</span>
    </div>
  );
}
