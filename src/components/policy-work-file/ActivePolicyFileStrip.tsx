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
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">
            <FileText className="h-3.5 w-3.5" />
            Active Policy File
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 max-w-full truncate text-sm font-semibold text-slate-950">{model.title}</h3>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <p className="min-w-0 truncate text-[11px] text-slate-500">{model.subtitle}</p>
          </div>
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
        ) : (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
            {model.nextAction}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PolicyFileChip label="Target" value={model.outputGoal} />
        <PolicyFileChip label="Sources" value={String(model.sourceCount)} />
        <PolicyFileChip label="Open" value={String(model.openQuestions)} />
        <PolicyFileChip label="Unsupported" value={String(model.unsupportedClaims)} />
        <PolicyFileChip label="Gate" value={model.reviewGate} />
        <span className="min-w-0 truncate font-mono text-[10px] text-slate-400">{model.capsuleLabel}</span>
      </div>
    </section>
  );
}

function PolicyFileChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-md bg-slate-50 px-2 py-1 text-[11px]">
      <span className="font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className="ml-1 font-semibold text-slate-800">{value}</span>
    </span>
  );
}
