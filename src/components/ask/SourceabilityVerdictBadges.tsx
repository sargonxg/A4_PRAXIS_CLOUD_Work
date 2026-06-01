import type { SourceabilityClaimVerdict, SourceabilityVerdict } from '@/lib/agent-runtime/sourceability-ledger';
import { cn } from '@/lib/utils/cn';

export type SourceabilityVerdictTone = {
  label: SourceabilityVerdict;
  tone: 'gold' | 'red' | 'amber' | 'grey';
  className: string;
  metaClassName: string;
};

const VERDICT_TONES: Record<SourceabilityVerdict, SourceabilityVerdictTone> = {
  supported: {
    label: 'supported',
    tone: 'gold',
    className: 'border-l-[3px] border-l-[#E8B931] bg-[#0F172A] text-[#F4ECD8]',
    metaClassName: 'text-[#E8B931]',
  },
  contradicted: {
    label: 'contradicted',
    tone: 'red',
    className: 'border-l-[3px] border-l-red-600 bg-red-50 text-red-950',
    metaClassName: 'text-red-700',
  },
  weak: {
    label: 'weak',
    tone: 'amber',
    className: 'border-l-[3px] border-l-[#D6863A] bg-amber-50 text-amber-950',
    metaClassName: 'text-amber-700',
  },
  unsupported: {
    label: 'unsupported',
    tone: 'grey',
    className: 'border-l-[3px] border-l-slate-400 bg-slate-50 text-slate-800',
    metaClassName: 'text-slate-500',
  },
};

export function sourceabilityVerdictBadgeTone(verdict: SourceabilityVerdict): SourceabilityVerdictTone {
  return VERDICT_TONES[verdict];
}

export function SourceabilityVerdictBadges({
  limit = 8,
  verdicts,
}: {
  limit?: number;
  verdicts: SourceabilityClaimVerdict[];
}) {
  const visibleVerdicts = verdicts.slice(0, limit);
  if (!visibleVerdicts.length) return null;

  return (
    <section className="mt-3 flex flex-wrap gap-1.5" data-testid="sourceability-verdicts" aria-label="Sourceability verdicts">
      {visibleVerdicts.map((verdict) => {
        const tone = sourceabilityVerdictBadgeTone(verdict.verdict);
        return (
          <span
            key={verdict.claimId}
            title={verdict.claim}
            data-sourceability-verdict={verdict.verdict}
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-[11px] shadow-sm',
              tone.className,
            )}
          >
            <span className={cn('font-mono text-[9px] font-bold uppercase', tone.metaClassName)}>
              claim
            </span>
            <span className="font-semibold">{tone.label}</span>
            {verdict.sourceIds.length ? (
              <span className={cn('font-mono text-[10px]', tone.metaClassName)}>
                {verdict.sourceIds.length} receipt{verdict.sourceIds.length === 1 ? '' : 's'}
              </span>
            ) : null}
            <span className="max-w-[16rem] truncate opacity-90">{verdict.claim}</span>
          </span>
        );
      })}
    </section>
  );
}
