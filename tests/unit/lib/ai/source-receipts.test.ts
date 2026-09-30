import { describe, expect, it } from 'vitest';
import {
  buildSourceReceipts,
  formatSourceReceiptAudit,
  summarizeSourceReceipts,
} from '@/lib/ai/source-receipts';
import type { WebResearchResult } from '@/lib/ai/web-research';

describe('source receipts', () => {
  it('excludes generated search overviews from canonical source evidence', () => {
    const receipts = buildSourceReceipts({ results: [{ title: 'Generated overview', url: 'https://google.com/search?q=case', content: 'Synthetic case expenditure was confirmed.', source: 'Gemini', provider: 'google-search', reliabilityScore: 0.99, isGroundedSummary: true }] });
    expect(receipts).toEqual([]);
  });
  it('retains unavailable originals and generated attribution without claiming original quotation support', () => {
    const receipts = buildSourceReceipts({ results: [{ title: 'Institutional methods', url: 'https://gao.gov/methods', content: '', source: 'gao.gov', provider: 'google-search', reliabilityScore: 0.99, originalPassageStatus: 'unavailable', originalPassages: [], unavailableReason: 'http-error', generatedGroundingSegments: [{ kind: 'generated-grounding-segment', text: 'Synthetic case funding was spent.', sourceUrl: 'https://gao.gov/methods', claimSupport: 'provider-attributed-unverified' }] }] });
    expect(receipts[0].confidence).toBe('low');
    expect(receipts[0].span).toBeUndefined();
    expect(receipts[0].excerpt).toBeUndefined();
    expect(receipts[0].originalPassageStatus).toBe('unavailable');
    expect(receipts[0].generatedGroundingSegments?.[0].claimSupport).toBe('provider-attributed-unverified');
    expect(summarizeSourceReceipts(receipts).confidence).toBe('low');
  });
  it('normalizes web and scrape receipts', () => {
    const results: WebResearchResult[] = [
      {
        title: 'UN report on corridor access',
        url: 'https://news.un.org/example',
        content: 'UN report text',
        snippet: 'UN report snippet',
        source: 'news.un.org',
        provider: 'google-search',
        reliabilityScore: 0.92,
        query: 'corridor access',
        retrievedAt: '2026-04-30T00:00:00.000Z',
        originalPassageStatus: 'retrieved',
      },
    ];

    const receipts = buildSourceReceipts({
      results,
      scraped: [{
        url: 'https://example.org/update',
        title: 'Field update',
        content: 'Full page excerpt',
        success: true,
      }],
      generatedAt: '2026-04-30T00:00:00.000Z',
    });

    expect(receipts).toHaveLength(2);
    expect(receipts.map((receipt) => receipt.kind)).toEqual(['web-result', 'scraped-excerpt']);
    expect(receipts[0].confidence).toBe('high');
    expect(receipts[0].receiptId).toMatch(/^rcpt_/);
    expect(receipts[0].sourceId).toMatch(/^src_/);
    expect(receipts[0].retrievalMethod).toBe('web_search');
    expect(receipts[0].span?.quote).toContain('UN report snippet');
  });

  it('summarizes confidence and formats prompt audit text', () => {
    const receipts = buildSourceReceipts({
      results: [
        {
          title: 'Reuters source',
          url: 'https://reuters.com/world/example',
          content: 'Reuters content',
          source: 'reuters.com',
          provider: 'google-search',
          reliabilityScore: 0.95,
          originalPassageStatus: 'retrieved',
        },
        {
          title: 'AP source',
          url: 'https://apnews.com/example',
          content: 'AP content',
          source: 'apnews.com',
          provider: 'google-search',
          reliabilityScore: 0.95,
          originalPassageStatus: 'retrieved',
        },
        {
          title: 'Local source',
          url: 'https://example.org/local-update',
          content: 'Analysis content',
          source: 'example.org',
          provider: 'google-search',
          reliabilityScore: 0.9,
          originalPassageStatus: 'retrieved',
        },
        {
          title: 'UN source',
          url: 'https://news.un.org/example',
          content: 'UN content',
          source: 'news.un.org',
          provider: 'google-search',
          reliabilityScore: 0.92,
          originalPassageStatus: 'retrieved',
        },
        {
          title: 'Think tank source',
          url: 'https://brookings.edu/example',
          content: 'Think tank content',
          source: 'brookings.edu',
          provider: 'google-search',
          reliabilityScore: 0.85,
          originalPassageStatus: 'retrieved',
        },
      ],
    });
    const audit = summarizeSourceReceipts(receipts);
    const formatted = formatSourceReceiptAudit(audit);

    expect(audit.confidence).toBe('high');
    expect(audit.checkableUrlCount).toBe(5);
    expect(formatted).toContain('Source Receipt Audit');
    expect(formatted).toContain('Providers:');
  });
});
