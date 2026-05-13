'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Archive, CheckCircle2, Loader2, Paperclip, Sparkles, Target, Wrench } from 'lucide-react';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { TOOL_REGISTRY } from '@/lib/constants/tool-registry';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import { coreLabel, readinessLabel } from '@/lib/tools/contract';
import type { AttachableTool, CoreKind } from '@/lib/tools/contract';
import { attachedCoresFromSituation, recommendTools } from '@/lib/tools/recommend';
import { hrefForTool } from '@/lib/tools/tool-navigation';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import type { Situation, ToolDefinition } from '@/types/situation';

export default function ToolsWorkspacePage() {
  const { needsOnboarding, loading, situation } = useSituationGuard();

  if (needsOnboarding) return <OnboardingRequiredState />;
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return <ToolsWorkspace situation={situation ?? null} />;
}

function ToolsWorkspace({ situation }: { situation: Situation | null }) {
  const searchParams = useSearchParams();
  const showArchive = searchParams.get('show_archive') === '1';
  const attached = useMemo(() => attachedCoresFromSituation(situation), [situation]);
  const suggested = useMemo(
    () => recommendTools({ attached, situationStage: situation?.analysisPhase ?? situation?.workflowPath ?? 'intake', recentToolIds: [] }),
    [attached, situation],
  );
  const archivedTools = TOOL_REGISTRY.filter((tool) => !PRAXIS_CANONICAL_TOOLS.some((canonical) => canonical.route === tool.aiRoute || canonical.id === tool.id));

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6" data-testid="canonical-tools-page">
      <header className="rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Attachable tools</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950">Canonical tools stay visible; specialist machinery stays routed.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              The default surface is twelve canonical capabilities. Ask PRAXIS recommends the next three from the active cores, while specialist tools remain available through Advanced/archive when a task needs them.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <Metric label="Canonical" value="12" />
            <Metric label="Suggested" value="3" />
            <Metric label="Archive" value={String(archivedTools.length)} />
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-diplomatic-blue/20 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-diplomatic-blue" />
              <h2 className="text-lg font-semibold text-navy-950">Suggested for this Situation</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">Scored from inherited cores, stage, readiness posture, and recent workspace state.</p>
          </div>
          <Link href="/app/contexts" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-slate-50">
            Cores
            <Target className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {suggested.map((tool) => <AttachableToolCard key={tool.id} tool={tool} attached={attached} suggested />)}
        </div>
      </section>

      {showArchive ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-slate-500" />
            <h2 className="text-lg font-semibold text-navy-950">Archive tools</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Specialist and legacy routes stay available for compatibility, but Ask PRAXIS should route users to them only when the core stack justifies it.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {archivedTools.map((tool) => <ArchiveToolCard key={tool.id} tool={tool} />)}
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gold-700" />
              <h2 className="text-lg font-semibold text-navy-950">All canonical tools</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PRAXIS_CANONICAL_TOOLS.map((tool) => <AttachableToolCard key={tool.id} tool={tool} attached={attached} />)}
            </div>
          </section>

          <section className="rounded-lg border border-gold-200 bg-gold-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-navy-950">Need a specialist tool?</h2>
                <p className="mt-1 text-sm text-slate-700">Ask PRAXIS should route most work. Open the archive only when a specialist artifact is already justified by the active core stack.</p>
              </div>
              <Link href="/app/tools?show_archive=1" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
                Review archived tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function AttachableToolCard({
  tool,
  attached,
  suggested = false,
}: {
  tool: AttachableTool;
  attached: Record<CoreKind, boolean>;
  suggested?: boolean;
}) {
  const missing = tool.requires.filter((core) => !attached[core]);
  const href = tool.uiTarget === 'writer'
    ? '/app/write'
    : tool.id === 'ask-praxis'
      ? '/app/assistant'
      : '/app/workbench';

  return (
    <article className="flex min-h-[260px] flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-diplomatic-blue/40 hover:bg-white">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{tool.produces.replace('_', ' ')}</p>
            <h3 className="mt-1 text-base font-semibold text-navy-950">{tool.name}</h3>
          </div>
          {suggested ? <span className="rounded-full bg-diplomatic-blue px-2 py-1 text-[10px] font-semibold text-white">Suggested</span> : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{tool.methodology}</p>
        <p className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700">
          <span className="font-semibold text-navy-900">{readinessLabel(tool.readiness)}:</span> {tool.readinessDetail}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tool.requires.map((core) => (
            <span
              key={core}
              className={attached[core] ? 'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700' : 'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800'}
            >
              <Paperclip className="h-3 w-3" />
              {coreLabel(core)}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
          <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
          {missing.length === 0 ? 'Ready to attach' : `${missing.length} core gap${missing.length === 1 ? '' : 's'}`}
        </span>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-diplomatic-blue">
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function ArchiveToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{tool.category}</p>
      <h3 className="mt-1 text-sm font-semibold text-navy-950">{tool.name}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{tool.shortDescription}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Specialist hidden</p>
      <Link href={hrefForTool(tool.id)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-diplomatic-blue">
        Open specialist route
        <ArrowRight className="h-3 w-3" />
      </Link>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-lg font-semibold text-navy-950">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
    </div>
  );
}
