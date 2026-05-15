'use client';

import Link from 'next/link';
import { ArrowRight, Clock3, FileText, GripVertical, Library, Network, Scale, ShieldCheck, Sparkles, Target, UserCircle, Wrench } from 'lucide-react';
import { getNextMoves } from '@/lib/assistant/next-moves';
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

const attachedCores = [
  { label: 'User', href: '/app/cores/user', icon: UserCircle, detail: 'role, audience, style' },
  { label: 'Situation', href: '/app/cores/context', icon: Target, detail: 'frame, domain, actors' },
  { label: 'Sources', href: '/app/workbench?tab=library', icon: Library, detail: 'receipts, uploads, gaps' },
  { label: 'Temporality', href: '/app/workbench', icon: Clock3, detail: 'episodes, freshness' },
  { label: 'Power', href: '/app/canvas', icon: Network, detail: 'approvers, blockers' },
  { label: 'Rules / Specs', href: '/app/workbench?tab=context', icon: Scale, detail: 'standards, gates' },
  { label: 'Tools', href: '/app/tools', icon: Wrench, detail: 'capsule capabilities' },
  { label: 'Output', href: '/app/write', icon: FileText, detail: 'memo, brief, handover' },
];

export function AskPraxisHome({ exampleCases, marketplaceToolCount }: AskPraxisHomeProps) {
  const userCases = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const activeCase = activeSituation ?? userCases[0] ?? exampleCases[0];
  const activeCaseName = activeCase?.name ?? 'No Situation selected';
  const coverage = buildContextCoverage(activeCase, marketplaceToolCount);
  const nextMoves = getNextMoves({
    situation: activeSituation,
    situationStage: activeSituation?.analysisPhase ?? activeSituation?.workflowPath ?? 'intake',
  });

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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Your ContextCapsules</p>
              <h1 className="mt-2 text-3xl font-semibold text-navy-950 sm:text-4xl">
                Ask, research, check, draft, and hand over from the active ContextCapsule.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                {activeCaseName} is the current Situation. PRAXIS reads the capsule anatomy, then recommends the safest tools and next moves for serious policy work without forcing you into a raw marketplace.
              </p>
            </div>
            <Link
              href="/app/write"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-800 hover:border-navy-300 hover:bg-slate-50"
            >
              Write with PRAXIS
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
                    <span className="hidden text-slate-500 lg:inline">{core.detail}</span>
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
                <span className="block text-base font-semibold">Ask the active ContextCapsule.</span>
                <span className="mt-1 block text-xs leading-5 text-navy-200">
                  It checks context, sourceability, temporality, power dynamics, and output posture before proposing work.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-navy-300" />
            </button>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {nextMoves.map((move) => (
                <Link
                  key={move.id}
                  href={move.href}
                  className="rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-xs shadow-sm shadow-navy-950/5 hover:border-navy-200 hover:bg-white"
                >
                  <span className="font-semibold text-navy-900">{move.label}</span>
                  <span className="mt-1 block leading-5 text-slate-600">{move.detail}</span>
                </Link>
              ))}
            </div>
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
                <span className={cn('text-sm font-semibold', item.tone === 'gap' ? 'text-amber-800' : 'text-navy-950')}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-700">
            What PRAXIS can safely do next: {coverage.safeNext}. Tool runs, graph proposals, and saved outputs stay confirmation-gated.
          </p>
        </aside>
      </div>
    </section>
  );
}

function buildContextCoverage(activeCase: Situation | DashboardExampleCase | undefined, marketplaceToolCount: number) {
  const sourceCount = activeCase && 'sourceUrls' in activeCase ? activeCase.sourceUrls?.length ?? 0 : 0;
  const documentCount = activeCase && 'documentCount' in activeCase ? activeCase.documentCount : 0;
  const actorCount = activeCase && 'actors' in activeCase ? activeCase.actors.length : activeCase?.tags.length ?? 0;
  const graphEntities = activeCase && 'graphEntities' in activeCase ? activeCase.graphEntities : Math.max(6, actorCount + 4);
  const hasEpisode = Boolean(activeCase && 'latestEventDate' in activeCase && activeCase.latestEventDate);
  const evidenceCount = sourceCount + documentCount;
  const contextReady = Boolean(activeCase?.id) && actorCount >= 2;
  const sourceReady = evidenceCount > 0;
  const graphReady = graphEntities > 8 ? 'Ready' : graphEntities > 4 ? 'Partial' : 'Thin';
  const temporalReady = hasEpisode ? 'Ready' : 'Needs date';
  const safeNext = !contextReady
    ? 'assemble the Situation Core'
    : !sourceReady
      ? 'repair source coverage'
      : !hasEpisode
        ? 'set temporal posture'
        : graphReady === 'Thin'
          ? 'review graph and actor coverage'
          : 'answer, stress-test, or draft with receipts in view';

  return {
    posture: sourceReady && graphEntities > 8 && hasEpisode ? 'Ready for guided work' : 'Usable, with visible gaps',
    items: [
      { label: 'Context health', value: contextReady ? 'Attached' : 'Thin', tone: contextReady ? 'ready' : 'gap' },
      { label: 'Temporal readiness', value: temporalReady, tone: hasEpisode ? 'ready' : 'gap' },
      { label: 'Source coverage', value: sourceReady ? `${evidenceCount} receipt${evidenceCount === 1 ? '' : 's'}` : 'Missing', tone: sourceReady ? 'ready' : 'gap' },
      { label: 'Graph/actor readiness', value: graphReady, tone: graphReady === 'Thin' ? 'gap' : 'ready' },
      { label: 'Tool routing', value: marketplaceToolCount > 0 && contextReady ? 'Available' : 'Needs context', tone: marketplaceToolCount > 0 && contextReady ? 'ready' : 'gap' },
    ],
    safeNext,
  };
}

function openPraxisChat(prompt: string) {
  window.dispatchEvent(new CustomEvent('open-praxis-chat', { detail: { prompt } }));
}
