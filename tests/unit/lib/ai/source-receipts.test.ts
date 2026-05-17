import { describe, expect, it } from 'vitest';
import {
  buildSourceReceipts,
  formatSourceReceiptAudit,
  summarizeSourceReceipts,
} from '@/lib/ai/source-receipts';
import type { WebResearchResult } from '@/lib/ai/web-research';

describe('source receipts', () => {
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
        },
        {
          title: 'AP source',
          url: 'https://apnews.com/example',
          content: 'AP content',
          source: 'apnews.com',
          provider: 'google-search',
          reliabilityScore: 0.95,
        },
        {
          title: 'Crisis Group source',
          url: 'https://crisisgroup.org/example',
          content: 'Analysis content',
          source: 'crisisgroup.org',
          provider: 'google-search',
          reliabilityScore: 0.9,
        },
        {
          title: 'UN source',
          url: 'https://news.un.org/example',
          content: 'UN content',
          source: 'news.un.org',
          provider: 'google-search',
          reliabilityScore: 0.92,
        },
        {
          title: 'Think tank source',
          url: 'https://brookings.edu/example',
          content: 'Think tank content',
          source: 'brookings.edu',
          provider: 'google-search',
          reliabilityScore: 0.85,
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
