'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import type { MarketplaceHeroToolId } from '@/lib/tools/marketplace/stage-targets';
import { readStagedMarketplaceContext, type MarketplaceStagedContext } from '@/lib/tools/marketplace/staged-context';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export function StagedHeroToolNotice({ heroToolIds }: { heroToolIds: MarketplaceHeroToolId[] }) {
  const { caseId } = useWorkbenchScope();
  const [items, setItems] = useState<MarketplaceStagedContext[]>([]);

  useEffect(() => {
    const refresh = () => {
      setItems(heroToolIds.flatMap((heroToolId) => {
        const staged = readStagedMarketplaceContext(caseId, heroToolId);
        return staged ? [staged] : [];
      }));
    };
    refresh();
    window.addEventListener('praxis-marketplace-stage', refresh);
    return () => window.removeEventListener('praxis-marketplace-stage', refresh);
  }, [caseId, heroToolIds]);

  if (!items.length) return null;

  return (
    <section className="mb-4 rounded-lg border border-gold-200 bg-gold-50 p-4">
      <div className="flex items-start gap-3">
        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy-950">Recipe staged for this hero tool</p>
          <p className="mt-1 text-sm leading-6 text-slate-800">
            The recipe library staged context here without producing a standalone recipe output. Review the prompt, then run the hero tool when ready.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <article key={`${item.heroToolId}:${item.recipeId}:${item.stagedAt}`} className="rounded-md border border-gold-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-navy-950">
              <span className="rounded-full border border-gold-200 bg-gold-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold-800">
                Staged from {item.recipeName}
              </span>
              <span>{item.recipeName}</span>
              <ArrowRight className="h-3.5 w-3.5 text-gold-700" />
              <span>{item.heroToolName}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-650">{item.rationale}</p>
            <p className="mt-2 text-sm leading-6 text-slate-750">{item.prompt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
