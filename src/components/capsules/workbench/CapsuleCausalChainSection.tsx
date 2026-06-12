'use client';

import { memo } from 'react';
import { Network } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { getRelationshipCategory, RELATIONSHIP_CATEGORY_COLORS } from '@/lib/constants/aco-colors';
import { CompactList, formatConfidence, StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleCausalChainSection = memo(function CapsuleCausalChainSection({ causalChains }: { causalChains: CapsuleWorkbenchViewModel['causalChains'] }) {
  return (
    <WorkbenchSection title="Causal chain" icon={Network}>
      <div data-testid="capsule-causal-chain-view" className="space-y-2">
        {causalChains.length ? causalChains.map((chain) => {
          const category = getRelationshipCategory(chain.relation);
          const borderColor = category ? RELATIONSHIP_CATEGORY_COLORS[category] : '#94a3b8';
          return (
            <div key={chain.id} className="rounded-md border bg-slate-50 p-2.5" style={{ borderColor }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatePill state={chain.reviewState} label={chain.direction} />
                <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">{chain.relation}</span>
              </div>
              <div className="mt-2 grid gap-2 text-xs leading-5 text-slate-700">
                <p><span className="font-semibold text-slate-950">{chain.cause}</span> {'->'} {chain.effect}</p>
                <p className="text-slate-500">{formatConfidence(chain.confidence)}{chain.caveat ? ` · ${chain.caveat}` : ''}</p>
              </div>
              <CompactList items={chain.sourceIds.map((id) => `receipt: ${id}`)} empty="No source receipts attached yet." />
            </div>
          );
        }) : (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">No causal links have been declared yet.</p>
        )}
      </div>
    </WorkbenchSection>
  );
});
