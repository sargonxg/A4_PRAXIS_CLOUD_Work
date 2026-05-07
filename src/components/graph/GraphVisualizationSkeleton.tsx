import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function GraphVisualizationSkeleton({ label = 'Loading visualization', className }: { label?: string; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5', className)}>
      <div className="flex items-center gap-2 text-navy-950">
        <GitBranch className="h-5 w-5 text-gold-600" />
        <h2 className="text-lg font-semibold">{label}</h2>
      </div>
      <div className="mt-5 min-h-[380px] animate-pulse rounded-md border border-slate-200 bg-slate-100" />
    </section>
  );
}
