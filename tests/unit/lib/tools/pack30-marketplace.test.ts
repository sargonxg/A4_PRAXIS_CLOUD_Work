import { describe, expect, it } from 'vitest';

import { getMarketplaceTool } from '@/lib/tools/marketplace/registry';

describe('Pack 30 extraction marketplace tools', () => {
  it('registers GLiNER entity extraction in the existing cross category', () => {
    const tool = getMarketplaceTool('extract.entities.gliner');

    expect(tool).toBeTruthy();
    expect(tool?.category).toBe('cross');
    expect(tool?.sideEffects.proposesGraphChanges).toBe(true);
    expect(tool?.sideEffects.writesMemoBlocks).toBe(false);
    expect(tool?.skill.file).toBe('skills/tools/extract.entities.gliner/SKILL.md');
  });

  it('registers GraphRAG community synthesis as explicit batch synthesis', () => {
    const tool = getMarketplaceTool('cross.community-synthesizer');

    expect(tool).toBeTruthy();
    expect(tool?.category).toBe('cross');
    expect(tool?.costClass).toBe('high');
    expect(tool?.streaming).toBe(false);
    expect(tool?.composition.canChainFrom).toContain('extract.entities.gliner');
    expect(tool?.sideEffects.writesMemoBlocks).toBe(true);
  });
});
