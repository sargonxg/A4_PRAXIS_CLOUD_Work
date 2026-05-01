'use client';

import { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  GitBranch,
  Loader2,
  Search,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import {
  buildContextBuilderPlan,
  type ContextBuilderPriority,
  type ContextBuilderStatus,
} from '@/lib/context/context-builder-plan';
import { cn } from '@/lib/utils/cn';

export default function ContextBuilderPage() {
  const { needsOnboarding, showGuard, situation, loading } = useSituationGuard();
  const plan = useMemo(() => (situation ? buildContextBuilderPlan(situation) : null), [situation]);

  if (needsOnboarding) return <OnboardingRequiredState />;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (showGuard || !situation || !plan) return <NoSituationState />;

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Context Builder</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-950">{situation.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-navy-600">{plan.workflowObjective}</p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2">
            <Metric label="Context" value={`${plan.completionScore}%`} tone={scoreTone(plan.completionScore)} />
            <Metric label="Health" value={`${plan.contextHealth.score}%`} tone={stateTone(plan.contextHealth.state)} />
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Mission path</p>
                <h2 className="mt-1 text-base font-semibold text-navy-900">{plan.workflowLabel}</h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-navy-600">{plan.paidOutput}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Ready checks</p>
                <p className="text-lg font-semibold text-navy-900">
                  {plan.readyCount}/{plan.checklist.length}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {plan.checklist.map((item) => (
                <PraxisLink
                  key={item.id}
                  href={item.actionHref}
                  className={cn(
                    'group rounded-md border px-3 py-3 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5',
                    statusClass(item.status),
                  )}
                >
                  <div className="flex items-start gap-2">
                    <StatusIcon status={item.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-navy-900">{item.label}</p>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-navy-400 group-hover:text-diplomatic-blue" />
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-navy-500">{item.detail}</p>
                      <p className="mt-2 text-[10px] font-medium text-navy-500">{item.evidence}</p>
                    </div>
                  </div>
                </PraxisLink>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Operating sequence</p>
                <h2 className="mt-1 text-base font-semibold text-navy-900">Build context before boardroom output</h2>
              </div>
              <span className={cn('rounded-full px-2 py-1 text-[11px] font-semibold', statePillClass(plan.contextHealth.state))}>
                {plan.contextHealth.summary}
              </span>
            </div>
            <div className="mt-4 grid gap-2 lg:grid-cols-5">
              {plan.runSequence.map((step, index) => (
                <PraxisLink
                  key={step.label}
                  href={step.href}
                  className="rounded-md border border-slate-200 px-3 py-3 transition hover:border-gold-500/40 hover:bg-gold-500/5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Step {index + 1}</p>
                  <p className="mt-1 text-xs font-semibold text-navy-900">{step.label}</p>
                  <p className="mt-1 text-[11px] leading-snug text-navy-500">{step.detail}</p>
                </PraxisLink>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-diplomatic-blue/10 p-2 text-diplomatic-blue">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Deep research packet prompt</p>
                <h2 className="mt-1 text-base font-semibold text-navy-900">Research agent handoff</h2>
                <textarea
                  readOnly
                  value={plan.deepResearchPrompt}
                  className="mt-3 h-80 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-5 text-navy-800 outline-none focus:border-diplomatic-blue/50"
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Next best actions</p>
            <div className="mt-3 space-y-2">
              {plan.nextActions.map((action) => (
                <PraxisLink
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className="block rounded-md border border-slate-200 px-3 py-3 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', priorityClass(action.priority))}>
                        {action.priority}
                      </span>
                      <p className="mt-2 text-xs font-semibold text-navy-900">{action.label}</p>
                    </div>
                    {priorityIcon(action.priority)}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-navy-500">{action.detail}</p>
                </PraxisLink>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">First boardroom question</p>
            <p className="mt-2 text-sm leading-6 text-navy-800">{plan.firstQuestion}</p>
            <PraxisLink
              href="/brainstorming-table"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              Open advisors
              <Sparkles className="h-3.5 w-3.5" />
            </PraxisLink>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Missing context</p>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {plan.missingInputs.slice(0, 16).map((input) => (
                <div key={input} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-snug text-navy-600">
                  {input}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Tool sequence</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {plan.recommendedToolIds.map((toolId) => (
                <span key={toolId} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-navy-700">
                  {toolId}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn('rounded-md border px-3 py-2 text-right', tone)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: ContextBuilderStatus }) {
  if (status === 'ready') return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />;
  if (status === 'thin') return <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />;
  return <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />;
}

function priorityIcon(priority: ContextBuilderPriority) {
  if (priority === 'critical') return <ShieldAlert className="h-4 w-4 text-red-600" />;
  if (priority === 'recommended') return <Search className="h-4 w-4 text-diplomatic-blue" />;
  return <GitBranch className="h-4 w-4 text-navy-400" />;
}

function statusClass(status: ContextBuilderStatus): string {
  if (status === 'ready') return 'bg-emerald-50/60';
  if (status === 'thin') return 'bg-amber-50/60';
  return 'bg-red-50/60';
}

function priorityClass(priority: ContextBuilderPriority): string {
  if (priority === 'critical') return 'bg-red-100 text-red-700';
  if (priority === 'recommended') return 'bg-diplomatic-blue/10 text-diplomatic-blue';
  return 'bg-slate-100 text-navy-600';
}

function stateTone(state: string): string {
  if (state === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (state === 'yellow') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (state === 'red') return 'border-red-200 bg-red-50 text-red-800';
  return 'border-slate-200 bg-slate-50 text-navy-700';
}

function scoreTone(score: number): string {
  if (score >= 85) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (score >= 60) return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-red-200 bg-red-50 text-red-800';
}

function statePillClass(state: string): string {
  if (state === 'green') return 'bg-emerald-100 text-emerald-700';
  if (state === 'yellow') return 'bg-amber-100 text-amber-700';
  if (state === 'red') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-navy-500';
}
