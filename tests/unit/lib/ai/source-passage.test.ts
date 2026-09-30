import { describe, expect, it, vi } from 'vitest';
import { fetchOriginalSource, isPublicSourceAddress, type SourceRequestInput } from '@/lib/ai/source-passage';

describe('bounded original source retrieval', () => {
  it.each(['127.0.0.1', '10.0.0.1', '169.254.169.254', '100.64.0.1', '192.168.1.1', '::1', '::ffff:8.8.8.8', '2001:db8::1', '2002:7f00:1::'])('rejects non-public or transition address %s', (address) => {
    expect(isPublicSourceAddress(address)).toBe(false);
  });
  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('accepts public address %s', (address) => {
    expect(isPublicSourceAddress(address)).toBe(true);
  });
  it('rejects private DNS answers before any connection', async () => {
    const request = vi.fn();
    const result = await fetchOriginalSource('https://example.org/a', { resolve: async () => [{ address: '10.0.0.1', family: 4 }], request });
    expect(result.originalPassageStatus).toBe('unavailable');
    expect(result.unavailableReason).toBe('unsafe-address');
    expect(request).not.toHaveBeenCalled();
  });
  it('checks every redirect and pins the vetted address for the connection', async () => {
    const request = vi.fn(async (_input: SourceRequestInput) => ({ status: 302, headers: { location: 'https://metadata.example.net/latest' }, body: '' }));
    const resolve = vi.fn(async (host: string) => [{ address: host === 'example.org' ? '8.8.8.8' : '169.254.169.254', family: 4 }]);
    const result = await fetchOriginalSource('https://example.org/a', { resolve, request });
    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][0].address).toEqual({ address: '8.8.8.8', family: 4 });
    expect(result.unavailableReason).toBe('unsafe-address');
  });
  it.each(['http://example.org/a', 'https://user:secret@example.org/a', 'https://localhost/a', 'https://example.org:8443/a'])('rejects unsafe URL %s', async (url) => {
    const resolve = vi.fn();
    const request = vi.fn();
    expect((await fetchOriginalSource(url, { resolve, request })).originalPassageStatus).toBe('unavailable');
    expect(request).not.toHaveBeenCalled();
  });
  it('retains real body passages with publisher, date, final URL and explicit extracted-text locators', async () => {
    const result = await fetchOriginalSource('https://www.gao.gov/report', {
      resolve: async () => [{ address: '8.8.8.8', family: 4 }],
      request: async () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: '<html><head><meta property="article:published_time" content="2026-09-01"><script>fake</script></head><body><nav>menu</nav><p>Allocation authorizes funds &amp; does not establish expenditure.</p><p>Funding is unconfirmed.</p></body></html>' }),
    });
    expect(result.originalPassageStatus).toBe('retrieved');
    expect(result.authority).toBe('institutional');
    expect(result.publisher).toBe('gao.gov');
    expect(result.publishedDate).toBe('2026-09-01');
    expect(result.originalPassages[0].text).toContain('Allocation authorizes funds & does not establish expenditure.');
    expect(result.originalPassages[0].locator).toContain('extracted-text:chars:0-');
    expect(result.originalPassages[0].text).not.toContain('fake');
    expect(result.originalPassages[0].claimSupport).toBe('unverified');
  });
  it.each([
    { status: 404, headers: { 'content-type': 'text/html' }, body: 'not found' },
    { status: 200, headers: { 'content-type': 'application/pdf' }, body: '%PDF-' },
    { status: 200, headers: { 'content-type': 'text/html', 'content-encoding': 'gzip' }, body: 'compressed data' },
    { status: 200, headers: { 'content-type': 'text/plain' }, body: 'x'.repeat(512 * 1024 + 1) },
  ])('does not substitute unavailable, binary or oversized text', async (response) => {
    const result = await fetchOriginalSource('https://example.org/a', { resolve: async () => [{ address: '8.8.8.8', family: 4 }], request: async () => response });
    expect(result.originalPassageStatus).toBe('unavailable');
    expect(result.originalPassages).toEqual([]);
  });
  it('bounds DNS waiting and reports unavailable without opening a connection', async () => {
    vi.useFakeTimers();
    try {
      const request = vi.fn();
      const pending = fetchOriginalSource('https://example.org/a', { resolve: () => new Promise(() => {}), request });
      await vi.advanceTimersByTimeAsync(8001);
      expect((await pending).unavailableReason).toBe('timeout');
      expect(request).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it('marks captured text truncation without fabricating page or HTML offsets', async () => {
    const result = await fetchOriginalSource('https://example.org/a', { resolve: async () => [{ address: '8.8.8.8', family: 4 }], request: async () => ({ status: 200, headers: { 'content-type': 'text/plain' }, body: 'A'.repeat(15000) }) });
    expect(result.truncated).toBe(true);
    expect(result.originalPassages[0].text).toHaveLength(12000);
    expect(result.originalPassages[0].locator).toBe('extracted-text:chars:0-12000');
  });
  it('does not infer authority from an institutional-looking subdomain', async () => {
    const result = await fetchOriginalSource('https://gao.gov.example.org/a', { resolve: async () => [{ address: '8.8.8.8', family: 4 }], request: async () => ({ status: 200, headers: { 'content-type': 'text/plain' }, body: 'Provided text.' }) });
    expect(result.authority).toBe('publisher');
  });
});
