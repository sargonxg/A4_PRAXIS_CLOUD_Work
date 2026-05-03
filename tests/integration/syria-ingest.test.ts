import { describe, expect, it } from 'vitest';
import { collectSyriaIngestDocuments } from '@/lib/syria/ingest';
import { SYRIA_SOURCE_LIBRARY } from '@/lib/syria/source-library';

describe('Syria ingest', () => {
  it('returns recording-safe cached fallback documents with provenance', async () => {
    const docs = await collectSyriaIngestDocuments({ live: false });
    expect(docs.length).toBeGreaterThanOrEqual(8);
    expect(docs.every((doc) => doc.provenance.retrievedAt && doc.text.length > 20)).toBe(true);
    expect(docs.every((doc) => doc.provenance.live === false)).toBe(true);
  });

  it('keeps the locked Syria source library broad and tiered', () => {
    expect(SYRIA_SOURCE_LIBRARY.length).toBeGreaterThanOrEqual(18);
    expect(SYRIA_SOURCE_LIBRARY.some((source) => source.tier === 'local-independent')).toBe(true);
    expect(SYRIA_SOURCE_LIBRARY.some((source) => source.id === 'reliefweb-syria' && source.liveEnabled)).toBe(true);
  });
});
