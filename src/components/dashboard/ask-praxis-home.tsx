'use client';

import Link from 'next/link';
import { ArrowRight, FileText, GripVertical, Library, MessageSquareText, ShieldCheck, Sparkles, Target, UserCircle, Wrench } from 'lucide-react';
import { AGENTIC_WORKFLOWS, PRIMARY_MOBILE_WORKFLOWS, type AgenticWorkflow } from '@/lib/agentic-workflows/registry';
import { CONSOLIDATED_TOOLS } from '@/lib/constants/consolidated-tools';
import { getWorkflowCountForArea } from '@/lib/product/experience-map';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';

interface DashboardExampleCase {
  id: string;
  name: string;
  region: string;
  summary: string;
  risk: number;
  glaslStage: number;
  tags: string[];
}

interface AskPraxisHomeProps {
  exampleCases: DashboardExampleCase[];
  marketplaceToolCount: number;
}

const workflowIcon = {
  'understand-situation': MessageSquareText,
  'improve-context': Library,
  'generate-handover': FileText,
  'update-brief': FileText,
};

const attachedCores = [
  { label: 'User Core', href: '/app/cores/user', icon: UserCircle, detail: 'role, audience, style' },
  { label: 'Context Core', href: '/app/cores/context', icon: Target, detail: 'frame, sources, graph' },
];

export function AskPraxisHome({ exampleCases, marketplaceToolCount }: AskPraxisHomeProps) {
  const userCases = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const activeCase = activeSituation ?? userCases[0] ?? exampleCases[0];
  const activeCaseId = activeCase?.id ?? 'syria-2026';
  const activeCaseName = activeCase?.name ?? 'No Situation selected';
  const coverage = buildContextCoverage(activeCase, marketplaceToolCount);
  const workflows = AGENTIC_WORKFLOWS.filter((workflow) =>
    ['understand-situation', 'improve-context', 'generate-handover', 'update-brief'].includes(workflow.id),
  );

  return (
    <section
      id="ask-praxis"
      className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-xl shadow-navy-950/10 backdrop-blur"
      data-testid="ask-praxis-home"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Ask PRAXIS</p>
              <h1 className="mt-2 text-3xl font-semibold text-navy-950 sm:text-4xl">
                Ask first. Attach User Core and Context Core. Let tools appear when needed.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                {activeCaseName} is the current working context. Start with a question or choose a workflow; source and trust detail stays visible before anything is saved.
              </p>
            </div>
            <Link
              href={`/app/workbench/${activeCaseId}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-800 hover:border-navy-300 hover:bg-slate-50"
            >
              Open Situation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-navy-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(234,245,247,0.82))] p-3 shadow-2xl shadow-navy-950/10">
            <div className="flex flex-wrap gap-2 px-2 pb-3">
              {attachedCores.map((core) => {
                const Icon = core.icon;
                return (
                  <Link
                    key={core.label}
                    href={core.href}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-navy-800 shadow-sm shadow-navy-950/5 backdrop-blur hover:border-navy-300"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                    <Icon className="h-3.5 w-3.5 text-diplomatic-blue" />
                    {core.label}
                    <span className="hidden text-slate-500 sm:inline">{core.detail}</span>
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => openPraxisChat('What should I know first about this Situation?')}
              className="flex w-full items-center gap-4 rounded-[1.1rem] bg-navy-950 px-5 py-5 text-left text-white shadow-lg shadow-navy-950/20 transition hover:bg-navy-900"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">Ask PRAXIS anything about this policy situation...</span>
                <span className="mt-1 block text-xs leading-5 text-navy-200">
                  It reads the attached cores, suggests tools, and drafts only after context and trust posture are visible.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-navy-300" />
            </button>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {CONSOLIDATED_TOOLS.slice(0, 3).map((tool) => (
                <Link
                  key={tool.id}
                  href={`/app/workbench/${activeCaseId}${tool.id === 'briefing-studio' ? '?openChapter=memos' : tool.id === 'research-sources' ? '?tab=library' : ''}`}
                  className="rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-xs shadow-sm shadow-navy-950/5 hover:border-navy-200 hover:bg-white"
                >
                  <span className="flex items-center gap-2 font-semibold text-navy-900">
                    <Wrench className="h-3.5 w-3.5 text-gold-700" />
                    {tool.shortLabel}
                  </span>
                  <span className="mt-1 block leading-5 text-slate-600">{tool.primaryOutput}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {workflows.map((workflow) => (
              <WorkflowButton key={workflow.id} workflow={workflow} activeCaseId={activeCaseId} />
            ))}
          </div>
        </div>

        <aside className="border-t border-navy-100 bg-slate-50 p-5 lg:border-l lg:border-t-0" aria-label="Context coverage">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold-700">Context coverage</p>
              <h2 className="mt-1 text-base font-semibold text-navy-950">{coverage.posture}</h2>
            </div>
            <ShieldCheck className="h-5 w-5 text-sage" />
          </div>
          <div className="mt-4 space-y-2" data-testid="context-coverage-strip">
            {coverage.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                <span className={cn('text-sm font-semibold', item.value === 'Thin' ? 'text-amber-800' : 'text-navy-950')}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRIMARY_MOBILE_WORKFLOWS.map((workflow) => (
              <button
                key={workflow.id}
                type="button"
                onClick={() => openPraxisChat(workflow.prompt)}
                className="rounded-full border border-navy-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 hover:border-navy-300 hover:bg-navy-50"
              >
                {workflow.shortLabel}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-700">
            {getWorkflowCountForArea('outputs')} output workflows are mapped to save locations; mutating workflows remain confirmation-gated.
          </p>
        </aside>
      </div>
    </section>
  );
}

function WorkflowButton({ workflow, activeCaseId }: { workflow: AgenticWorkflow; activeCaseId: string }) {
  const Icon = workflowIcon[workflow.id as keyof typeof workflowIcon] ?? MessageSquareText;
  const href = workflow.primaryArea === 'sources'
    ? `/app/workbench/${activeCaseId}?tab=library`
    : workflow.primaryArea === 'outputs'
      ? `/app/workbench/${activeCaseId}?openChapter=memos`
      : `/app/workbench/${activeCaseId}`;

  return (
    <div className="group flex min-h-[128px] flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-navy-300 hover:bg-white">
      <span className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-navy-700 ring-1 ring-slate-200 group-hover:text-diplomatic-blue">
          <Icon className="h-4 w-4" />
        </span>
        <Link
          href={href}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-navy-900"
        >
          Open
        </Link>
      </span>
      <button type="button" onClick={() => openPraxisChat(workflow.prompt)} className="mt-4 text-left">
        <span className="block text-sm font-semibold text-navy-950">{workflow.label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-700">{workflow.intent}</span>
      </button>
    </div>
  );
}

function buildContextCoverage(activeCase: Situation | DashboardExampleCase | undefined, marketplaceToolCount: number) {
  const sourceCount = activeCase && 'sourceUrls' in activeCase ? activeCase.sourceUrls?.length ?? 0 : 0;
  const documentCount = activeCase && 'documentCount' in activeCase ? activeCase.documentCount : 0;
  const actorCount = activeCase && 'actors' in activeCase ? activeCase.actors.length : activeCase?.tags.length ?? 0;
  const graphEntities = activeCase && 'graphEntities' in activeCase ? activeCase.graphEntities : Math.max(6, actorCount + 4);
  const hasEpisode = Boolean(activeCase && 'latestEventDate' in activeCase && activeCase.latestEventDate);
  const claimSignal = graphEntities > 8 ? 'Ready' : graphEntities > 4 ? 'Partial' : 'Thin';

  return {
    posture: sourceCount + documentCount + graphEntities > 10 ? 'Ready for guided work' : 'Usable, with visible gaps',
    items: [
      { label: 'Sources', value: String(sourceCount + documentCount) },
      { label: 'Claims', value: claimSignal },
      { label: 'Episodes', value: hasEpisode ? 'Scoped' : 'Thin' },
      { label: 'Open threads', value: actorCount > 3 ? 'Mapped' : 'Thin' },
      { label: 'Trust posture', value: marketplaceToolCount > 0 ? 'Review-gated' : 'Thin' },
    ],
  };
}

function openPraxisChat(prompt: string) {
  window.dispatchEvent(new CustomEvent('open-praxis-chat', { detail: { prompt } }));
}
