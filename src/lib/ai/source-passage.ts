/** Server-only, bounded original-page capture. No model-produced text enters this module. */
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';

export type OriginalPassageStatus = 'retrieved' | 'unavailable' | 'not_requested';
export interface OriginalSourcePassage {
  text: string;
  /** Character offsets in captured extracted text, not HTML byte offsets or page numbers. */
  locator: string;
  retrievedAt: string;
  contentHash: string;
  claimSupport: 'unverified';
}
export interface OriginalSourceCapture {
  originalPassageStatus: OriginalPassageStatus;
  originalPassages: OriginalSourcePassage[];
  unavailableReason?: string;
  finalUrl?: string;
  publisher?: string;
  /** Host classification only. It does not verify any claim in a passage. */
  authority?: 'institutional' | 'publisher' | 'unknown';
  publishedDate?: string;
  truncated?: boolean;
}
interface SourceAddress { address: string; family: number }
export interface SourceRequestInput { url: URL; address: SourceAddress; timeoutMs: number }
interface SourceResponse { status: number; headers: Record<string, string | string[] | undefined>; body: string }
interface SourceTransport {
  resolve: (hostname: string) => Promise<SourceAddress[]>;
  request: (input: SourceRequestInput) => Promise<SourceResponse>;
}

const MAX_BYTES = 512 * 1024;
const MAX_TEXT_CHARS = 12000;
const TIME_BUDGET_MS = 8000;
const MAX_REDIRECTS = 3;

/** Conservative global-unicast policy; mapped/transition IPv6 is intentionally excluded. */
export function isPublicSourceAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99)))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) !== 6 || address.includes('.') || address.includes('%')) return false;
  const parts = address.toLowerCase().split('::');
  const left = parts[0].split(':').filter(Boolean);
  const right = (parts[1] ?? '').split(':').filter(Boolean);
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right].map((part) => parseInt(part, 16));
  const [first, second] = groups;
  // 2000::/3; exclude IETF protocol/transition and documentation ranges.
  return first >= 0x2000 && first <= 0x3fff
    && first !== 0x2002
    && !(first === 0x2001 && (second < 0x0200 || second === 0x0db8))
    && !(first === 0x3fff && second <= 0x0fff);
}

function safeUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('invalid-url'); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')
    || !host.includes('.') && !isIP(host) || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host)
    || (isIP(host) && !isPublicSourceAddress(host))) throw new Error('unsafe-url');
  url.hash = '';
  return url;
}

function bounded<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), Math.max(1, timeoutMs));
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

/** Connect to the vetted address while preserving original Host and TLS certificate validation.
 * Node lookup customization: https://nodejs.org/api/http.html#httprequestoptions-callback
 */
function requestPinned(input: SourceRequestInput): Promise<SourceResponse> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(input.url, {
      // Explicit family keeps Node's lookup callback in single-address mode on the pinned address.
      method: 'GET', agent: false, family: input.address.family,
      headers: { accept: 'text/html, text/plain, application/xhtml+xml', 'accept-encoding': 'identity', 'user-agent': 'PRAXIS-SourceCapture/1.0' },
      lookup: (_hostname, _options, callback) => callback(null, input.address.address, input.address.family),
    }, (res) => {
      const status = res.statusCode ?? 0;
      const headers = res.headers;
      if (status >= 300 && status < 400) { res.destroy(); resolve({ status, headers, body: '' }); return; }
      if (Number(headers['content-length'] ?? 0) > MAX_BYTES) { res.destroy(); reject(new Error('oversized')); return; }
      let size = 0;
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BYTES) { req.destroy(new Error('oversized')); return; }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({ status, headers, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    const timer = setTimeout(() => req.destroy(new Error('timeout')), input.timeoutMs);
    req.on('close', () => clearTimeout(timer));
    req.on('error', reject);
    req.end();
  });
}

const transport: SourceTransport = { resolve: (hostname) => lookup(hostname, { all: true, verbatim: true }), request: requestPinned };

function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key: string) => {
    if (!key.startsWith('#')) return named[key.toLowerCase()] ?? entity;
    const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : entity;
  });
}

function extractedBody(html: string): string {
  const body = /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i.exec(html)?.[1] ?? html;
  return decodeEntities(body
    .replace(/<(script|style|noscript|nav|header|footer|form|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|section|article|h[1-6])\s*>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' '))
    .split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

function publicationDate(html: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/(?:property|name)\s*=\s*["'](?:article:published_time|datePublished|date|dc.date)["']/i.test(tag)) continue;
    const value = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (value && /^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value) && !Number.isNaN(Date.parse(value))) return value;
  }
  return undefined;
}

function authorityFor(host: string): OriginalSourceCapture['authority'] {
  if (/\.(gov|gov\.[a-z]{2}|mil)$/.test(host)
    || ['un.org', 'oecd.org', 'worldbank.org', 'imf.org', 'europa.eu'].some((domain) => host === domain || host.endsWith(`.${domain}`))) return 'institutional';
  return 'publisher';
}

export async function fetchOriginalSource(value: string, dependencies: SourceTransport = transport): Promise<OriginalSourceCapture> {
  const deadline = Date.now() + TIME_BUDGET_MS;
  const visited = new Set<string>();
  let url: URL | undefined;
  try {
    url = safeUrl(value);
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      if (visited.has(url.href)) throw new Error('redirect-loop');
      visited.add(url.href);
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error('timeout');
      const host = url.hostname.replace(/^\[|\]$/g, '');
      const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await bounded(dependencies.resolve(host), remaining);
      if (!addresses.length || addresses.some(({ address }) => !isPublicSourceAddress(address))) throw new Error('unsafe-address');
      const address = addresses.find((candidate) => candidate.family === 4) ?? addresses[0];
      const response = await bounded(dependencies.request({ url, address, timeoutMs: Math.max(1, deadline - Date.now()) }), deadline - Date.now());
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.location;
        if (typeof location !== 'string' || hop === MAX_REDIRECTS) throw new Error('redirect-limit');
        url = safeUrl(new URL(location, url).href);
        continue;
      }
      if (response.status < 200 || response.status >= 300) throw new Error('http-error');
      const encoding = String(response.headers['content-encoding'] ?? 'identity').toLowerCase();
      if (encoding !== 'identity') throw new Error('unsupported-content-encoding');
      const contentType = String(response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (!['text/html', 'text/plain', 'application/xhtml+xml'].includes(contentType)) throw new Error('unsupported-content-type');
      if (Buffer.byteLength(response.body, 'utf8') > MAX_BYTES) throw new Error('oversized');
      const allText = contentType === 'text/plain' ? response.body.trim() : extractedBody(response.body);
      if (!allText.trim()) throw new Error('empty-original');
      const text = allText.slice(0, MAX_TEXT_CHARS);
      const publisher = host.replace(/^www\./, '');
      return {
        originalPassageStatus: 'retrieved', finalUrl: url.href, publisher, authority: authorityFor(publisher),
        publishedDate: contentType === 'text/plain' ? undefined : publicationDate(response.body), truncated: allText.length > text.length,
        originalPassages: [{ text, locator: `extracted-text:chars:0-${text.length}`, retrievedAt: new Date().toISOString(), contentHash: createHash('sha256').update(text).digest('hex'), claimSupport: 'unverified' }],
      };
    }
    throw new Error('redirect-limit');
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const known = ['invalid-url', 'unsafe-url', 'unsafe-address', 'timeout', 'redirect-loop', 'redirect-limit', 'http-error', 'unsupported-content-type', 'unsupported-content-encoding', 'oversized', 'empty-original'];
    return { originalPassageStatus: 'unavailable', originalPassages: [], unavailableReason: known.includes(reason) ? reason : 'fetch-failed', finalUrl: url?.href };
  }
}
