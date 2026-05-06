'use client';

import { computeContextHealthScore } from '@/lib/context/context-health-score';
import { cn } from '@/lib/utils/cn';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export function ContextHealthChip() {
  const { situation } = useWorkbenchScope();
  const report = computeContextHealthScore({
    situation,
  });
  const tone = report.score >= 80 ? 'green' : report.score >= 60 ? 'amber' : 'red';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
        tone === 'green' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-800',
        tone === 'red' && 'border-rose-200 bg-rose-50 text-rose-700',
      )}
      title={`${report.lowestDimension.label}: ${report.lowestDimension.detail}`}
    >
      <span>Context health</span>
      <span className="font-mono">{report.score}</span>
      <span className="hidden text-[10px] font-medium opacity-80 sm:inline">{report.lowestDimension.label}</span>
    </div>
  );
}
