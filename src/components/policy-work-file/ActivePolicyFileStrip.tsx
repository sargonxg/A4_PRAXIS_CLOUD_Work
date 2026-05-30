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
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <p className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">
          <FileText className="h-3.5 w-3.5" />
          Active Policy File
        </p>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-950">{model.title}</h3>
        {model.hasActiveFile ? (
          <span className="shrink-0 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
            {model.sourceCount} sources / {model.openQuestions} open
          </span>
        ) : null}
        {!model.hasActiveFile && onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Create from this question
          </button>
        ) : (
          <span className="ml-auto shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
            {model.nextAction}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-[11px] text-slate-500" title={`${model.subtitle} / ${model.outputGoal} / ${model.reviewGate} / ${model.capsuleLabel}`}>
        {model.hasActiveFile
          ? `${model.subtitle} / ${model.outputGoal}${model.unsupportedClaims ? ` / ${model.unsupportedClaims} claims need support` : ''}`
          : 'Ask normally; PRAXIS can turn the question into a file when the work becomes substantial.'}
      </p>
    </section>
  );
}
