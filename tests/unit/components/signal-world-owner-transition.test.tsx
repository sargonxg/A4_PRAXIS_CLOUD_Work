import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalWorldExplorer } from '@/components/signal/signal-world-explorer';
import { SignalWorldLandscape } from '@/components/signal/signal-world-landscape';
import { SignalWorldChat } from '@/components/signal/signal-world-chat';
import type { SignalWorldSnapshot } from '@/lib/signal/world-schema';

const runtime = vi.hoisted(() => ({ cursor: 0, hooks: new Map<number, unknown>(), pending: [] as Array<() => void> }));
vi.mock('react', async original => {
  const react = await original<typeof import('react')>();
  const same = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  return { ...react,
    useState: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, typeof initial === 'function' ? (initial as () => unknown)() : initial); return [runtime.hooks.get(key), (value: unknown) => runtime.hooks.set(key, typeof value === 'function' ? (value as (previous: unknown) => unknown)(runtime.hooks.get(key)) : value)]; },
    useRef: (initial: unknown) => { const key = runtime.cursor++; if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial }); return runtime.hooks.get(key); },
    useCallback: (callback: unknown, deps: unknown[]) => { const key = runtime.cursor++; const previous = runtime.hooks.get(key) as { deps: unknown[]; callback: unknown } | undefined; if (previous && same(previous.deps, deps)) return previous.callback; runtime.hooks.set(key, { deps, callback }); return callback; },
    useMemo: (factory: () => unknown, deps: unknown[]) => { const key = runtime.cursor++; const previous = runtime.hooks.get(key) as { deps: unknown[]; value: unknown } | undefined; if (previous && same(previous.deps, deps)) return previous.value; const value = factory(); runtime.hooks.set(key, { deps, value }); return value; },
    useEffect: (effect: () => void | (() => void), deps: unknown[]) => { const key = runtime.cursor++; const previous = runtime.hooks.get(key) as { deps: unknown[]; cleanup?: () => void } | undefined; if (!previous || !same(previous.deps, deps)) { const next = { deps, cleanup: undefined as (() => void) | undefined }; runtime.hooks.set(key, next); runtime.pending.push(() => { previous?.cleanup?.(); next.cleanup = effect() || undefined; }); } },
  };
});
vi.mock('next/dynamic', () => ({ default: () => () => null }));
type Element = ReactElement<Record<string, unknown>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); return isValidElement<Record<string, unknown>>(node) ? [node, ...elements(node.props.children as ReactNode)] : []; }
function text(node: ReactNode): string { if (typeof node === 'string' || typeof node === 'number') return String(node); if (Array.isArray(node)) return node.map(text).join(' '); return isValidElement<Record<string, unknown>>(node) ? text(node.props.children as ReactNode) : ''; }
function explorer(owner = 'owner-a') { runtime.cursor = 0; return SignalWorldExplorer({ ownerKey: owner }); }
function chat(owner = 'owner-a', countryCode = 'BR') { runtime.cursor = 0; return SignalWorldChat({ ownerKey: owner, countryCode, countryName: 'Brazil' }); }
async function settle() { for (let i = 0; i < 48; i++) await Promise.resolve(); }
async function flush() { for (const effect of runtime.pending.splice(0)) effect(); await settle(); }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
function snapshot(label: string): SignalWorldSnapshot { return { catalogVersion: 'unit-owned-snapshot', inputDigest: label, updatedAt: '2026-10-05T12:00:00Z', refresh: { window: 'unit', status: 'partial', attemptedAt: '2026-10-05T12:00:00Z' }, limitations: [], countries: [{ code: 'BR', worldBankCode: 'BRA', name: label, region: 'Americas', conflictTags: [], governmentPortals: [], mediaOrganizations: [], feedIds: [], headlines: [], providers: [], topics: [], metrics: [{ indicator: 'fixture', label: 'Retained published indicator', unit: 'unit', value: 123, year: 2024, status: 'failed', providerUrl: 'https://example.org/owned-unit-fixture', retrievedAt: '2026-10-01T12:00:00Z', license: 'Owned synthetic unit fixture' }] }] }; }
beforeEach(() => { runtime.cursor = 0; runtime.hooks.clear(); runtime.pending = []; vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { for (const hook of runtime.hooks.values()) if (hook && typeof hook === 'object' && 'cleanup' in hook) (hook as { cleanup?: () => void }).cleanup?.(); vi.unstubAllGlobals(); });

describe('world explorer owner privacy and observable provenance', () => {
  it('masks the old snapshot synchronously and ignores its delayed owner response', async () => {
    const late = deferred<Response>(); vi.mocked(fetch).mockImplementationOnce(() => late.promise).mockResolvedValueOnce(Response.json({ world: snapshot('Owner B current panel') }));
    explorer(); await flush(); expect(text(explorer('owner-b'))).not.toContain('Owner A'); await flush(); expect(text(explorer('owner-b'))).toContain('Owner B current panel');
    late.resolve(Response.json({ world: snapshot('Owner A delayed panel') })); await settle(); expect(text(explorer('owner-b'))).toContain('Owner B current panel'); expect(text(explorer('owner-b'))).not.toContain('Owner A');
  });
  it('hides an already loaded owner snapshot before transition effects run', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ world: snapshot('Owner A loaded panel') })); explorer(); await flush(); expect(text(explorer())).toContain('Owner A loaded panel'); expect(text(explorer('owner-b'))).not.toContain('Owner A loaded panel');
  });
  it('preserves the provider statistical entity separately from the app country label', async () => {
    const value = snapshot('Palestine'); const country = value.countries[0]; country.code = 'PS'; country.worldBankCode = 'PSE'; country.metrics[0].providerCountryName = 'West Bank and Gaza'; country.metrics[0].providerCountryCode = 'PS';
    vi.mocked(fetch).mockResolvedValue(Response.json({ world: value })); explorer(); await flush(); let tree = explorer(); (elements(tree).find(node => node.props['aria-label'] === 'World country selector')!.props.onChange as (event: unknown) => void)({ target: { value: 'PS' } }); tree = explorer(); (elements(tree).find(node => node.type === 'button' && text(node) === 'Economic context')!.props.onClick as () => void)(); expect(text(explorer())).toMatch(/Provider statistical entity:\s+West Bank and Gaza/); expect(text(explorer())).toContain('Palestine');
  });
  it('shows retained economic values as stale and never triggers AI on selection', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ world: snapshot('Brazil fixture') })); explorer(); await flush(); let tree = explorer(); const select = elements(tree).find(node => node.props['aria-label'] === 'World country selector')!; (select.props.onChange as (event: unknown) => void)({ target: { value: 'BR' } }); tree = explorer();
    const economy = elements(tree).find(node => node.type === 'button' && text(node) === 'Economic context')!; (economy.props.onClick as () => void)(); tree = explorer(); expect(text(tree)).toContain('123'); expect(text(tree)).toContain('Retained last-known value'); expect(text(tree)).toMatch(/current retrieval\s+failed/); expect(text(tree)).toContain('2024'); expect(vi.mocked(fetch).mock.calls.every(([url]) => url === '/api/signal/world')).toBe(true);
  });
});


describe('world headline provenance and graph counts', () => {
  it('distinguishes older dated topic matches from unknown publication dates', async () => {
    const value = snapshot('Brazil fixture'); const country = value.countries[0]; country.headlines = [{ id: 'older-source', feedId: 'owned-unit-feed', title: 'Owned older economic title', url: 'https://example.org/owned-older', publishedAt: '2025-01-01T00:00:00Z', retrievedAt: '2026-10-05T12:00:00Z', language: 'en', countryCode: 'BR', countryAssignment: 'curated-feed' }]; country.topics = [{ id: 'owned-topic', label: 'Owned older topic', currentCount: 0, previousCount: null, comparisonAvailable: false, headlineIds: ['older-source'], currentHeadlineIds: [], previousHeadlineIds: [], unknownDateCount: 0, windowStart: '2026-10-04T12:00:00Z', windowEnd: '2026-10-05T12:00:00Z', previousWindowStart: '2026-10-03T12:00:00Z', limitation: 'Owned synthetic unit fixture' }];
    vi.mocked(fetch).mockResolvedValue(Response.json({ world: value })); explorer(); await flush(); let tree = explorer(); (elements(tree).find(node => node.props['aria-label'] === 'World country selector')!.props.onChange as (event: unknown) => void)({ target: { value: 'BR' } }); tree = explorer(); (elements(tree).find(node => node.type === 'button' && text(node).includes('Owned older topic'))!.props.onClick as () => void)(); tree = explorer(); expect(text(tree)).toContain('outside comparison windows'); expect(text(tree)).not.toContain('publication date unknown');
  });
  it('deduplicates graph records, excludes other countries and drills down exact supporting titles', () => {
    const country = snapshot('Brazil fixture').countries[0]; const record = { id: 'owned-graph-source', feedId: 'owned-unit-feed', title: 'Owned exact graph title', url: 'https://example.org/owned-exact', publishedAt: null, retrievedAt: '2026-10-05T12:00:00Z', language: 'en', countryCode: 'BR', countryAssignment: 'curated-feed' as const }; country.headlines = [record, record, { ...record, id: 'other-country', countryCode: 'JP' }]; country.topics = [{ id: 'owned-topic', label: 'Owned topic', currentCount: 99, previousCount: null, comparisonAvailable: false, headlineIds: [record.id, 'other-country', 'missing-archived-id'], currentHeadlineIds: [], previousHeadlineIds: [], unknownDateCount: 1, windowStart: '2026-10-04T12:00:00Z', windowEnd: '2026-10-05T12:00:00Z', previousWindowStart: '2026-10-03T12:00:00Z', limitation: 'Owned synthetic unit fixture' }];
    const renderGraph = () => { runtime.cursor = 0; return SignalWorldLandscape({ country }); }; let tree = renderGraph(); expect(text(tree)).toMatch(/1\s+unique headline records/); expect(text(tree)).not.toContain('99'); const feed = elements(tree).find(node => node.type === 'button' && text(node).includes('owned-unit-feed'))!; (feed.props.onClick as () => void)(); tree = renderGraph(); expect(elements(tree).find(node => node.type === 'a' && text(node) === record.title)?.props.href).toBe(record.url); expect(text(tree)).not.toContain('other-country');
  });

});

describe('world chat owner and country fencing', () => {
  it('clears a previous owner question before effects and ignores a late model answer', async () => {
    const late = deferred<Response>(); vi.mocked(fetch).mockImplementation(() => late.promise); chat(); await flush(); let tree = chat(); const input = elements(tree).find(node => node.type === 'textarea')!; (input.props.onChange as (event: unknown) => void)({ target: { value: 'Owner A confidential research question' } }); tree = chat(); const form = elements(tree).find(node => node.type === 'form')!; const pending = (form.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault() {} }); expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    tree = chat('owner-b'); expect(elements(tree).find(node => node.type === 'textarea')!.props.value).toBe(''); expect(text(tree)).not.toContain('Owner A'); await flush(); late.resolve(Response.json({ answer: 'Owner A delayed confidential answer', sources: [] })); await pending; expect(text(chat('owner-b'))).not.toContain('Owner A');
  });
  it('does not call AI during load or country change and masks a prior country draft', async () => {
    let tree = chat(); await flush(); (elements(tree).find(node => node.type === 'textarea')!.props.onChange as (event: unknown) => void)({ target: { value: 'Country specific confidential draft' } }); tree = chat('owner-a', 'JP'); expect(elements(tree).find(node => node.type === 'textarea')!.props.value).toBe(''); await flush(); expect(fetch).not.toHaveBeenCalled();
  });
});
