'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  Library,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';

import { V7CoreDrawer, type V7CoreDrawerKind, type V7CoreDrawerSituation } from '@/components/v7/v7-core-drawer';
import { AGENTIC_WORKFLOWS } from '@/lib/agentic-workflows/registry';
import { useSituationStore } from '@/stores/situation-store';
import { V7AnalystSkillsPanel } from './v7-analyst-skills-panel';
import { V7SourceDocumentCorePanel } from './v7-source-document-core-panel';

export type V7CoresEntryPoint = 'library' | 'situation' | 'sources' | 'advanced';

interface V7CoresSurfaceProps {
  entryPoint?: V7CoresEntryPoint;
}

type MaterializedCore = {
  id: string;
  kind: string;
  name: string;
  status: string;
  tags?: string[];
  updatedAt?: string;
  ontologyId?: string | null;
};

const entryCopy: Record<V7CoresEntryPoint, { label: string; title: string; detail: string }> = {
  library: {
    label: 'Cores Library',
    title: 'All the context PRAXIS can use.',
    detail: 'Review the active Situation, sources, documents, graph, outputs, and specialist panels without exposing the old workbench sprawl.',
  },
  situation: {
    label: 'Situation Core',
    title: 'The policy model for this Situation.',
    detail: 'Stakeholders, stakes, episodes, hypotheses, tried-and-failed, open threads, and counsel are treated as structured context.',
  },
  sources: {
    label: 'Sources and Documents',
    title: 'The evidence feeding the model.',
    detail: 'Receipts, uploads, extraction status, coverage gaps, and citation posture live here before Ask PRAXIS uses them.',
  },
  advanced: {
    label: 'Specialist Panels',
    title: 'Power tools without first-run clutter.',
    detail: 'Graph, ontology, ACH, Boardroom, Analyst Skills, settings, and diagnostics remain reachable as focused panels.',
  },
};

const chapterSpine = [
  'Stakeholders',
  'Stakes',
  'Episodes',
  'Hypotheses',
  'Tried & Failed',
  'Open Threads',
  'Counsel',
];

const specialistPanels = [
  { label: 'Graph', href: '/app/workbench/[caseId]?tab=graph', icon: GitBranch },
  { label: 'Ontology', href: '/app/workbench/[caseId]?tab=ontology', icon: BrainCircuit },
  { label: 'Analyst Skills', href: '/app/tools', icon: Sparkles },
  { label: 'ACH', href: '/app/workbench/[caseId]/ach', icon: ShieldCheck },
  { label: 'Boardroom', href: '/app/workbench/[caseId]/boardroom', icon: Users },
  { label: 'Settings', href: '/app/settings/preferences', icon: Settings },
];

export function V7CoresSurface({ entryPoint = 'library' }: V7CoresSurfaceProps) {
  const [materializedCores, setMaterializedCores] = useState<MaterializedCore[]>([]);
  const [coreApiState, setCoreApiState] = useState<'loading' | 'ready' | 'fallback' | 'error'>('loading');
  const [openCore, setOpenCore] = useState<V7CoreDrawerKind | null>(null);
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const active = activeSituation ?? situations[0] ?? null;
  const activeCaseId = active?.id;
  const activeCaseName = active?.name ?? 'No active Situation';
  const activeRegion = active?.region ?? 'Create or open a Situation to attach a Situation Core.';
  const sourceCount = active?.sourceUrls?.length ?? active?.customSources?.length ?? 0;
  const documentCount = active?.documentCount ?? 0;
  const graphCount = active?.graphEntities ?? active?.actorCount ?? active?.actors?.length ?? 0;
  const coreWorkflows = AGENTIC_WORKFLOWS.filter((workflow) => workflow.primaryArea === 'cores');
  const copy = entryCopy[entryPoint];
  const drawerSituation: V7CoreDrawerSituation | null = active
    ? {
        id: active.id,
        name: active.name,
        region: active.region,
        sourceCount,
        documentCount,
        graphCount,
        actorCount: active.actorCount ?? active.actors?.length ?? 0,
      }
    : null;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/backend/cores')
      .then(async (response) => {
        const body = await response.json() as { cores?: MaterializedCore[]; status?: string };
        if (cancelled) return;
        setMaterializedCores(body.cores ?? []);
        setCoreApiState(body.status === 'backend_unconfigured' ? 'fallback' : 'ready');
      })
      .catch(() => {
        if (!cancelled) setCoreApiState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const coreStats = [
    { label: 'Sources', value: sourceCount, detail: sourceCount > 0 ? 'linked receipts' : 'thin evidence base' },
    { label: 'Documents', value: documentCount, detail: documentCount > 0 ? 'uploaded files' : 'ready for upload' },
    { label: 'Graph signals', value: graphCount, detail: graphCount > 0 ? 'actors and claims' : 'needs extraction' },
  ];

  return (
    <div className="space-y-5" data-testid="v7-cores-surface" data-entry-point={entryPoint}>
      <section className="overflow-hidden rounded-lg border border-navy-200 bg-white shadow-sm shadow-navy-950/5">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.42fr)]">
          <div className="p-5 sm:p-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold uppercase text-gold-800">
              <Boxes className="h-3.5 w-3.5" />
              {copy.label}
            </p>
            <h1 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-navy-950 sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">{copy.detail}</p>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-700">Active Situation Core</p>
                  <p className="mt-1 text-lg font-semibold text-navy-950">{activeCaseName}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-700">{activeRegion}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <LinkButton href="/app/ask" icon={Sparkles} label="Ask about this" primary />
                  <LinkButton href={activeCaseId ? `/app/workbench/${activeCaseId}` : '/app/workbench'} icon={ArrowRight} label="Open live workbench" />
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {coreStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-semibold text-navy-950">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold text-navy-900">{stat.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-700">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-navy-200 bg-navy-950 p-5 text-white xl:border-l xl:border-t-0 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold-300" />
              <h2 className="text-lg font-semibold">Seven-chapter spine</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-navy-200">
              PRAXIS keeps the same chapter grammar across every Situation so the next analyst and the model can inherit the desk quickly.
            </p>
            <div className="mt-5 grid gap-2">
              {chapterSpine.map((chapter) => (
                <div key={chapter} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-gold-300" />
                  <span className="text-sm font-semibold text-white">{chapter}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)]">
        <div className="space-y-4">
          <Panel title="My Core and Case Core" eyebrow="Simple context model" icon={Database}>
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-950">Materialized cores</p>
                  <p className="mt-1 text-xs leading-5 text-slate-700">
                    The backend can still resolve the full eight-type schema, but the user-facing v7 model exposes only My Core and Case Cores.
                  </p>
                </div>
                <span className={coreApiStateClass(coreApiState)}>{coreApiStateLabel(coreApiState)}</span>
              </div>
              {materializedCores.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {materializedCores.slice(0, 6).map((core) => (
                    <div key={core.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-navy-950">{core.name}</p>
                      <p className="mt-1 text-xs uppercase text-slate-700">
                        {core.kind} · {core.status}{core.ontologyId ? ` · ${core.ontologyId}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-700">
                  No materialized Core records are returned yet. PRAXIS still shows the v7 Core map below so users understand what context will be created and attached.
                </p>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <CoreOpenCard
                title="My Core"
                eyebrow="Always attached"
                body="Your role, communication style, model preferences, and default Case Cores. This replaces the old profile/settings mental model."
                icon={UserRound}
                testId="v7-core-chip-user"
                onClick={() => setOpenCore('user')}
              />
              <CoreOpenCard
                title={activeCaseName}
                eyebrow="Active Case Core"
                body="The active Situation, including frame, actors, timeline, sources, documents, graph, and outputs as internal tabs."
                icon={Boxes}
                testId="v7-core-chip-situation"
                onClick={() => setOpenCore('situation')}
              />
            </div>
          </Panel>

          <V7SourceDocumentCorePanel active={active} />

          <V7AnalystSkillsPanel />

          <Panel title="Sources, documents, graph" eyebrow="What gets grounded" icon={Library}>
            <div className="grid gap-3 md:grid-cols-3">
              <ActionCard
                title="Source receipts"
                body="Review linked URLs, source posture, and coverage gaps before Ask PRAXIS relies on them."
                href={activeCaseId ? `/app/workbench/${activeCaseId}?tab=library` : '/app/workbench'}
                icon={Library}
              />
              <ActionCard
                title="Document extraction"
                body="Upload, extract, and turn documents into citation-ready context without exposing implementation jargon."
                href={activeCaseId ? `/app/workbench/${activeCaseId}?tab=library` : '/app/workbench'}
                icon={FileText}
              />
              <ActionCard
                title="Graph and ontology"
                body="Inspect actors, claims, events, relationships, and ontology posture behind the Situation Core."
                href={activeCaseId ? `/app/workbench/${activeCaseId}?tab=graph` : '/app/workbench'}
                icon={GitBranch}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Ask-ready repairs" eyebrow="Next best context work" icon={Search}>
            <div className="space-y-3">
              {coreWorkflows.map((workflow) => (
                <button
                  key={workflow.id}
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-praxis-chat'))}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-navy-300 hover:bg-white"
                >
                  <span className="block text-sm font-semibold text-navy-950">{workflow.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-700">{workflow.intent}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Specialist panels" eyebrow="Power, folded away" icon={Settings}>
            <div className="grid gap-2">
              {specialistPanels.map((panel) => (
                <QuickPanelLink key={panel.label} {...panel} caseId={activeCaseId} />
              ))}
            </div>
          </Panel>
        </div>
      </section>
      <V7CoreDrawer
        open={openCore !== null}
        kind={openCore ?? 'user'}
        situation={drawerSituation}
        onClose={() => setOpenCore(null)}
      />
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  icon: Icon,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold-50 text-gold-700 ring-1 ring-gold-200">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-gold-700">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-950">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function CoreOpenCard({
  title,
  eyebrow,
  body,
  icon: Icon,
  testId,
  onClick,
}: {
  title: string;
  eyebrow: string;
  body: string;
  icon: ComponentType<{ className?: string }>;
  testId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-navy-300 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy-950">{title}</p>
          <p className="mt-1 text-xs font-semibold uppercase text-slate-700">{eyebrow}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-gold-700 ring-1 ring-slate-200">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-700">{body}</p>
    </button>
  );
}

function ActionCard({
  title,
  body,
  href,
  icon: Icon,
}: {
  title: string;
  body: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-navy-300 hover:bg-white">
      <Icon className="h-5 w-5 text-gold-700" />
      <p className="mt-3 text-sm font-semibold text-navy-950">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-700">{body}</p>
    </Link>
  );
}

function QuickPanelLink({
  label,
  href,
  icon: Icon,
  caseId,
}: {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  caseId?: string;
}) {
  const resolvedHref = href.replaceAll('[caseId]', caseId ?? 'syria-2026');

  return (
    <Link
      href={resolvedHref}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-navy-950 transition hover:border-navy-300 hover:bg-white"
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold-700" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-slate-500" />
    </Link>
  );
}

function LinkButton({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
        primary
          ? 'bg-navy-950 text-white hover:bg-navy-800'
          : 'border border-slate-200 bg-white text-navy-800 hover:border-navy-300 hover:bg-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function coreApiStateLabel(state: 'loading' | 'ready' | 'fallback' | 'error'): string {
  if (state === 'loading') return 'Checking';
  if (state === 'ready') return 'Live API';
  if (state === 'fallback') return 'Preview';
  return 'Needs backend';
}

function coreApiStateClass(state: 'loading' | 'ready' | 'fallback' | 'error'): string {
  if (state === 'ready') {
    return 'rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-800';
  }
  if (state === 'error') {
    return 'rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase text-red-800';
  }
  return 'rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase text-amber-900';
}
