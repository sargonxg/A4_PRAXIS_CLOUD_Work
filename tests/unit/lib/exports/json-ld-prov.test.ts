import { describe, expect, it } from 'vitest';
import { buildJsonLdProvenanceManifest } from '@/lib/exports/json-ld-prov';

describe('JSON-LD provenance manifest', () => {
  it('records praxis agent and claim provenance', () => {
    const manifest = buildJsonLdProvenanceManifest([
      { id: 'c1', text: 'Claim', sources: ['s1'], trustScore: 88, confidence: 'EXTRACTED' },
    ], 'wp1');

    expect(manifest.wasGeneratedBy.agent).toBe('praxis-v7-product-surface');
    expect(manifest.claims[0].sources).toEqual(['s1']);
  });
});
