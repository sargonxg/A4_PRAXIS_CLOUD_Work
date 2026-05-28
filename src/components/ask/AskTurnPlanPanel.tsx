'use client';

import { CheckCircle2, ChevronRight, FileText, Network, ShieldCheck, Wrench } from 'lucide-react';
import type { AskTurnPlan } from '@/lib/ai/ask-turn-plan';

export function AskTurnPlanPanel({
  onFollowUp,
  turnPlan,
}: {
  onFollowUp: (followUp: string) => void;
  turnPlan?: AskTurnPlan;
}) {
  if (!turnPlan) return null;
  const capabilityChips = [
    ...turnPlan.requiredAgents.map((agent) => ({ kind: 'agent', label: agent })),
    ...turnPlan.requiredTools.map((tool) => ({ kind: 'tool', label: tool })),
    ...turnPlan.artifactPlan.map((artifact) => ({ kind: 'artifact', label: artifact })),
  ].slice(0, 8);
  const action = continuationActionForTurnPlan(turnPlan);

  return (
    <section className="mt-3 rounded-md border border-blue-100 bg-blue-50/60 p-2" data-testid="ask-turn-plan">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
          <Network className="h-3 w-3 text-diplomatic-blue" />
          PRAXIS plan
        </p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-md border border-blue-100 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
            {formatPlanToken(turnPlan.complexity)}
          </span>
          <span className="rounded-md border border-blue-100 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
            {formatPlanToken(turnPlan.answerShape)}
          </span>
        </div>
      </div>
      <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {turnPlan.statusRail.slice(0, 4).map((status) => (
          <li key={status} className="flex min-w-0 items-center gap-1.5 rounded-md border border-blue-100 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
            <span className="truncate">{status}</span>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
        <PlanChip label="Mode" value={turnPlan.outputMode ?? 'quick_answer'} />
        <PlanChip label="Intent" value={turnPlan.intent} />
        <PlanChip label="Continuation" value={turnPlan.continuationPolicy} />
        {capabilityChips.map((chip) => (
          <span key={`${chip.kind}-${chip.label}`} className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-white px-1.5 py-0.5 font-mono text-slate-600">
            {chip.kind === 'artifact' ? <FileText className="h-2.5 w-2.5" /> : chip.kind === 'tool' ? <Wrench className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
            {formatPlanToken(chip.label)}
          </span>
        ))}
      </div>
      {turnPlan.qualityBar.length ? (
        <details className="mt-2 rounded-md border border-blue-100 bg-white px-2 py-1.5">
          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Quality bar
          </summary>
          <ul className="mt-1 grid gap-1 text-[11px] leading-4 text-slate-600">
            {turnPlan.qualityBar.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </details>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={() => onFollowUp(action.prompt)}
          className="mt-2 inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-[11px] font-semibold text-diplomatic-blue hover:bg-blue-50"
        >
          <ChevronRight className="h-3 w-3" />
          {action.label}
        </button>
      ) : null}
    </section>
  );
}

function PlanChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md border border-blue-100 bg-white px-1.5 py-0.5 font-mono text-slate-600">
      {label}: {formatPlanToken(value)}
    </span>
  );
}

function continuationActionForTurnPlan(turnPlan: AskTurnPlan): { label: string; prompt: string } | null {
  if (turnPlan.continuationPolicy === 'complete_now') return null;
  if (turnPlan.continuationPolicy === 'ask_for_sources') {
    return { label: 'Find stronger sources', prompt: 'Find stronger source receipts for this answer, then update the assessment with unsupported claims marked clearly.' };
  }
  if (turnPlan.continuationPolicy === 'needs_human_review') {
    return { label: 'Prepare review note', prompt: 'Prepare a human-review note for this answer with risks, unsupported claims, and decisions that need confirmation.' };
  }
  if (turnPlan.artifactPlan.includes('evidence_annex')) {
    return { label: 'Expand evidence annex', prompt: 'Expand this into an evidence annex with a source table, gaps, and confidence notes.' };
  }
  if (turnPlan.artifactPlan.includes('output_capsule')) {
    return { label: 'Create output capsule', prompt: 'Turn this answer into a reviewable Output Capsule with provenance, assumptions, and next actions.' };
  }
  if (turnPlan.artifactPlan.includes('research_memo')) {
    return { label: 'Continue as memo', prompt: 'Continue this as a sourced research memo with sections, citations, and explicit gaps.' };
  }
  return { label: 'Run deeper pass', prompt: 'Run a deeper PRAXIS pass on this question with tools, source checks, and an artifact-ready answer.' };
}

function formatPlanToken(value: string): string {
  return value.replace(/_/g, ' ');
}
