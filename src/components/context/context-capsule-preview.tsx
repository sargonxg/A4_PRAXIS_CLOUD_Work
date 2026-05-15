import Link from 'next/link';
import { BookOpenText, Clock3, FileText, Network, Target, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ContextCapsulePreviewProps {
  userLabel: string;
  situationLabel: string;
  pathLabel?: string;
  sourceCount: number;
  documentCount: number;
  sourcesLabel?: string;
  graphState: string;
  toolsLabel?: string;
  timeHorizon: string;
  outputGoal: string;
  healthScore?: number;
  href?: string;
  className?: string;
  compact?: boolean;
}

export function ContextCapsulePreview({
  userLabel,
  situationLabel,
  pathLabel,
  sourceCount,
  documentCount,
  sourcesLabel,
  graphState,
  toolsLabel,
  timeHorizon,
  outputGoal,
  healthScore,
  href = '/app/dashboard',
  className,
  compact = false,
}: ContextCapsulePreviewProps) {
  const body = (
    <article className={cn('rounded-xl border border-navy-200 bg-white p-4 shadow-sm shadow-navy-950/5', compact ? 'p-3' : 'p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">Context capsule</p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-navy-950">{situationLabel}</h3>
        </div>
        {typeof healthScore === 'number' ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
            {healthScore}/100
          </span>
        ) : null}
      </div>
      <div className={cn('mt-4 grid gap-2', compact ? 'grid-cols-2' : 'sm:grid-cols-2')}>
        <CapsuleFact icon={Users} label="User" value={userLabel} />
        <CapsuleFact icon={Target} label="Situation" value={situationLabel} />
        {pathLabel ? <CapsuleFact icon={Network} label="Path" value={pathLabel} /> : null}
        <CapsuleFact icon={BookOpenText} label="Sources" value={sourcesLabel ?? `${sourceCount} sources · ${documentCount} docs`} />
        <CapsuleFact icon={Network} label={toolsLabel ? 'Tools' : 'Graph'} value={toolsLabel ?? graphState} />
        <CapsuleFact icon={Clock3} label="Time" value={timeHorizon} />
        <CapsuleFact icon={FileText} label="Output" value={outputGoal} />
      </div>
    </article>
  );

  return (
    <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-diplomatic-blue focus:ring-offset-2">
      {body}
    </Link>
  );
}

function CapsuleFact({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-diplomatic-blue" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      </div>
      <p className="mt-1 truncate text-xs font-semibold text-navy-950">{value}</p>
    </div>
  );
}
