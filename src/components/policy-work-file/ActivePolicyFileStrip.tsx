'use client';

import { FileText, Plus } from 'lucide-react';
import { buildActivePolicyFileModel, type ActivePolicyFileInput } from '@/lib/policy-work-file/active-policy-file';
import { cn } from '@/lib/utils/cn';

export function ActivePolicyFileStrip({
  file,
  onCreate,
  className,
}: {
  file: ActivePolicyFileInput;
  onCreate?: () => void;
  className?: string;
}) {
  const model = buildActivePolicyFileModel(file);
  return (
    <section
      className={cn(
        'rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm',
        className,
      )}
      data-testid="active-policy-file-strip"
      aria-label="Active Policy File"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">
            <FileText className="h-3.5 w-3.5" />
            Active Policy File
          </p>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-950">{model.title}</h3>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{model.subtitle}</p>
        </div>
        {!model.hasActiveFile && onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Create from this question
          </button>
        ) : null}
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-6">
        <PolicyFileMetric label="Goal" value={model.outputGoal} />
        <PolicyFileMetric label="Sources" value={String(model.sourceCount)} />
        <PolicyFileMetric label="Open questions" value={String(model.openQuestions)} />
        <PolicyFileMetric label="Unsupported" value={String(model.unsupportedClaims)} />
        <PolicyFileMetric label="Review gate" value={model.reviewGate} />
        <PolicyFileMetric label="Next" value={model.nextAction} />
      </div>
      <p className="mt-2 truncate font-mono text-[10px] text-slate-400">{model.capsuleLabel}</p>
    </section>
  );
}

function PolicyFileMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-md bg-slate-50 px-2 py-1">
      <span className="block truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className="mt-0.5 block truncate font-semibold text-slate-800">{value}</span>
    </span>
  );
}
