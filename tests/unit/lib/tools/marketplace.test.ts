import { describe, expect, it } from 'vitest';
import { filterMarketplaceTools } from '@/lib/tools/marketplace/filter-engine';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

describe('tools marketplace', () => {
  it('keeps the exposed registry capped at sixteen curated tools', () => {
    expect(MARKETPLACE_TOOLS).toHaveLength(16);
    expect(new Set(MARKETPLACE_TOOLS.map((tool) => tool.id)).size).toBe(16);
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
