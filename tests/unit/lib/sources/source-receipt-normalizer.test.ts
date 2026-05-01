import { describe, expect, it } from 'vitest';
import { normalizeSourceReceipt, normalizeSourceReceipts } from '@/lib/sources/source-receipt-normalizer';

describe('source receipt normalizer', () => {
  it('normalizes legacy receipt chips into canonical UI receipts', () => {
    const receipt = normalizeSourceReceipt({
      name: 'UN News',
      title: 'UN statement',
      url: 'https://news.un.org/example',
      timestamp: '2026-05-01T00:00:00.000Z',
      confidence: 'high',
      reliabilityScore: 0.91,
      excerpt: 'Relevant source excerpt.',
    });

    expect(receipt).toMatchObject({
      name: 'UN News',
      source: 'news.un.org',
      retrievalMethod: 'web_search',
      confidence: 'high',
      reliabilityScore: 0.91,
    });
    expect(receipt?.receiptId).toMatch(/^rcpt_/);
    expect(receipt?.sourceId).toMatch(/^src_/);
    expect(receipt?.span?.quote).toBe('Relevant source excerpt.');
  });

  it('drops malformed entries and preserves explicit canonical fields', () => {
    const receipts = normalizeSourceReceipts([
      null,
      { title: '' },
      {
        receiptId: 'rcpt_custom',
        sourceId: 'src_custom',
        title: 'UCDP API',
        provider: 'ucdp',
        source: 'ucdp.uu.se',
        kind: 'structured-data',
        retrievalMethod: 'structured_data',
        timestamp: '2026-05-01T00:00:00.000Z',
        confidence: 'medium',
        reliabilityScore: 0.9,
      },
    ]);

    expect(receipts).toHaveLength(1);
    expect(receipts[0]).toMatchObject({
      receiptId: 'rcpt_custom',
      sourceId: 'src_custom',
      retrievalMethod: 'structured_data',
    });
  });
});
