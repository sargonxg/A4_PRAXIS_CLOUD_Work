import type { FuseSourceOptions, SourceConnectorResult } from './types';

const TRACKING_PREFIXES = ['utm_', 'fbclid', 'gclid', 'mc_cid', 'mc_eid'];

export function fuseSourceResults(
  results: SourceConnectorResult[],
  options: FuseSourceOptions = {},
): SourceConnectorResult[] {
  const blocked = new Set((options.blockedDomains ?? []).map(normalizeDomain).filter(Boolean));
  const allowed = new Set((options.allowedDomains ?? []).map(normalizeDomain).filter(Boolean));
  const byKey = new Map<string, SourceConnectorResult>();

  for (const result of results) {
    const urlDomain = normalizeDomain(domainFromUrl(result.url));
    if (domainMatchesAny(urlDomain, blocked)) continue;
    if (allowed.size > 0 && urlDomain && !domainMatchesAny(urlDomain, allowed)) continue;

    const key = canonicalSourceKey(result.url, result.title);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...result, duplicates: result.duplicates ?? [] });
      continue;
    }

    const winner = compareResultRank(result, existing, options.trustRank) < 0 ? result : existing;
    const loser = winner === result ? existing : result;
    byKey.set(key, {
      ...winner,
      duplicates: Array.from(new Set([...(winner.duplicates ?? []), loser.id, ...(loser.duplicates ?? [])])),
    });
  }

  return Array.from(byKey.values())
    .sort((a, b) => compareResultRank(a, b, options.trustRank))
    .slice(0, Math.max(1, Math.min(100, options.limit ?? 20)));
}

export function canonicalSourceKey(url: string, title: string): string {
  const normalizedUrl = normalizeUrl(url);
  if (normalizedUrl) return normalizedUrl;
  return title.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 180);
}

function compareResultRank(
  a: SourceConnectorResult,
  b: SourceConnectorResult,
  mode: FuseSourceOptions['trustRank'] = 'balanced',
): number {
  if (mode === 'recency') {
    const recencyDelta = recencyScore(b) - recencyScore(a);
    if (recencyDelta !== 0) return recencyDelta;
  }

  const trustDelta = trustScore(b, mode) - trustScore(a, mode);
  if (trustDelta !== 0) return trustDelta;

  return recencyScore(b) - recencyScore(a);
}

function trustScore(result: SourceConnectorResult, mode: FuseSourceOptions['trustRank']): number {
  const base = Number.isFinite(result.trustScore) ? result.trustScore : 0.5;
  if (mode === 'strict') return base * 100;
  if (mode === 'recency') return base * 10;
  return base * 50 + recencyScore(result) * 0.5;
}

function recencyScore(result: SourceConnectorResult): number {
  const date = Date.parse(result.publishedAt ?? result.retrievedAt ?? '');
  if (!Number.isFinite(date)) return 0;
  return Math.floor(date / 86_400_000);
}

function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = '';
    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix))) {
        url.searchParams.delete(key);
      }
    }
    url.hostname = normalizeDomain(url.hostname);
    url.pathname = url.pathname.replace(/\/+$/g, '');
    return url.toString().replace(/^https?:\/\/www\./, 'https://');
  } catch {
    return '';
  }
}

function domainFromUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.hostname;
  } catch {
    return '';
  }
}

function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^www\./, '');
}

function domainMatchesAny(domain: string, candidates: Set<string>): boolean {
  if (!domain) return false;
  for (const candidate of candidates) {
    if (domain === candidate || domain.endsWith(`.${candidate}`)) return true;
  }
  return false;
}
