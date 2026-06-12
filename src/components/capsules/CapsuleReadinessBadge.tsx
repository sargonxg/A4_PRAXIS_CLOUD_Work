import { cn } from '@/lib/utils/cn';

type CapsuleReadinessTier = 'ready' | 'near' | 'blocked';

interface CapsuleReadinessBadgeProps {
  score?: number | null;
  tier: CapsuleReadinessTier;
  topBlocker?: string | null;
  size?: 'sm' | 'md';
}

const tierClass: Record<CapsuleReadinessTier, { dot: string; text: string; ring: string }> = {
  ready: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-800',
    ring: 'border-emerald-200 bg-emerald-50',
  },
  near: {
    dot: 'bg-amber-400',
    text: 'text-amber-800',
    ring: 'border-amber-200 bg-amber-50',
  },
  blocked: {
    dot: 'bg-red-500',
    text: 'text-red-800',
    ring: 'border-red-200 bg-red-50',
  },
};

export function CapsuleReadinessBadge({
  score,
  tier,
  topBlocker = null,
  size = 'md',
}: CapsuleReadinessBadgeProps) {
  const tone = tierClass[tier];
  const numericScore = typeof score === 'number' && Number.isFinite(score)
    ? Math.max(0, Math.min(100, Math.round(score)))
    : null;
  const scoreLabel = numericScore === null ? '—' : String(numericScore);
  const title = topBlocker ? `Top blocker: ${topBlocker}` : 'Ready';

  return (
    <span
      title={title}
      aria-label={`Capsule readiness ${tier}, score ${scoreLabel}`}
      data-testid="capsule-readiness-badge"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold',
        tone.ring,
        tone.text,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      )}
    >
      <span className={cn('rounded-full', tone.dot, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      <span className="font-mono tabular-nums">{scoreLabel}</span>
    </span>
  );
}
