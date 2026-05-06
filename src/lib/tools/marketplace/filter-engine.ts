import type { MarketplaceCostClass, MarketplaceFilter, MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';

const COST_RANK: Record<MarketplaceCostClass, number> = { low: 1, medium: 2, high: 3 };

export function filterMarketplaceTools(
  tools: MarketplaceToolDefinition[],
  filter: MarketplaceFilter,
): MarketplaceToolDefinition[] {
  return tools.filter((tool) => {
    if (filter.category && filter.category !== 'all' && tool.category !== filter.category) return false;
    if (filter.ontologyId && filter.ontologyId !== 'all' && !tool.ontologyRequirements.includes(filter.ontologyId)) return false;
    if (filter.maxCostClass && COST_RANK[tool.costClass] > COST_RANK[filter.maxCostClass]) return false;
    if (typeof filter.contextHealth === 'number' && tool.minContextHealth > filter.contextHealth) return false;
    return true;
  });
}

export function sortMarketplaceTools(tools: MarketplaceToolDefinition[]): MarketplaceToolDefinition[] {
  return [...tools].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
