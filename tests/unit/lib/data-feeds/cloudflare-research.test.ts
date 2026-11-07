import { afterEach, describe, expect, it, vi } from 'vitest';
import { readCloudflareResearch } from '@/lib/data-feeds/cloudflare-research';

const environment = {
  PRAXIS_RESEARCH_API_ORIGIN: 'https://private.example.test',
  PRAXIS_RESEARCH_ACCESS_CLIENT_ID: 'test-client',
  PRAXIS_RESEARCH_ACCESS_CLIENT_SECRET: 'test-secret',
};
const envelope = { api_version: 'policy-research-db/1', status: 'ready', backend: 'd1', read_only: true,
  snapshot: { id: 'a'.repeat(64), date_start: '2000-01-01', date_end: '2025-12-31' }, records: [],
  limitations: ['Historical observations, not a live feed.'] };
afterEach(() => vi.unstubAllGlobals());

describe('private research connection', () => {
  it('fails closed before networking when credentials are absent', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(readCloudflareResearch(new URLSearchParams(), {})).rejects.toMatchObject({ code: 'RESEARCH_UNCONFIGURED', status: 503 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['resource=../secrets', 'resource=events&country=SY&country=IQ', 'url=https://elsewhere.test', 'resource=status&limit=5'])('rejects unsafe paths/parameters: %s', async (query) => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(readCloudflareResearch(new URLSearchParams(query), environment)).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['http://private.example.test', 'https://user:pass@private.example.test', 'https://private.example.test/path', 'https://private.example.test/?secret=a'])('rejects invalid server origins: %s', async (origin) => {
    await expect(readCloudflareResearch(new URLSearchParams(), { ...environment, PRAXIS_RESEARCH_API_ORIGIN: origin })).rejects.toMatchObject({ code: 'RESEARCH_CONFIGURATION' });
  });
  it('preserves version, snapshot, limitations and source results while keeping credentials server-side', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(envelope)); vi.stubGlobal('fetch', fetch);
    const result = await readCloudflareResearch(new URLSearchParams('resource=events&country=SY&limit=5'), environment);
    expect(result).toEqual(envelope);
    const [url, options] = fetch.mock.calls[0];
    expect(String(url)).toBe('https://private.example.test/api/research/events?country=SY&limit=5');
    expect(options).toMatchObject({ method: 'GET', redirect: 'error', cache: 'no-store', headers: {
      'CF-Access-Client-Id': 'test-client', 'CF-Access-Client-Secret': 'test-secret' } });
    expect(JSON.stringify(result)).not.toContain('test-secret');
  });
  it('rejects Access login HTML, upstream diagnostic text and wrong data contracts', async () => {
    for (const response of [new Response('<html>Login</html>', { headers: { 'content-type': 'text/html' } }),
      new Response('private diagnostic with test-secret', { status: 403 }),
      Response.json({ ...envelope, backend: 'sqlite' }), Response.json({ ...envelope, read_only: false }),
      Response.json({ ...envelope, snapshot: {} })]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
      await expect(readCloudflareResearch(new URLSearchParams(), environment)).rejects.toMatchObject({ status: 503 });
    }
  });
  it('bounds streamed responses even without Content-Length', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(' '.repeat(2_000_001), { headers: { 'content-type': 'application/json' } })));
    await expect(readCloudflareResearch(new URLSearchParams(), environment)).rejects.toMatchObject({ code: 'RESEARCH_RESPONSE_LIMIT' });
  });
  it('sanitizes network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('test-secret private network diagnostic')));
    await expect(readCloudflareResearch(new URLSearchParams(), environment)).rejects.toMatchObject({ code: 'RESEARCH_UNREACHABLE', message: 'The private research service could not be reached.' });
  });
});
