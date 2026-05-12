'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileText, ListChecks, Target, Wrench } from 'lucide-react';
import type { AskIntentPlan } from '@/lib/ai/ask/intent-classifier';

export function StreamingResponse({ plan, contextName }: { plan: AskIntentPlan; contextName: string }) {
  const claims = useMemo(() => buildClaims(plan, contextName), [contextName, plan]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-navy-500">Transparent run</p>
          <h2 className="mt-1 text-base font-semibold text-navy-900">Answer preview</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-navy-700">
          Confidence {plan.confidence}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {claims.map((claim) => (
          <div key={claim.title} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex gap-2">
              {claim.kind === 'gap' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
              <div>
                <p className="text-sm font-semibold text-navy-900">{claim.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-navy-700">{claim.body}</p>
                <p className="mt-2 text-xs font-semibold text-navy-500">{claim.source}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ActionCard href="/app/contexts" icon={Target} title="Inspect cores" body="Review the attached User Core and Situation Core before deeper execution." />
        <ActionCard href="/app/tools" icon={Wrench} title="Call policy tools" body="Run the specific research, graph, stakeholder, scenario, or memo tool this answer needs." />
        <ActionCard href="/app/write" icon={FileText} title="Continue in Write" body="Move the long answer into the PRAXIS editor for revision, citations, and export." />
      </div>
    </section>
  );
}

function buildClaims(plan: AskIntentPlan, contextName: string) {
  if (plan.unavailableReason) {
    return [
      {
        kind: 'gap',
        title: 'Context required',
        body: plan.unavailableReason,
        source: 'System check',
      },
    ];
  }
  return [
    {
      kind: 'claim',
      title: 'Bottom line',
      body: `${contextName} has enough structure for a ${plan.mode} pass, but the answer should stay tied to reviewed sources and visible gaps.`,
      source: 'Context frame and selected user model',
    },
    {
      kind: 'claim',
      title: 'Recommended path',
      body: `Use ${plan.methodIds.length} planned method${plan.methodIds.length === 1 ? '' : 's'} and keep each claim reviewable before it moves into a draft.`,
      source: 'Method plan preview',
    },
  ];
}

function ActionCard({ href, icon: Icon, title, body }: { href: string; icon: typeof ListChecks; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-diplomatic-blue/30 hover:bg-white">
      <Icon className="h-4 w-4 text-navy-700" />
      <p className="mt-2 text-sm font-semibold text-navy-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-navy-600">{body}</p>
    </Link>
  );
}
