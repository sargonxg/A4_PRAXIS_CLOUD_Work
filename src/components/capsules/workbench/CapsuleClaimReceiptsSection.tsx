'use client';

import { memo } from 'react';
import { Database } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { SourceTierBadge } from '@/components/source/SourceTierBadge';
import { formatConfidence, InfoLine, StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleClaimReceiptsSection = memo(function CapsuleClaimReceiptsSection({ claims }: { claims: CapsuleWorkbenchViewModel['claims'] }) {
  return (
    <WorkbenchSection title="Claim receipts" icon={Database}>
      <div data-testid="capsule-claim-receipts" className="space-y-2">
        {claims.length ? claims.map((claim) => (
          <details key={claim.claimId} className="rounded-md border border-slate-200 bg-slate-50 p-2">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              <span className="mr-2 inline-flex rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">{claim.support}</span>
              {claim.text}
            </summary>
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                {claim.validFrom || claim.validUntil ? <StatePill state="canonical" label={`${claim.validFrom ?? 'open'} to ${claim.validUntil ?? 'open'}`} /> : null}
                {claim.asOf ? <StatePill state="canonical" label={`as of ${claim.asOf}`} /> : null}
                <StatePill state={claim.reviewState} label={`${claim.receipts.length} receipt${claim.receipts.length === 1 ? '' : 's'}`} />
              </div>
              {claim.receipts.length ? claim.receipts.map((receipt, index) => (
                <div key={`${claim.claimId}-${receipt.sourceId}-${index}`} className="rounded-md border border-slate-100 bg-white p-2 text-xs leading-5 text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{receipt.publisher ?? receipt.sourceId}</p>
                    <span aria-label="Reliability tier">
                      <SourceTierBadge tier={receipt.reliabilityTier ?? null} date={receipt.date ?? null} showFreshness size="xs" />
                    </span>
                  </div>
                  <p className="mt-2">{receipt.snippet || 'Receipt snippet not captured.'}</p>
                  <div className="mt-2 grid gap-1 text-[11px] text-slate-500 sm:grid-cols-2">
                    <InfoLine label="Date" value={receipt.date ?? 'date not set'} />
                    <InfoLine label="Confidence" value={formatConfidence(receipt.confidence)} />
                    <InfoLine label="Location" value={receipt.page ? `page ${receipt.page}` : receipt.charOffset ? `offset ${receipt.charOffset}` : 'location not set'} />
                    <InfoLine label="Source" value={receipt.url ?? receipt.sourceId} />
                  </div>
                </div>
              )) : (
                <p className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">No source receipts attached yet.</p>
              )}
            </div>
          </details>
        )) : (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">No claim ledger entries yet.</p>
        )}
      </div>
    </WorkbenchSection>
  );
});
