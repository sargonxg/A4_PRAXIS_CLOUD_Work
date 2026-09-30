import { describe, expect, it } from 'vitest';
import { memoOriginalSourceUrl, memoSourceStatus } from '@/lib/memo/source-preview';

describe('memo original source presentation', () => {
  it('rejects executable and credential-bearing links while allowing original web sources', () => {
    expect(memoOriginalSourceUrl({ url: 'javascript:alert(1)' })).toBeNull();
    expect(memoOriginalSourceUrl({ url: 'https://owner:secret@example.org/report' })).toBeNull();
    expect(memoOriginalSourceUrl({ finalUrl: 'https://example.org/report', url: 'https://example.org/redirect' })).toBe('https://example.org/report');
  });
  it('never treats retrieved or missing source text as verified claim support', () => {
    expect(memoSourceStatus({ originalPassageStatus: 'retrieved' })).toContain('claim support needs review');
    expect(memoSourceStatus({ originalPassageStatus: 'unavailable' })).toContain('unavailable');
    expect(memoSourceStatus({ excerpt: 'Model summary' })).toContain('has not been verified');
  });
});
