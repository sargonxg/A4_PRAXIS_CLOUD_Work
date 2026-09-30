/**
 * Grounded Google Search research client for PRAXIS.
 *
 * Phase 1 removes premium search providers. This module intentionally exposes
 * one provider: Gemini with Google Search grounding.
 */

import { generateText } from 'ai';
import { getGroundedModel, getGoogleSearchTool } from '@/lib/ai/providers';
import { fetchOriginalSource, type OriginalSourceCapture } from '@/lib/ai/source-passage';
import {
  craftQueriesFromTemplate,
  getToolSourceHints,
  getToolTimeWindow,
  type CraftedQueries,
  type QueryContext,
} from '@/lib/ai/query-intelligence';

export interface GeneratedGroundingSegment {
  kind: 'generated-grounding-segment';
  text: string;
  sourceUrl: string;
  responseStart?: number;
  responseEnd?: number;
  /** Provider attribution is not an original-passage or factual-support check. */
  claimSupport: 'provider-attributed-unverified';
}

export interface WebResearchResult extends Partial<OriginalSourceCapture> {
  title: string;
  url: string;
  content: string;
  snippet?: string;
  source: string;
  provider: SearchProvider;
  publishedDate?: string;
  reliabilityScore: number;
  query?: string;
  retrievedAt?: string;
  isGroundedSummary?: boolean;
  generatedGroundingSegments?: GeneratedGroundingSegment[];
}

export type SearchProvider = 'google-search';

export interface WebResearchOptions {
  maxResults?: number;
  favoriteSources?: string[];
  excludedSources?: string[];
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  region?: string;
  includeContent?: boolean;
  toolId?: string;
  actors?: string[];
  description?: string;
  researchDepth?: 'light' | 'standard' | 'deep';
}

export type UserApiKeys = {
  google_ai_key?: string;
};

export const SEARCH_FAILURE_WARNING =
  'Generated without live web data. Verify all claims independently.';

const CACHE_TTL_MS = 15 * 60 * 1000;
const resultCache = new Map<string, { data: WebResearchResult[]; ts: number }>();

const SOURCE_SEARCH_TERMS: Record<string, string[]> = {
  reuters: ['site:reuters.com'],
  ap: ['site:apnews.com'],
  chathamhouse: ['site:chathamhouse.org'],
  bbc: ['site:bbc.com OR site:bbc.co.uk'],
  aljazeera: ['site:aljazeera.com'],
  guardian: ['site:theguardian.com'],
};

const HOST_RELIABILITY: Record<string, number> = {
  'reuters.com': 0.95,
  'apnews.com': 0.95,
  'bbc.com': 0.88,
  'bbc.co.uk': 0.88,
  'aljazeera.com': 0.85,
  'theguardian.com': 0.85,
};

function resultCacheKey(
  uid: string,
  query: string,
  situationName: string,
  options: WebResearchOptions,
): string {
  return JSON.stringify({
    uid,
    query,
    situationName,
    maxResults: options.maxResults ?? null,
    toolId: options.toolId ?? null,
    region: options.region ?? null,
    timeRange: options.timeRange ?? null,
    favoriteSources: [...(options.favoriteSources ?? [])].sort(),
    excludedSources: [...(options.excludedSources ?? [])].sort(),
    actors: [...(options.actors ?? [])].sort(),
    includeContent: options.includeContent ?? true,
    researchDepth: options.researchDepth ?? 'light',
  });
}

function hostnameFromUrl(url: string, fallback: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return fallback;
  }
}

function scoreUrl(url: string): number {
  return HOST_RELIABILITY[hostnameFromUrl(url, '')] ?? 0.60;
}

function timeRangeInstruction(timeRange: WebResearchOptions['timeRange']): string {
  switch (timeRange) {
    case 'day':
      return 'Prioritize developments from the past 24 hours.';
    case 'week':
      return 'Prioritize developments from the past 7 days.';
    case 'month':
      return 'Prioritize developments from the past 30 days.';
    case 'year':
      return 'Prioritize developments from the past 12 months.';
    default:
      return 'Prioritize recent, current, and dated reporting.';
  }
}

function queryLimit(depth: WebResearchOptions['researchDepth']): number {
  if (depth === 'deep') return 5;
  if (depth === 'standard') return 3;
  return 2;
}

function buildSourceFocusedQueries(baseQuery: string, favoriteSources: string[], maxQueries: number): string[] {
  const queries = [baseQuery];
  const siteTerms = favoriteSources.flatMap((source) => SOURCE_SEARCH_TERMS[source.toLowerCase()] ?? []);
  for (let i = 0; i < siteTerms.length; i += 4) {
    queries.push(`${baseQuery} (${siteTerms.slice(i, i + 4).join(' OR ')})`);
    if (queries.length >= maxQueries) break;
  }
  return queries.slice(0, maxQueries);
}

function getCached(key: string): WebResearchResult[] | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    resultCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: WebResearchResult[]) {
  resultCache.set(key, { data, ts: Date.now() });
  if (resultCache.size > 300) {
    const oldest = resultCache.keys().next().value;
    if (oldest) resultCache.delete(oldest);
  }
}

export async function getUserApiKeys(_uid: string): Promise<UserApiKeys> {
  return {};
}

async function searchGoogle(
  query: string,
  situationName: string,
  options: WebResearchOptions,
  budget: { remainingQueries: number; deadline: number },
): Promise<WebResearchResult[]> {
  const baseQuery = [
    `${query} ${situationName}`,
    options.region ? `${query} ${situationName} ${options.region}` : '',
    options.actors?.length ? `${query} ${situationName} ${options.actors.slice(0, 4).join(' ')}` : '',
  ].find((candidate) => candidate.trim()) ?? `${query} ${situationName}`;
  const queries = [
    ...buildSourceFocusedQueries(baseQuery, options.favoriteSources ?? [], 3),
    ...(options.actors ?? []).slice(0, 3).map((actor) => `${actor} ${situationName} latest statements actions constraints`),
  ].slice(0, queryLimit(options.researchDepth));

  const results: WebResearchResult[] = [];
  const retrievedAt = new Date().toISOString();
  for (const q of queries) {
    if (budget.remainingQueries <= 0 || Date.now() >= budget.deadline) break;
    budget.remainingQueries -= 1;
    try {
      const { text, sources, providerMetadata } = await generateText({
        model: getGroundedModel(),
        tools: { google_search: getGoogleSearchTool() },
        maxOutputTokens: 4096,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(Math.max(1, Math.min(45000, budget.deadline - Date.now()))),
        prompt: `Use Google Search grounding to research: ${q}

${timeRangeInstruction(options.timeRange)}
Prioritize checkable, authoritative sources: wire services, official institutions, court or legislative records, reputable local outlets, and established think tanks.

Return a concise research brief and a source receipts section. Do not invent URLs. If sources disagree, identify the disagreement.
Keep supplied or synthetic case facts separate from externally supported propositions. Institutional methods documents do not verify case allocations, expenditure, funding, deadlines or outcomes. Missing confirmation means unknown, not absent. Grounding attribution is generated prose, not a quotation from an original page.`,
      });

      if (text) {
        results.push({
          title: `Google Search: ${q.slice(0, 80)}`,
          url: `https://google.com/search?q=${encodeURIComponent(q)}`,
          content: text,
          snippet: text.slice(0, 300),
          source: 'Google Search (Gemini Grounded)',
          provider: 'google-search',
          reliabilityScore: 0.80,
          query: q,
          retrievedAt,
          isGroundedSummary: true,
          originalPassageStatus: 'not_requested',
          originalPassages: [],
        });
      }

      const supportedText = groundedTextBySource(providerMetadata);
      if (Array.isArray(sources)) {
        for (const src of sources as Array<{ url?: string; title?: string }>) {
          if (!src.url || !/^https?:\/\//i.test(src.url)) continue;
          const host = hostnameFromUrl(src.url, 'Google grounded source');
          results.push({
            title: src.title ?? host,
            url: src.url,
            content: '',
            snippet: '',
            generatedGroundingSegments: supportedText.get(src.url) ?? [],
            originalPassageStatus: 'not_requested',
            originalPassages: [],
            source: host,
            provider: 'google-search',
            reliabilityScore: scoreUrl(src.url),
            query: q,
            retrievedAt,
          });
        }
      }
    } catch (err) {
      console.warn('[web-research] Google Search failed for query:', q, err);
    }
  }
  return results;
}

// SDK metadata uses `vertex` for Vertex AI and `google` for AI Studio.
// A supported segment belongs only to the grounding chunks named by the provider;
// neither the query nor the whole generated overview is evidence for each source.
function groundedTextBySource(metadata: unknown): Map<string, GeneratedGroundingSegment[]> {
  const result = new Map<string, GeneratedGroundingSegment[]>();
  const record = (value: unknown): Record<string, unknown> => (
    value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  );
  const providers = record(metadata);
  for (const provider of ['vertex', 'google']) {
    const grounding = record(record(providers[provider]).groundingMetadata);
    const chunks = Array.isArray(grounding.groundingChunks) ? grounding.groundingChunks : [];
    const supports = Array.isArray(grounding.groundingSupports) ? grounding.groundingSupports : [];
    for (const value of supports) {
      const support = record(value);
      const segment = record(support.segment);
      const text = typeof segment.text === 'string' ? segment.text.trim() : '';
      if (!text) continue;
      for (const index of Array.isArray(support.groundingChunkIndices) ? support.groundingChunkIndices : []) {
        if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) continue;
        const uri = record(record(chunks[index]).web).uri;
        if (typeof uri !== 'string' || !/^https?:\/\//i.test(uri)) continue;
        const segments = result.get(uri) ?? [];
        if (!segments.some((value) => value.text === text)) segments.push({
          kind: 'generated-grounding-segment', text, sourceUrl: uri,
          responseStart: typeof segment.startIndex === 'number' ? segment.startIndex : undefined,
          responseEnd: typeof segment.endIndex === 'number' ? segment.endIndex : undefined,
          claimSupport: 'provider-attributed-unverified',
        });
        result.set(uri, segments);
      }
    }
  }
  return result;
}

export async function executeWebResearch(
  query: string,
  situationName: string,
  uid: string,
  options: WebResearchOptions = {},
): Promise<WebResearchResult[]> {
  let craftedQueries: CraftedQueries | null = null;
  if (options.toolId) {
    const qCtx: QueryContext = {
      toolId: options.toolId,
      situationName,
      country: options.region ?? '',
      actors: options.actors ?? [],
      description: options.description,
      favoriteSources: options.favoriteSources,
    };
    craftedQueries = craftQueriesFromTemplate(qCtx);
    options.timeRange ??= getToolTimeWindow(options.toolId);
    options.favoriteSources ??= getToolSourceHints(options.toolId);
  }

  const cacheKey = resultCacheKey(uid, query, situationName, options);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const primary = craftedQueries?.primary ?? query;
  const budget = { remainingQueries: 5, deadline: Date.now() + 60000 };
  const allResults = await searchGoogle(primary, situationName, options, budget);
  if (craftedQueries && options.researchDepth === 'deep') {
    for (const focused of craftedQueries.focused.slice(0, 2)) {
      allResults.push(...await searchGoogle(focused, situationName, options, budget));
    }
  }

  const seen = new Set<string>();
  const deduped = allResults.filter((result) => {
    const key = result.url.split('#')[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  const limited = deduped.slice(0, Math.max(1, Math.min(options.maxResults ?? 10, 20)));
  // At most five originals per research call; capture only after dedupe/ranking.
  const originals = limited.filter((result) => !result.isGroundedSummary).slice(0, 5);
  if (options.includeContent !== false) {
    await Promise.all(originals.map(async (result) => {
      const capture = await fetchOriginalSource(result.url);
      Object.assign(result, capture);
      result.content = capture.originalPassages.map((passage) => passage.text).join('\n');
      result.snippet = result.content.slice(0, 900);
    }));
    for (const result of limited.filter((result) => !result.isGroundedSummary && !originals.includes(result))) {
      result.originalPassageStatus = 'unavailable';
      result.unavailableReason = 'capture-budget-exhausted';
    }
  }
  setCache(cacheKey, limited);
  return limited;
}

export async function getAvailableProviders(_uid: string): Promise<{
  providers: Array<{
    id: SearchProvider;
    name: string;
    available: boolean;
    isDefault: boolean;
    note: string;
  }>;
}> {
  return {
    providers: [{
      id: 'google-search',
      name: 'Google Search (Gemini)',
      available: true,
      isDefault: true,
      note: 'Uses Gemini grounding',
    }],
  };
}
