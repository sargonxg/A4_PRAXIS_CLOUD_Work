import { CheckCircle2, Clock3, TriangleAlert } from 'lucide-react';
import { STATUS_LABELS, type MethodStatus } from '@/lib/methods/catalog';
import { cn } from '@/lib/utils/cn';

const STATUS_STYLES: Record<MethodStatus, string> = {
  'runtime-ready': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'context-required': 'border-gold-500/40 bg-gold-500/10 text-gold-700',
  'phase-5-runtime': 'border-slate-200 bg-slate-50 text-navy-600',
};

const STATUS_ICONS = {
  'runtime-ready': CheckCircle2,
  'context-required': TriangleAlert,
  'phase-5-runtime': Clock3,
};

export function MethodFitBadge({ status, className }: { status: MethodStatus; className?: string }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold', STATUS_STYLES[status], className)}>
      <Icon className="h-3.5 w-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}
