'use client';

import { useEffect, useState } from 'react';
import type { MarketplaceHeroToolId } from '@/lib/tools/marketplace/stage-targets';
import { readStagedMarketplaceContext, type MarketplaceStagedContext } from '@/lib/tools/marketplace/staged-context';

export type StagedRecipe = MarketplaceStagedContext;

export function useStagedRecipe(caseId: string, heroToolId: MarketplaceHeroToolId): StagedRecipe | null {
  const [staged, setStaged] = useState<StagedRecipe | null>(null);

  useEffect(() => {
    const refresh = () => setStaged(readStagedMarketplaceContext(caseId, heroToolId));
    refresh();
    window.addEventListener('praxis-marketplace-stage', refresh);
    return () => window.removeEventListener('praxis-marketplace-stage', refresh);
  }, [caseId, heroToolId]);

  return staged;
}
