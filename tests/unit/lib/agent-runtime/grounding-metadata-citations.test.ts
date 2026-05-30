import { describe, expect, it } from 'vitest';

import {
  buildInlineCitationMap,
  verifyClaimGrounding,
} from '@/lib/agent-runtime/grounding-metadata';

describe('grounding metadata citation map', () => {
  it('walks grounding supports by descending endIndex when inserting inline markers', () => {
    const output = 'Alpha claim. Beta claim.';
    const result = buildInlineCitationMap(output, {
      groundingChunks: [
        { web: { uri: 'https://source-a.test', title: 'Source A' } },
        { web: { uri: 'https://source-b.test', title: 'Source B' } },
      ],
      groundingSupports: [
        {
          segment: { startIndex: 0, endIndex: 12, text: 'Alpha claim.' },
          groundingChunkIndices: [0],
          confidenceScores: [0.9],
        },
        {
          segment: { startIndex: 13, endIndex: 24, text: 'Beta claim.' },
          groundingChunkIndices: [1],
          confidenceScores: [0.8],
        },
      ],
    });

    expect(result.textWithCitations).toBe('Alpha claim. [1] Beta claim. [2]');
    expect(result.citations.map((citation) => citation.id)).toEqual(['g1', 'g2']);
    expect(result.supports.map((support) => support.endIndex)).toEqual([24, 12]);
  });

  it('enforces minSourcesPerClaim and maxUngroundedClaims', () => {
    const result = verifyClaimGrounding({
      claims: [
        { id: 'c1', text: 'Supported claim', sourceIds: ['g1', 'g2'] },
        { id: 'c2', text: 'Weak claim', sourceIds: ['g2'] },
        { id: 'c3', text: 'Unsupported claim', sourceIds: [] },
      ],
      minSourcesPerClaim: 2,
      maxUngroundedClaims: 0,
    });

    expect(result.status).toBe('fail');
    expect(result.supportedClaims).toEqual(['c1']);
    expect(result.weakClaims).toEqual(['c2']);
    expect(result.unsupportedClaims).toEqual(['c3']);
    expect(result.failures).toEqual([
      '1 claim(s) have no supporting sources; maximum allowed is 0.',
      '1 claim(s) have fewer than 2 source(s).',
    ]);
  });
});
