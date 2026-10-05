import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { EnvHttpProxyAgent, fetch as proxyFetch } from 'undici';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { capture, digest, newId, reserve, SignalError } from './domain';
import { SIGNAL_COUNTRIES } from './geography';
import { signalStore, type SignalStore } from './store';
import type { CaptureInput, SignalDesk } from './schema';

let egressProxy: EnvHttpProxyAgent | undefined;
const MAX_BYTES = 1_000_000;
export function publicAddress(address: string): boolean {
  const a = address.toLowerCase().replace(/^\[|\]$/g, '');
  if (isIP(a) === 4) {
    const p = a.split('.').map(Number);
    return !(p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224 || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && (p[1] === 168 || (p[1] === 0 && (p[2] === 0 || p[2] === 2)) || (p[1] === 88 && p[2] === 99))) || (p[0] === 198 && (p[1] === 18 || p[1] === 19 || (p[1] === 51 && p[2] === 100))) || (p[0] === 203 && p[1] === 0 && p[2] === 113));
  }
  // Only global-unicast IPv6; reject mapped IPv4, local, multicast and transition ranges.
  return isIP(a) === 6 && /^[23]/.test(a) && !/^2001:(db8|0|2|10|20)(:|$)/.test(a) && !/^2002:/.test(a);
}
async function resolvePublicHost(hostname: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([lookup(hostname, { all: true }), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Collector DNS lookup timed out.')), 5000); })]); } finally { if (timer) clearTimeout(timer); }
}
export async function validatePublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || (url.port && !['443', '80'].includes(url.port)) || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) throw new SignalError(422, 'Collector URL must be a public HTTP(S) endpoint without credentials.');
  const addresses = isIP(hostname) ? [{ address: hostname }] : await resolvePublicHost(hostname);
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new SignalError(422, 'Collector address is not public.');
  return url;
}
async function pinnedRequest(url: URL, signal: AbortSignal): Promise<Response> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await resolvePublicHost(hostname);
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new SignalError(422, 'Collector address is not public.');
  const chosen = addresses[0];
  return new Promise((resolve, reject) => {
    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
      // Resolve once then connect to that checked address, retaining TLS server-name verification.
      lookup: (_host, options, callback) => { if (options.all) callback(null, [{ address: chosen.address, family: chosen.family }]); else callback(null, chosen.address, chosen.family); },
      headers: { Accept: 'application/json, application/rss+xml, application/atom+xml, application/xml, text/xml' },
      signal,
    }, response => {
      const chunks: Buffer[] = []; let size = 0;
      response.on('data', chunk => { size += chunk.length; if (size > MAX_BYTES) request.destroy(new Error('Collector response exceeds 1 MB.')); else chunks.push(chunk); });
      response.on('error', reject);
      response.on('end', () => { const headers = new Headers(); for (const [key, value] of Object.entries(response.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value); resolve(new Response(Buffer.concat(chunks), { status: response.statusCode || 502, headers })); });
    });
    request.on('error', reject); request.end();
  });
}
/** Redirects never follow automatically. The cloud egress proxy remains in use. */
export async function fetchSignalRepresentation(raw: string): Promise<{ text: string; contentType: string }> {
  let current = raw; const signal = AbortSignal.timeout(12_000);
  for (let redirect = 0; redirect <= 3; redirect++) {
    const url = await validatePublicUrl(current);
    const response = process.env.HTTPS_PROXY || process.env.HTTP_PROXY ? await proxyFetch(url, { dispatcher: egressProxy ||= new EnvHttpProxyAgent(), redirect: 'manual', signal, headers: { Accept: 'application/json, application/rss+xml, application/atom+xml, application/xml, text/xml' } }) : await pinnedRequest(url, signal);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (!location) throw new Error('Collector redirect has no destination.');
      current = new URL(location, url).toString(); continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Collector HTTP ${response.status}${response.headers.get('retry-after') ? '; retry after ' + response.headers.get('retry-after')!.slice(0, 80) : ''}`); }
    if (Number(response.headers.get('content-length')) > MAX_BYTES) { await response.body?.cancel(); throw new Error('Collector response exceeds 1 MB.'); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Collector response is empty.');
    const chunks: Uint8Array[] = []; let bytes = 0;
    try { while (true) { const r = await reader.read(); if (r.done) break; bytes += r.value.byteLength; if (bytes > MAX_BYTES) throw new Error('Collector response exceeds 1 MB.'); chunks.push(r.value); } } finally { await reader.cancel(); }
    return { text: Buffer.concat(chunks).toString('utf8'), contentType: response.headers.get('content-type') || '' };
  }
  throw new Error('Collector redirect limit reached.');
}
const array = (x: unknown): Record<string, unknown>[] => (Array.isArray(x) ? x : x ? [x] : []).filter(v => v && typeof v === 'object') as Record<string, unknown>[];
const str = (x: unknown) => typeof x === 'string' ? x : typeof x === 'number' ? String(x) : '';
const plain = (x: unknown) => str(x).replace(/<[^>]*>/g, '').trim();
export function parseSignalFeed(xml: string, language: string, rights: CaptureInput['rights']): { candidates: CaptureInput[]; saturated: boolean } {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')) || XMLValidator.validate(xml) !== true) throw new Error('Malformed or unsafe feed XML.');
  const doc = new XMLParser({ ignoreAttributes: false, processEntities: false }).parse(xml);
  if (!doc.rss?.channel && !doc.feed) throw new Error('Collector XML is not an RSS or Atom feed.');
  const items = array(doc.rss?.channel?.item || doc.feed?.entry);
  const candidates = items.slice(0, 20).flatMap(item => {
    const title = plain(item.title).slice(0, 240);
    const body = plain(item.description || item.summary || item.content || item['content:encoded']).slice(0, 16000);
    const links = array(item.link); const url = str(item.link) || str(links.find(l => !l['@_rel'] || l['@_rel'] === 'alternate')?.['@_href']);
    if (!title || !url || !/^https?:\/\//i.test(url)) return [];
    const date = str(item.pubDate || item.published); const stamp = date ? Date.parse(date) : NaN;
    return [{ title, text: body || title, url, language: str(item['dc:language']) || str(doc.rss?.channel?.language || doc.feed?.['@_xml:lang']) || language, kind: body ? 'original_text' as const : 'headline' as const, publicationTime: Number.isFinite(stamp) ? new Date(stamp).toISOString() : null, synthetic: false, rights }];
  });
  return { candidates, saturated: items.length > 20 };
}
export function gdeltQuery(desk: SignalDesk, query?: string): string {
  const terms = [query?.trim() || desk.name, ...desk.scope.countries.map(c => SIGNAL_COUNTRIES.find(x => x.code === c)?.name || '')].filter(Boolean);
  return terms.map(x => `"${x.replace(/["\\\r\n]/g, ' ').slice(0, 180)}"`).join(' ');
}
export async function collectSignalDesk(uid: string, deskId: string, expectedVersion: number | null, provider: 'gdelt' | 'rss', query?: string, store: SignalStore = signalStore, read = fetchSignalRepresentation): Promise<SignalDesk> {
  if (provider === 'gdelt' && process.env.SIGNAL_GDELT_ENABLED !== 'true') throw new SignalError(503, 'GDELT discovery is disabled pending a successful live provider check. Use supplied original text or permissioned RSS.');
  const now = new Date().toISOString(); const runId = newId();
  const desk = await store.mutate(uid, deskId, expectedVersion, d => {
    if (provider === 'gdelt' && !d.sourcePack.allowGdelt) throw new SignalError(422, 'Enable GDELT discovery in this source pack first.');
    if (provider === 'rss' && !d.sourcePack.feeds.some(f => f.allowCapture)) throw new SignalError(422, 'Configure at least one permissioned feed.');
    reserve(d, 'collections', now);
    if (d.runs.length >= 100) d.runs.splice(0, d.runs.length - 99);
    d.runs.push({ id: runId, provider, status: 'running', startedAt: now, count: 0, query: provider === 'gdelt' ? gdeltQuery(d, query) : 'configured permissioned source panel', inputHash: digest({ scope: d.scope, pack: d.sourcePack, windowDays: d.windowDays }) });
  });
  const candidates: CaptureInput[] = []; const errors: string[] = []; let saturated = false;
  try {
    if (provider === 'gdelt') {
      const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
      url.search = new URLSearchParams({ query: gdeltQuery(desk, query), mode: 'artlist', format: 'json', maxrecords: '20', timespan: `${Math.min(desk.windowDays, 7)}d`, sort: 'datedesc' }).toString();
      const response = await read(url.toString());
      if (!/json/i.test(response.contentType)) throw new Error('GDELT did not return JSON.');
      const data = JSON.parse(response.text); if (!Array.isArray(data.articles)) throw new Error('GDELT response has no article list.');
      saturated = data.articles.length >= 20;
      for (const a of data.articles.slice(0, 20)) if (typeof a.title === 'string' && a.title.trim() && typeof a.url === 'string' && /^https?:\/\//.test(a.url)) candidates.push({ title: a.title.slice(0, 240), text: a.title.slice(0, 240), url: a.url, language: str(a.language) || 'und', kind: 'headline', publicationTime: null, synthetic: false, rights: { basis: 'GDELT discovery metadata only; article rights unverified', allowExport: false } });
    } else for (const feed of desk.sourcePack.feeds.filter(f => f.allowCapture)) {
      try { const response = await read(feed.url); if (!/xml|rss|atom/i.test(response.contentType)) throw new Error('Feed MIME type is not XML.'); const parsed = parseSignalFeed(response.text, 'und', { basis: feed.basis, allowExport: feed.allowExport }); candidates.push(...parsed.candidates); saturated ||= parsed.saturated; } catch (e) { errors.push(e instanceof Error ? e.message : 'Feed collection failed.'); }
    }
  } catch (e) { errors.push(e instanceof Error ? e.message : 'Collection failed.'); }
  return store.mutate(uid, deskId, null, d => {
    const run = d.runs.find(r => r.id === runId); if (!run) throw new SignalError(409, 'Collection receipt is unavailable.');
    if (run.status === 'cancelled') { run.endedAt = new Date().toISOString(); return; }
    if (digest({ scope: d.scope, pack: d.sourcePack, windowDays: d.windowDays }) !== run.inputHash) { run.status = 'cancelled'; run.error = 'Source panel changed during collection.'; run.endedAt = new Date().toISOString(); return; }
    for (const candidate of candidates) { const languageNames = new Intl.DisplayNames(['en'], { type: 'language' }); const expected = d.languages.some(l => candidate.language.toLowerCase() === l.toLowerCase() || candidate.language.toLowerCase().startsWith(l.toLowerCase() + '-') || (() => { try { return languageNames.of(l)?.toLowerCase() === candidate.language.toLowerCase(); } catch { return false; } })()); if (!expected) errors.push(candidate.language === 'und' ? 'A source language is unknown; panel language coverage is incomplete.' : 'An acquired source is outside the requested language panel.'); try { capture(d, candidate, now); run.count++; } catch (e) { errors.push(e instanceof Error ? e.message : 'Capture failed.'); } }
    run.status = errors.length ? run.count ? 'partial' : 'failed' : saturated ? 'partial' : 'succeeded'; run.saturated = saturated; run.endedAt = new Date().toISOString();
    if (errors.length || saturated) run.error = [ ...errors, ...(saturated ? ['Bounded result list saturated; coverage is incomplete.'] : []) ].join('; ').slice(0, 1000);
  });
}
