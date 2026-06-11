import { formatSourceFreshness, resolveSourceTier, type SourceReliabilityTier } from '@/lib/sources/source-trust';
import { cn } from '@/lib/utils/cn';

export function SourceTierBadge({
  className,
  date,
  showFreshness = false,
  size = 'sm',
  stale = false,
  tier,
}: {
  className?: string;
  date?: string | null;
  showFreshness?: boolean;
  size?: 'xs' | 'sm';
  stale?: boolean | null;
  tier?: SourceReliabilityTier | null | string | number;
}) {
  const resolved = resolveSourceTier(tier);
  const label = resolved === 1
    ? 'T1'
    : resolved === 2
      ? 'T2'
      : resolved === 3
        ? 'T3 verify'
        : 'unrated';
  const freshness = showFreshness ? formatSourceFreshness({ date, stale }) : null;
  return (
    <span
      data-testid="source-tier-badge"
      title={freshness ? `${label} - ${freshness}` : label}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md border font-mono font-bold uppercase tracking-[0.12em]',
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
        resolved === 1 && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        resolved === 2 && 'border-slate-200 bg-slate-100 text-slate-700',
        resolved === 3 && 'border-amber-200 bg-amber-50 text-amber-800',
        resolved === null && 'border-slate-200 bg-white text-slate-500',
        className,
      )}
    >
      <span>{label}</span>
      {freshness ? <span className="normal-case tracking-normal opacity-75">{freshness}</span> : null}
    </span>
  );
}
