import Link from 'next/link';
import { ArrowRight, BrainCircuit, DatabaseZap, ListChecks } from 'lucide-react';
import { CATEGORY_LABELS, getMethodSourceTool, type MethodDefinition } from '@/lib/methods/catalog';
import { cn } from '@/lib/utils/cn';
import { MethodFitBadge } from '@/components/methods/MethodFitBadge';

const CATEGORY_ICON = {
  ai: BrainCircuit,
  research: DatabaseZap,
  deterministic: ListChecks,
};

export function MethodCard({ method, compact = false }: { method: MethodDefinition; compact?: boolean }) {
  const Icon = CATEGORY_ICON[method.category];
  const sourceTool = getMethodSourceTool(method);

  return (
    <article className={cn('flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm', compact ? 'gap-3' : 'gap-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-navy-700">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-navy-500">{CATEGORY_LABELS[method.category]}</p>
            <h3 className="mt-1 text-base font-semibold leading-tight text-navy-900">{method.name}</h3>
          </div>
        </div>
        <MethodFitBadge status={method.status} />
      </div>

      <p className="text-sm leading-relaxed text-navy-600">{method.summary}</p>

      {!compact && (
        <div className="grid gap-3 text-xs text-navy-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-navy-800">Best for</p>
            <p className="mt-1 leading-relaxed">{method.bestFor.join(', ')}</p>
          </div>
          <div>
            <p className="font-semibold text-navy-800">Outputs</p>
            <p className="mt-1 leading-relaxed">{method.outputs.join(', ')}</p>
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="truncate text-xs text-navy-500">
          {sourceTool ? `Backed by ${sourceTool.name}` : 'Backed by grounded research'}
        </span>
        <Link
          href={`/methods/${method.id}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-navy-50"
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
