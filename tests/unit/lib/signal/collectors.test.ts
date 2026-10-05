import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { collectSignalDesk, fetchSignalRepresentation, gdeltQuery, parseSignalFeed, publicAddress, validatePublicUrl } from '@/lib/signal/collectors';
import { memorySignalStore } from '@/lib/signal/store';
vi.mock('undici', () => ({ EnvHttpProxyAgent: class {}, fetch: (...args: Parameters<typeof fetch>) => fetch(...args) }));
vi.mock('node:dns/promises', () => ({ lookup: vi.fn(async () => [{ address: '8.8.8.8', family: 4 }]) }));
beforeEach(() => vi.stubEnv('SIGNAL_GDELT_ENABLED', 'true'));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const input = { name: 'Ceasefire', question: 'What is reported?', audience: 'Analyst', scope: { kind: 'country', label: 'Ukraine', countries: ['UA'] }, languages: ['en'], sourcePack: { id: 'pilot', version: 1, allowGdelt: true, feeds: [] } };
describe('bounded SIGNAL collectors', () => {
  it('gates unavailable discovery before consuming allowance or creating receipts', async () => {
    vi.stubEnv('SIGNAL_GDELT_ENABLED', 'false'); const store = memorySignalStore(); const desk = await store.create('alice', input);
    await expect(collectSignalDesk('alice', desk.id, null, 'gdelt', undefined, store)).rejects.toThrow('disabled');
    const retained = await store.get('alice', desk.id); expect(retained.usage.collections).toBe(0); expect(retained.runs).toHaveLength(0);
  });
  it('rejects private, transition and mapped addresses', async () => {
    for (const ip of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '100.64.0.1', '192.0.2.1', '198.51.100.1', '203.0.113.1', '::1', '::ffff:127.0.0.1', '::ffff:7f00:1', 'fc00::1', '2001:db8::1', '2002:7f00::1']) expect(publicAddress(ip)).toBe(false);
    expect(publicAddress('8.8.8.8')).toBe(true); expect(publicAddress('192.0.66.108')).toBe(true); expect(publicAddress('2606:4700:4700::1111')).toBe(true);
    await expect(validatePublicUrl('http://127.0.0.1/latest/meta-data')).rejects.toThrow('not public');
    await expect(validatePublicUrl('https://user:pass@example.com')).rejects.toThrow('without credentials');
  });
  it('blocks redirect SSRF and bounded-body responses through the environment proxy', async () => {
    vi.stubEnv('HTTPS_PROXY', 'http://proxy:8080');
    const mock = vi.fn().mockResolvedValue(new Response('', { status: 302, headers: { location: 'http://169.254.169.254/token' } })); vi.stubGlobal('fetch', mock);
    await expect(fetchSignalRepresentation('https://example.com/feed')).rejects.toThrow('not public'); expect(mock).toHaveBeenCalledTimes(1);
    mock.mockResolvedValue(new Response('x', { headers: { 'content-length': '1000001' } })); await expect(fetchSignalRepresentation('https://example.com/feed')).rejects.toThrow('1 MB');
    mock.mockResolvedValue(new Response('', { status: 503 })); await expect(fetchSignalRepresentation('https://example.com/feed')).rejects.toThrow('503');
  });
  it('parses RSS and Atom with explicit rights and unknown clocks; denies XML entities', () => {
    const rights = { basis: 'Owned publisher feed', allowExport: false };
    const parsed = parseSignalFeed('<rss><channel><item><title>Update</title><link>https://example.com/a</link><description>Source text</description><pubDate>bad</pubDate></item></channel></rss>', 'en', rights);
    expect(parsed.candidates[0]).toMatchObject({ text: 'Source text', publicationTime: null, rights, kind: 'original_text' });
    expect(parseSignalFeed('<feed><entry><title>Changed only</title><link href="https://example.com/b"/><updated>2026-10-05T00:00:00Z</updated></entry></feed>', 'en', rights).candidates[0].publicationTime).toBeNull();
    expect(parseSignalFeed('<feed><entry><title>Headline</title><link href="https://example.com/a"/></entry></feed>', 'en', rights).candidates[0].kind).toBe('headline');
    expect(parseSignalFeed('<rss><channel><item><title>Update</title><link>https://example.com/a</link><description><![CDATA[<!DOCTYPE html><p>Text</p>]]></description></item></channel></rss>', 'en', rights).candidates[0].text).toBe('Text');
    expect(() => parseSignalFeed('<!DOCTYPE a [<!ENTITY b "xx">]><a>&b;</a>', 'en', rights)).toThrow();
  });
  it('persists failure receipts and retains prior evidence on throttle', async () => {
    const store = memorySignalStore(); const d = await store.create('alice', input);
    const failed = await collectSignalDesk('alice', d.id, d.version, 'gdelt', undefined, store, async () => { throw new Error('Collector HTTP 429; retry after 60'); });
    expect(failed.runs[0]).toMatchObject({ status: 'failed', count: 0 }); expect(failed.runs[0].error).toContain('429'); expect(failed.usage.collections).toBe(1);
    await expect(store.get('bob', d.id)).rejects.toThrow();
  });
  it('keeps discovery as headlines, deduplicates retry revisions, flags saturation and uses country names', async () => {
    const store = memorySignalStore(); const d = await store.create('alice', input);
    expect(gdeltQuery(d)).toContain('"Ukraine"'); expect(gdeltQuery(d)).not.toContain('sourcecountry:UA');
    const read = async () => ({ contentType: 'application/json', text: JSON.stringify({ articles: Array.from({ length: 20 }, () => ({ title: 'Update', url: 'https://example.com/a', seendate: '20261005T000000Z', language: 'English' })) }) });
    const once = await collectSignalDesk('alice', d.id, d.version, 'gdelt', undefined, store, read);
    const twice = await collectSignalDesk('alice', d.id, once.version, 'gdelt', undefined, store, read);
    expect(twice.sources).toHaveLength(1); expect(twice.sources[0]).toMatchObject({ kind: 'headline', publicationTime: null }); expect(twice.claims).toHaveLength(0); expect(twice.runs[0]).toMatchObject({ saturated: true, status: 'partial' });
  });
  it('preserves edited feed revisions and prior evidence after a later network failure', async () => {
    const store = memorySignalStore(); const d = await store.create('alice', { ...input, sourcePack: { id: 'feed', version: 1, allowGdelt: false, feeds: [{ url: 'https://example.com/feed', allowCapture: true, basis: 'Owned source', allowExport: false }] } });
    const feed = (text: string) => async () => ({ contentType: 'application/rss+xml', text: `<rss><channel><item><title>Update</title><link>https://example.com/a</link><description>${text}</description></item></channel></rss>` });
    await collectSignalDesk('alice', d.id, null, 'rss', undefined, store, feed('Original'));
    await collectSignalDesk('alice', d.id, null, 'rss', undefined, store, feed('Edited'));
    const failed = await collectSignalDesk('alice', d.id, null, 'rss', undefined, store, async () => { throw new Error('timeout'); });
    expect(failed.sources).toHaveLength(2); expect(failed.sources[1].supersedes).toBe(failed.sources[0].id); expect(failed.runs.at(-1)?.status).toBe('failed');
  });
  it('cancels stale-panel results after a durable receipt is written', async () => {
    const store = memorySignalStore(); const d = await store.create('alice', input);
    const result = await collectSignalDesk('alice', d.id, null, 'gdelt', undefined, store, async () => { expect((await store.get('alice', d.id)).runs[0].status).toBe('running'); await store.mutate('alice', d.id, null, desk => { desk.sourcePack.version++; }); return { contentType: 'application/json', text: JSON.stringify({ articles: [{ title: 'Update', url: 'https://example.com/a' }] }) }; });
    expect(result.runs[0].status).toBe('cancelled'); expect(result.sources).toHaveLength(0);
  });
  it('requires explicit GDELT permission and permissioned feeds', async () => {
    const store = memorySignalStore(); const d = await store.create('alice', { ...input, sourcePack: { id: 'off', version: 1, allowGdelt: false, feeds: [] } });
    await expect(collectSignalDesk('alice', d.id, d.version, 'gdelt', undefined, store)).rejects.toThrow('Enable GDELT');
    await expect(collectSignalDesk('alice', d.id, d.version, 'rss', undefined, store)).rejects.toThrow('permissioned feed');
  });
});
