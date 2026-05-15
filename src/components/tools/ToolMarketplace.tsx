'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Paperclip, Sparkles, Wrench } from 'lucide-react';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import { coreLabel, type AttachableTool, type CoreKind } from '@/lib/tools/contract';
import { recommendTools } from '@/lib/tools/recommend';

function attachedWorkbenchCores(): Record<CoreKind, boolean> {
  return {
    user: true,
    situation: true,
    time: true,
    office: true,
    source: true,
    output: true,
  };
}

export function ToolMarketplace() {
  const { caseId, caseModule } = useWorkbenchScope();
  const attached = attachedWorkbenchCores();
  const suggested = recommendTools({
    attached,
    situationStage: caseModule.manifest.domain,
    recentToolIds: [],
  });

  return (
    <section className="space-y-5" data-testid="tool-marketplace">
      <header className="rounded-lg border border-diplomatic-blue/20 bg-white p-5 shadow-sm shadow-navy-950/5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Attachable tools</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy-950">The right tools for this Situation Core.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              The workbench now exposes the canonical twelve. Specialist tools stay behind archive routes and direct deep links.
            </p>
          </div>
          <Link href="/app/tools?show_archive=1" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-50">
            Specialist archive
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-diplomatic-blue" />
          <h3 className="text-lg font-semibold text-navy-950">Suggested now</h3>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {suggested.map((tool) => <AttachableToolCard key={tool.id} caseId={caseId} tool={tool} attached={attached} suggested />)}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-gold-700" />
          <h3 className="text-lg font-semibold text-navy-950">Canonical tool library</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PRAXIS_CANONICAL_TOOLS.map((tool) => <AttachableToolCard key={tool.id} caseId={caseId} tool={tool} attached={attached} />)}
        </div>
      </section>
    </section>
  );
}

function AttachableToolCard({
  caseId,
  tool,
  attached,
  suggested = false,
}: {
  caseId: string;
  tool: AttachableTool;
  attached: Record<CoreKind, boolean>;
  suggested?: boolean;
}) {
  const missing = tool.requires.filter((core) => !attached[core]);
  const href = tool.uiTarget === 'writer'
    ? `/app/write?situationId=${encodeURIComponent(caseId)}`
    : tool.id === 'ask-praxis'
      ? '/app/assistant'
      : `/app/workbench/${encodeURIComponent(caseId)}`;

  return (
    <article className="flex min-h-[240px] flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-diplomatic-blue/40 hover:bg-white">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{tool.produces.replace('_', ' ')}</p>
            <h4 className="mt-1 text-base font-semibold text-navy-950">{tool.name}</h4>
          </div>
          {suggested ? <span className="rounded-full bg-diplomatic-blue px-2 py-1 text-[10px] font-semibold text-white">Suggested</span> : null}
        </div>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-700">{tool.methodology}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tool.requires.map((core) => (
            <span key={core} className={attached[core] ? 'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700' : 'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800'}>
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
