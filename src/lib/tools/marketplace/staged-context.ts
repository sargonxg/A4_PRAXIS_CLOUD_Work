import type { MarketplaceHeroToolId, MarketplaceStageChapter } from '@/lib/tools/marketplace/stage-targets';

export interface MarketplaceStagedContext {
  recipeId: string;
  recipeName: string;
  recipeDescription: string;
  heroToolId: MarketplaceHeroToolId;
  heroToolName: string;
  chapter: MarketplaceStageChapter;
  caseId: string;
  caseName: string;
  prompt: string;
  context: Record<string, unknown>;
  stagedAt: string;
}

export function stagedContextKey(caseId: string, heroToolId: MarketplaceHeroToolId): string {
  return `praxis:marketplace-stage:${caseId}:${heroToolId}`;
}

export function writeStagedMarketplaceContext(payload: MarketplaceStagedContext): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(stagedContextKey(payload.caseId, payload.heroToolId), JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('praxis-marketplace-stage'));
}

export function readStagedMarketplaceContext(
  caseId: string,
  heroToolId: MarketplaceHeroToolId,
): MarketplaceStagedContext | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(stagedContextKey(caseId, heroToolId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MarketplaceStagedContext;
  } catch {
    return null;
  }
}
