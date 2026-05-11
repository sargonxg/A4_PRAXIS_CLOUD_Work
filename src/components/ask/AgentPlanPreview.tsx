'use client';

import { CheckCircle2, Clock3, Gauge, ShieldCheck, X } from 'lucide-react';
import type { AskIntentPlan } from '@/lib/ai/ask/intent-classifier';
import { getMethodById } from '@/lib/methods/catalog';

export function AgentPlanPreview({
  plan,
  onConfirm,
  onCancel,
}: {
  plan: AskIntentPlan;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-navy-500">Plan preview</p>
          <h2 className="mt-1 text-base font-semibold text-navy-900">{plan.intent} work in {plan.mode} mode</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <PlanPill icon={Gauge} label={`Effort ${plan.effortLabel}`} />
          <PlanPill icon={Clock3} label={`Time ${plan.latencyLabel}`} />
          <PlanPill icon={ShieldCheck} label={`${plan.sourceCount} source signals`} />
        </div>
      </div>

      {plan.unavailableReason && (
        <p className="mt-3 rounded-md border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-sm text-navy-700">
          {plan.unavailableReason}
        </p>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(260px,0.5fr)]">
        <ol className="space-y-2">
          {plan.steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-navy-700 ring-1 ring-slate-200">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-navy-500">Methods</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {plan.methodIds.map((id) => (
              <span key={id} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-navy-700">
                {getMethodById(id)?.name ?? id}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-50">
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
          <CheckCircle2 className="h-4 w-4" />
          Confirm plan
        </button>
      </div>
    </section>
  );
}

function PlanPill({ icon: Icon, label }: { icon: typeof Gauge; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-navy-700">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
