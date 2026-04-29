/**
 * Feed Aggregator v2 — user-aware, tier-aware.
 *
 * Wraps the legacy `getSituationIntelligence` with:
 *   1. Per-user capability resolution so optional feeds can light up without
 *      changing the core open-source posture.
 *   2. A live feed-capability matrix attached to the response so callers
 *      can render accurate empty-states and "unlock" CTAs.
 *   3. Coverage-gap enumeration — every missing feed is surfaced with the
 *      reason and the link to unlock it.
 *
 * The v1 function `getSituationIntelligence` in `feed-aggregator.ts` is
 * preserved as-is to avoid rippling changes through every existing caller.
 * New callers should prefer this v2 path; callers that have a `uid` in hand
 * (all AI tool routes do) should migrate opportunistically.
 */

import { resolveFeedCapabilities, type FeedCapabilityMatrix } from './capabilities';
import { searchArticles, type GDELTArticle } from './gdelt-client';
import { searchReports, type RWReport } from './reliefweb-client';
import { countryNameToIso3, getDisplacement, getFoodSecurity, getFunding } from './hdx-client';
import { searchUNNews, type UNNewsItem } from './unnews-client';
import { getCurrentStability } from './gdelt-stability';
import { getGroundedSearchEvents } from './grounded-search-client';
import { getConflicts, type UCDPConflict } from './ucdp-client';
import {
  gdeltToIntel,
  ucdpToIntel,
  rwToIntel,
  unToIntel,
  groundedToIntel,
  type IntelligenceItem,
  type SituationIntelligence,
  type SourceHealth,
} from './feed-aggregator';

export interface UserAwareIntelligence extends SituationIntelligence {
  capabilities: FeedCapabilityMatrix;
  sourceHealth: SourceHealth[];
  coverageGaps: Array<{ provider: string; reason: string; unlockUrl: string | null }>;
}

export interface UserAwareOptions {
  uid: string | null;
  country: string;
  query?: string;
  dateStart?: string;
  limit?: number;
}

async function timed<T>(name: string, fn: () => Promise<T>): Promise<{ result: T | null; health: SourceHealth }> {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    const count = Array.isArray(result) ? result.length : result !== null ? 1 : 0;
    return {
      result,
      health: { name, available: result !== null, latencyMs: ms, recordCount: count, lastSuccess: result !== null ? new Date().toISOString() : null },
    };
  } catch (err) {
    return {
      result: null,
      health: { name, available: false, latencyMs: Date.now() - start, recordCount: 0, lastSuccess: null, error: err instanceof Error ? err.message : String(err) },
    };
  }
}

export async function getUserAwareIntelligence(opts: UserAwareOptions): Promise<UserAwareIntelligence> {
  const capabilities = await resolveFeedCapabilities(opts.uid);

  const iso3 = countryNameToIso3(opts.country);

  // Fan out open feeds. Grounded Google Search is the primary live-research
  // spine; structured public feeds corroborate and quantify what search finds.
  const [groundedR, gdeltR, ucdpR, rwR, displacementR, foodR, fundingR, stabilityR, unR] = await Promise.all([
    timed('grounded-search', () => getGroundedSearchEvents({ query: opts.query ?? opts.country, country: opts.country, limit: opts.limit ?? 12 })),
    timed('gdelt', () => searchArticles({ query: opts.query ?? opts.country, timespan: '7d', maxRecords: 20 })),
    timed('ucdp', () => getConflicts(opts.country)),
    timed('reliefweb', () => searchReports({ country: opts.country, limit: 10 })),
    iso3 ? timed('hdx-displacement', () => getDisplacement(iso3)) : Promise.resolve({ result: null, health: { name: 'hdx-displacement', available: false, latencyMs: 0, recordCount: 0, lastSuccess: null } as SourceHealth }),
    iso3 ? timed('hdx-food', () => getFoodSecurity(iso3)) : Promise.resolve({ result: null, health: { name: 'hdx-food', available: false, latencyMs: 0, recordCount: 0, lastSuccess: null } as SourceHealth }),
    iso3 ? timed('hdx-funding', () => getFunding(iso3)) : Promise.resolve({ result: null, health: { name: 'hdx-funding', available: false, latencyMs: 0, recordCount: 0, lastSuccess: null } as SourceHealth }),
    timed('gdelt-stability', () => getCurrentStability(opts.country.slice(0, 2).toUpperCase())),
    timed('unnews', () => searchUNNews(opts.query ?? opts.country, 8)),
  ]);

  const groundedEvents = (groundedR.result as Awaited<ReturnType<typeof getGroundedSearchEvents>> | null) ?? [];
  const gdeltArticles = (gdeltR.result as GDELTArticle[] | null) ?? [];
  const ucdpConflicts = (ucdpR.result as UCDPConflict[] | null) ?? [];
  const rwReports = (rwR.result as RWReport[] | null) ?? [];
  const unNews = (unR.result as UNNewsItem[] | null) ?? [];

  const items: IntelligenceItem[] = ([] as IntelligenceItem[]).concat(
    groundedEvents.map(groundedToIntel),
    gdeltArticles.map(gdeltToIntel),
    ucdpConflicts.map(ucdpToIntel),
    rwReports.map(rwToIntel),
    unNews.map(unToIntel),
  );

  const fallbackUsed = groundedEvents.length > 0 && gdeltArticles.length === 0 && ucdpConflicts.length === 0 && rwReports.length === 0 && unNews.length === 0;

  // Order: newest first, then by severity bucket
  const severityOrder: Record<IntelligenceItem['severity'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const d = new Date(b.date).getTime() - new Date(a.date).getTime();
    return d !== 0 ? d : severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Trust scoring (same path as v1)
  const { computeTrustworthiness } = await import('@/lib/analytics/trustworthiness-engine');
  const now = Date.now();
  const sourceMap: Record<string, string> = {
    event_feed: 'Open Event Feed', gdelt: 'GDELT', ucdp: 'UCDP', reliefweb: 'ReliefWeb', unnews: 'UN News', grounded_search: 'Google Search (Gemini Grounded)',
  };
  for (const item of items) {
    const days = item.date ? Math.max(0, Math.floor((now - new Date(item.date).getTime()) / 86400000)) : 30;
    item.trustScore = computeTrustworthiness({ sources: [sourceMap[item.source] ?? item.source], recencyDays: days });
  }

  // Coverage gaps — what is the user missing and how do they unlock it?
  const coverageGaps: Array<{ provider: string; reason: string; unlockUrl: string | null }> = [];
  for (const feed of capabilities.missingProviders) {
    coverageGaps.push({
      provider: feed.label,
      reason: 'Missing API key',
      unlockUrl: feed.signupUrl,
    });
  }
  return {
    events: items,
    totalCount: items.length,
    sources: {
      event_feed: 0,
      gdelt: gdeltArticles.length,
      ucdp: ucdpConflicts.length,
      reliefweb: rwReports.length,
      unnews: unNews.length,
      grounded_search: groundedEvents.length,
    },
    fallbackUsed,
    humanitarian: (displacementR.result || (foodR.result && Array.isArray(foodR.result) && foodR.result.length) || fundingR.result)
      ? {
          displacement: displacementR.result as { idps: number; refugees: number } | undefined,
          foodSecurity: (foodR.result as { phase: string; population: number; pct: number }[] | null) ?? undefined,
          funding: (fundingR.result as { required: number; funded: number; pct: number } | null) ?? undefined,
        }
      : undefined,
    stability: stabilityR.result ? { score: (stabilityR.result as { score: number }).score, trend: (stabilityR.result as { trend: 'improving' | 'stable' | 'worsening' }).trend } : undefined,
    fetchedAt: new Date().toISOString(),
    capabilities,
    sourceHealth: [groundedR.health, gdeltR.health, ucdpR.health, rwR.health, displacementR.health, foodR.health, fundingR.health, stabilityR.health, unR.health],
    coverageGaps,
  };
}
