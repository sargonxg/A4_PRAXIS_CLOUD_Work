import { describe, expect, it } from 'vitest';

import { MARKETPLACE_TOOLS, getMarketplaceTool } from '@/lib/tools/marketplace/registry';

describe('Pack 31 analytics marketplace tools', () => {
  it('adds three cross-category tools without new categories', () => {
    expect(MARKETPLACE_TOOLS).toHaveLength(57);
    for (const id of ['analyze.network', 'match.sanctions', 'simulate.policy_abm']) {
      const tool = getMarketplaceTool(id);
      expect(tool).toBeTruthy();
      expect(tool?.category).toBe('cross');
      expect(tool?.subagentDeps).toContain('context-preparer');
    }
  });

  it('keeps simulation framed as scenario stress-test', () => {
    const tool = getMarketplaceTool('simulate.policy_abm');
    expect(tool?.description.toLowerCase()).toContain('scenario stress-test');
    expect(tool?.description.toLowerCase()).not.toContain('prediction');
  });
});
