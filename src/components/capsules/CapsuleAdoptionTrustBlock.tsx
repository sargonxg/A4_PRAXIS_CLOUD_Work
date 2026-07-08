'use client';

import { CapsuleReadinessBadge } from '@/components/capsules/CapsuleReadinessBadge';
import { cn } from '@/lib/utils/cn';

type Forkability = 'allowed' | 'review_required' | 'disabled';

export interface CapsuleAdoptionSourceCoverage {
  assessed: boolean;
  tierSummary: string;
  freshnessLabel: string;
}

export interface CapsuleAdoptionProvenance {
  originLabel: string;
  parentCapsuleId?: string | null;
  parentHref?: string | null;
}

export interface CapsuleAdoptionTrustBlockProps {
  capsuleTitle: string;
  readiness: {
    tier: 'ready' | 'near' | 'blocked';
    score?: number | null;
    topBlocker?: string | null;
  };
  sourceCoverage: CapsuleAdoptionSourceCoverage;
  humanGateLabel: string;
  lastRefreshLabel: string;
  provenance: CapsuleAdoptionProvenance;
  forkability: Forkability;
  forkBusy?: boolean;
  onFork: () => void;
}

export function CapsuleAdoptionTrustBlock({
  capsuleTitle,
  readiness,
  sourceCoverage,
  humanGateLabel,
  lastRefreshLabel,
  provenance,
  forkability,
  forkBusy = false,
  onFork,
}: CapsuleAdoptionTrustBlockProps) {
  const disabledReason = forkability === 'review_required'
    ? 'This capsule needs human review before a private fork can be created.'
    : forkability === 'disabled'
      ? 'Forking is disabled by the capsule owner.'
      : null;
  const disabled = Boolean(disabledReason) || forkBusy;
  const forkLabel = forkability === 'review_required'
    ? 'Fork requires review first'
    : forkBusy
      ? 'Forking...'
      : 'Fork private copy';

  return (
    <section
      className="mt-5 rounded-lg border border-emerald-200 bg-[color:var(--color-archive-paper-strong)] p-3"
      data-testid="capsule-adoption-trust-block"
      aria-label={`Adoption trust signals for ${capsuleTitle}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-mineral)]">Before you fork</p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">Provenance and review state stay visible before adoption.</p>
        </div>
        <CapsuleReadinessBadge size="sm" {...readiness} />
      </div>

      <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-600 md:grid-cols-2">
        <TrustSignal label="Source coverage" value={sourceCoverage.tierSummary} muted={!sourceCoverage.assessed} />
        <TrustSignal label="Freshness" value={sourceCoverage.freshnessLabel} muted={!sourceCoverage.assessed} />
        <TrustSignal label="Human gate" value={humanGateLabel} />
        <TrustSignal label="Last refresh" value={lastRefreshLabel} />
        <TrustSignal
          label="Provenance"
          value={[
            `origin ${provenance.originLabel}`,
            provenance.parentCapsuleId ? `parent ${provenance.parentCapsuleId}` : null,
          ].filter(Boolean).join(' / ')}
          href={provenance.parentHref ?? undefined}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="capsule-adoption-fork-button"
          onClick={onFork}
          disabled={disabled}
          className={cn(
            'rounded-md px-3 py-2 text-xs font-semibold',
            disabled
              ? 'cursor-not-allowed border border-slate-200 bg-white text-slate-400'
              : 'bg-emerald-700 text-white hover:bg-emerald-600',
          )}
        >
          {forkLabel}
        </button>
        {disabledReason ? (
          <p className="text-xs leading-5 text-slate-500">{disabledReason}</p>
        ) : (
          <p className="text-xs leading-5 text-slate-500">Creates a private copy with parent lineage and fresh review state.</p>
        )}
      </div>
    </section>
  );
}

function TrustSignal({
  label,
  value,
  href,
  muted = false,
}: {
  label: string;
  value: string;
  href?: string;
  muted?: boolean;
}) {
  const valueClassName = cn('mt-0.5 block font-semibold', muted ? 'text-slate-500' : 'text-[color:var(--color-ink)]');
  return (
    <p className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {href ? (
        <a className={cn(valueClassName, 'hover:underline')} href={href}>
          {value}
        </a>
      ) : (
        <span className={valueClassName}>{value}</span>
      )}
    </p>
  );
}
