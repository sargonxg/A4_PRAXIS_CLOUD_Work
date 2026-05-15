'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import {
  destinationHref,
  PRAXIS_POLICY_AGENTS,
  type PolicyAgentDefinition,
} from '@/lib/product/policy-agents';

export function ToolMarketplace() {
  const { caseId } = useWorkbenchScope();
  const liveAgents = PRAXIS_POLICY_AGENTS.filter((agent) => agent.readiness === 'live' || agent.readiness === 'queued');
  const plannedAgents = PRAXIS_POLICY_AGENTS.filter((agent) => agent.readiness === 'planned' || agent.readiness === 'gated');

  return (
    <section className="space-y-5" data-testid="tool-marketplace">
      <header className="rounded-lg border border-diplomatic-blue/20 bg-white p-5 shadow-sm shadow-navy-950/5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Policy agents</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy-950">Attach PRAXIS agents to this ContextCapsule.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              The old raw tool wall is now framed as capsule-aware work: memo drafting, source review, monitoring, red-team analysis, and handover. Browser, shell, and external-sending automation stay gated until sandbox and approvals are real.
            </p>
          </div>
          <Link href="/app/assistant" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-900">
            Run from Ask
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {['Memo Studio', 'Canvas', 'Library', 'Handover'].map((destination) => (
            <div key={destination} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-navy-950">{destination}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-600">Every run lands in a concrete PRAXIS output surface.</p>
            </div>
          ))}
        </div>
      </header>

      <section className="rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-diplomatic-blue" />
          <h3 className="text-lg font-semibold text-navy-950">Ready or queued</h3>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {liveAgents.map((agent) => <PolicyAgentCard key={agent.id} agent={agent} caseId={caseId} />)}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-gold-700" />
          <h3 className="text-lg font-semibold text-navy-950">Planned with approvals</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plannedAgents.map((agent) => <PolicyAgentCard key={agent.id} agent={agent} caseId={caseId} />)}
        </div>
      </section>
    </section>
  );
}

function PolicyAgentCard({ agent, caseId }: { agent: PolicyAgentDefinition; caseId: string }) {
  const href = agent.outputDestination === 'memo_studio'
    ? `/app/write?situationId=${encodeURIComponent(caseId)}`
    : destinationHref(agent.outputDestination);

  return (
    <article className="flex min-h-[240px] flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-diplomatic-blue/40 hover:bg-white">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{agent.category}</p>
            <h4 className="mt-1 text-base font-semibold text-navy-950">{agent.label}</h4>
          </div>
          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">{agent.readiness}</span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-700">{agent.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.requiredCores.map((core) => (
            <span key={core} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {core}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-sage" />
          {agent.approvalLevel.replace('_', ' ')}
        </span>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-diplomatic-blue">
          {agent.readiness === 'planned' ? 'Review plan' : 'Open output'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
