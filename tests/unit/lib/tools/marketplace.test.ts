import { describe, expect, it } from 'vitest';
import { filterMarketplaceTools } from '@/lib/tools/marketplace/filter-engine';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

describe('tools marketplace', () => {
  it('keeps the exposed registry capped at twenty-two curated tools including SAT and memo tools', () => {
    expect(MARKETPLACE_TOOLS).toHaveLength(22);
    expect(new Set(MARKETPLACE_TOOLS.map((tool) => tool.id)).size).toBe(22);
    for (const id of ['cross.ach', 'cross.kac', 'cross.red-team', 'cross.premortem', 'cross.memo-create', 'cross.memo-refresh']) {
      expect(MARKETPLACE_TOOLS.some((tool) => tool.id === id)).toBe(true);
    }
  });

  it('uses loose object schemas so raw text and context dumps can persist', () => {
    for (const tool of MARKETPLACE_TOOLS) {
      expect(tool.inputSchema).toMatchObject({ type: 'object', additionalProperties: true });
      expect(tool.outputSchema).toMatchObject({ type: 'object', additionalProperties: true });
      expect(tool.persistence).toEqual({
        storesRawText: true,
        storesContextDump: true,
        storesStructuredOutput: true,
      });
    }
  });

  it('filters by ontology, context health, category, and cost', () => {
    const tools = filterMarketplaceTools(MARKETPLACE_TOOLS, {
      ontologyId: 'conflict',
      category: 'conflict',
      contextHealth: 0.45,
      maxCostClass: 'low',
    });

    expect(tools.map((tool) => tool.id)).toEqual(['conflict.commitment-check']);
  });
});
