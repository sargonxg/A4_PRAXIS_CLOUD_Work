/**
 * Unified Web Research Client for PRAXIS
 *
 * Abstracts multiple search providers into a single interface:
 *   1. Google Search (via Gemini grounding) — ALWAYS available, default
 *   2. Tavily — premium, requires user API key
 *   3. Parallel.ai — premium, requires user API key
 *   4. Firecrawl — premium, requires user API key (legacy)
 *
 * Priority: Google Search first (free, always available), then premium
 * providers in parallel for richer results.
 *
 * User favorite sources from onboarding are woven into search queries
 * to focus results on trusted outlets (e.g., Reuters, Crisis Group, UN).
 */

import { generateText } from 'ai';
import { getGroundedModel } from '@/lib/ai/providers';
import { adminDb } from '@/lib/firebase/admin';
import {
  craftQueriesFromTemplate,
  getToolTimeWindow,
  getToolSourceHints,
  type QueryContext,
  type CraftedQueries,
} from '@/lib/ai/query-intelligence';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebResearchResult {
  title: string;
  url: string;
  content: string;         // Full text or excerpt
  snippet?: string;        // Short excerpt
  source: string;          // Hostname or provider name
  provider: SearchProvider;
  publishedDate?: string;
  reliabilityScore: number; // 0-1
  query?: string;           // Search query that produced the record
  retrievedAt?: string;     // ISO timestamp for provenance/debugging
  isGroundedSummary?: boolean;
}

export type SearchProvider = 'google-search' | 'tavily' | 'parallel' | 'firecrawl';

export interface WebResearchOptions {
  maxResults?: number;
  favoriteSources?: string[];  // User's preferred sources to focus on
  excludedSources?: string[];
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  region?: string;            // Geographic focus
  includeContent?: boolean;   // Fetch full page content (slower)
  toolId?: string;            // Tool requesting research (for query intelligence)
  actors?: string[];          // Key actors for actor-specific queries
  description?: string;       // Situation description for AI query crafting
}

export interface UserApiKeys {
  google_ai_key?: string;
  anthropic_key?: string;
  openai_key?: string;
  firecrawl_key?: string;
  tavily_key?: string;
  parallel_key?: string;
}

interface ResearchContext {
  query: string;
  situationName: string;
  country?: string;
  options: WebResearchOptions;
  userKeys: UserApiKeys;
}

// ---------------------------------------------------------------------------
// Source-to-search-term mapping (connects user favorites to queries)
// ---------------------------------------------------------------------------

const SOURCE_SEARCH_TERMS: Record<string, string[]> = {
  // Wire services
  reuters: ['site:reuters.com'],
  ap: ['site:apnews.com'],
  afp: ['site:france24.com OR site:barrons.com'],

  // Think tanks & analysis
  crisisgroup: ['site:crisisgroup.org'],
  chathamhouse: ['site:chathamhouse.org'],
  brookings: ['site:brookings.edu'],
  carnegie: ['site:carnegieendowment.org'],
  rand: ['site:rand.org'],
  wilson: ['site:wilsoncenter.org'],
  isw: ['site:understandingwar.org'],
  iiss: ['site:iiss.org'],

  // UN system
  un: ['site:news.un.org OR site:undocs.org OR site:reliefweb.int'],
  ocha: ['site:unocha.org OR site:reliefweb.int'],
  unhcr: ['site:unhcr.org'],

  // Media
  bbc: ['site:bbc.com OR site:bbc.co.uk'],
  aljazeera: ['site:aljazeera.com'],
  guardian: ['site:theguardian.com'],
  nyt: ['site:nytimes.com'],
  ft: ['site:ft.com'],

  // Institutional
  worldbank: ['site:worldbank.org'],
  statedept: ['site:state.gov OR site:eeas.europa.eu'],
  sipri: ['site:sipri.org'],

  // Data sources
  ucdp: ['site:ucdp.uu.se'],
  wikipedia: ['site:en.wikipedia.org'],
  academic: ['site:jstor.org OR site:tandfonline.com OR site:journals.sagepub.com'],
};

// Reliability scores by hostname
const HOST_RELIABILITY: Record<string, number> = {
  'reuters.com': 0.95, 'apnews.com': 0.95, 'france24.com': 0.88,
  'bbc.com': 0.88, 'bbc.co.uk': 0.88, 'aljazeera.com': 0.85,
  'theguardian.com': 0.85, 'nytimes.com': 0.87, 'ft.com': 0.87,
  'news.un.org': 0.92, 'reliefweb.int': 0.90, 'undocs.org': 0.92,
  'crisisgroup.org': 0.90, 'chathamhouse.org': 0.85,
  'brookings.edu': 0.85, 'carnegieendowment.org': 0.85,
  'rand.org': 0.85, 'sipri.org': 0.90,
  'worldbank.org': 0.90, 'state.gov': 0.88, 'eeas.europa.eu': 0.85,
  'ucdp.uu.se': 0.92, 'en.wikipedia.org': 0.70,
  'understandingwar.org': 0.82, 'iiss.org': 0.85,
};

function scoreUrl(url: string): number {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return HOST_RELIABILITY[host] ?? 0.60;
  } catch {
    return 0.50;
  }
}

function hostnameFromUrl(url: string, fallback: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return fallback;
  }
}

function uniqStrings(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function timeRangeInstruction(timeRange: WebResearchOptions['timeRange']): string {
  switch (timeRange) {
    case 'day':
      return 'Prioritize developments from the past 24 hours. If nothing current exists, say so.';
    case 'week':
      return 'Prioritize developments from the past 7 days.';
    case 'month':
      return 'Prioritize developments from the past 30 days.';
    case 'year':
      return 'Prioritize developments from the past 12 months and clearly date older background.';
    case 'all':
      return 'Use the best available sources regardless of date, but clearly separate current reporting from background.';
    default:
      return 'Prioritize recent, current, and dated reporting.';
  }
}

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
    includeContent: Boolean(options.includeContent),
  });
}

/** Injected into AI context when all search providers fail. */
export const SEARCH_FAILURE_WARNING =
  '⚠️ Generated without live web data — results may reflect training data only. Verify all claims independently.';

// ---------------------------------------------------------------------------
// In-memory cache (15-min TTL)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 15 * 60 * 1000;
const resultCache = new Map<string, { data: WebResearchResult[]; ts: number }>();

function getCached(key: string): WebResearchResult[] | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { resultCache.delete(key); return null; }
  return entry.data;
}

function setCache(key: string, data: WebResearchResult[]) {
  resultCache.set(key, { data, ts: Date.now() });
  if (resultCache.size > 300) {
    const oldest = resultCache.keys().next().value;
    if (oldest) resultCache.delete(oldest);
  }
}

// ---------------------------------------------------------------------------
// User API keys reader (server-side, from Firestore)
// ---------------------------------------------------------------------------

export async function getUserApiKeys(uid: string): Promise<UserApiKeys> {
  if (!adminDb) return {};
  try {
    const snap = await adminDb
      .collection('users').doc(uid)
      .collection('settings').doc('api_keys')
      .get();
    return snap.exists ? (snap.data() as UserApiKeys) : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Build search queries from user favorites
// ---------------------------------------------------------------------------

/**
 * Builds focused search queries by combining the base query with
 * the user's favorite sources. This ensures Google Search results
 * prioritize outlets the user trusts.
 */
function buildSourceFocusedQueries(
  baseQuery: string,
  favoriteSources: string[],
  maxQueries: number = 3
): string[] {
  const queries: string[] = [];

  // Always include the base query (unfocused, broad coverage)
  queries.push(baseQuery);

  // Build site-focused queries from favorites
  const siteTerms: string[] = [];
  for (const source of favoriteSources) {
    const lower = source.toLowerCase();
    const terms = SOURCE_SEARCH_TERMS[lower];
    if (terms) siteTerms.push(...terms);
  }

  if (siteTerms.length > 0) {
    // Group site terms into chunks of 4 (Google handles ~4 OR clauses well)
    for (let i = 0; i < siteTerms.length; i += 4) {
      const chunk = siteTerms.slice(i, i + 4).join(' OR ');
      queries.push(`${baseQuery} (${chunk})`);
      if (queries.length >= maxQueries) break;
    }
  }

  return queries.slice(0, maxQueries);
}

// ---------------------------------------------------------------------------
// Provider: Google Search (via Gemini grounding)
// ---------------------------------------------------------------------------

async function searchGoogle(
  ctx: ResearchContext
): Promise<WebResearchResult[]> {
  const { query, situationName, options } = ctx;
  const baseQuery = uniqStrings([
    `${query} ${situationName}`,
    options.region ? `${query} ${situationName} ${options.region}` : undefined,
    options.actors?.length ? `${query} ${situationName} ${options.actors.slice(0, 4).join(' ')}` : undefined,
  ])[0] ?? `${query} ${situationName}`;
  const sourceFocused = buildSourceFocusedQueries(baseQuery, options.favoriteSources ?? [], 3);
  const actorQueries = (options.actors ?? [])
    .slice(0, 3)
    .map((actor) => `${actor} ${situationName} latest statements actions constraints`);
  const queries = uniqStrings([
    ...sourceFocused,
    ...actorQueries,
    options.region ? `${situationName} ${options.region} official statements conflict developments` : undefined,
  ]).slice(0, 5);

  const results: WebResearchResult[] = [];
  const retrievedAt = new Date().toISOString();
  const dateInstruction = timeRangeInstruction(options.timeRange);

  for (const q of queries) {
    try {
      const { text, sources } = await generateText({
        model: getGroundedModel(),
        prompt: `Use Google Search grounding to research: ${q}

${dateInstruction}
Prioritize checkable, authoritative sources: wire services, official institutions, UN/OCHA/ReliefWeb, court or legislative records, reputable local outlets, and established think tanks.

Return:
1. A concise research brief with dated facts, named actors, concrete numbers, and uncertainty notes.
2. A "Source receipts" section listing the source title, outlet, URL, publication date if visible, and which claim it supports.

Do not invent URLs. If sources disagree, identify the disagreement.`,
      });

      // Parse the grounded response into individual results
      // Gemini with grounding returns text + source citations
      if (text) {
        results.push({
          title: `Google Search: ${q.slice(0, 80)}`,
          url: 'https://google.com/search?q=' + encodeURIComponent(q),
          content: text,
          snippet: text.slice(0, 300),
          source: 'Google Search (Gemini Grounded)',
          provider: 'google-search',
          reliabilityScore: 0.80,
          query: q,
          retrievedAt,
          isGroundedSummary: true,
        });
      }

      // Extract individual source URLs if available in the response
      if (sources && Array.isArray(sources)) {
        for (const src of sources as Array<{ url?: string; title?: string }>) {
          if (!src.url || !/^https?:\/\//i.test(src.url)) continue;
          const host = hostnameFromUrl(src.url, 'Google grounded source');
          results.push({
            title: src.title ?? host,
            url: src.url,
            content: `Grounded citation returned for query "${q}". Use the URL as a source receipt and prefer scraped/full-text content when available.`,
            snippet: `Grounded citation returned for query "${q}".`,
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

// ---------------------------------------------------------------------------
// Provider: Tavily
// ---------------------------------------------------------------------------

async function searchTavily(
  ctx: ResearchContext
): Promise<WebResearchResult[]> {
  const apiKey = ctx.userKeys.tavily_key;
  if (!apiKey) return [];

  try {
    const body: Record<string, unknown> = {
      query: `${ctx.query} ${ctx.situationName}`,
      max_results: ctx.options.maxResults ?? 5,
      include_answer: true,
      include_raw_content: ctx.options.includeContent ?? false,
      search_depth: 'advanced',
    };

    if (ctx.options.timeRange && ctx.options.timeRange !== 'all') {
      body.days = ctx.options.timeRange === 'day' ? 1
        : ctx.options.timeRange === 'week' ? 7
        : ctx.options.timeRange === 'month' ? 30
        : 365;
    }

    // Include domain filtering based on user favorites
    if (ctx.options.favoriteSources?.length) {
      const domains: string[] = [];
      for (const src of ctx.options.favoriteSources) {
        const terms = SOURCE_SEARCH_TERMS[src.toLowerCase()];
        if (terms) {
          for (const t of terms) {
            const match = t.match(/site:([^\s]+)/);
            if (match) domains.push(match[1]);
          }
        }
      }
      if (domains.length > 0) {
        body.include_domains = domains.slice(0, 10);
      }
    }

    if (ctx.options.excludedSources?.length) {
      const excludeDomains: string[] = [];
      for (const src of ctx.options.excludedSources) {
        const terms = SOURCE_SEARCH_TERMS[src.toLowerCase()];
        if (terms) {
          for (const t of terms) {
            const match = t.match(/site:([^\s]+)/);
            if (match) excludeDomains.push(match[1]);
          }
        }
      }
      if (excludeDomains.length > 0) {
        body.exclude_domains = excludeDomains.slice(0, 10);
      }
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.warn('[web-research] Tavily returned', res.status);
      return [];
    }

    const data = await res.json();
    const results: WebResearchResult[] = [];

    // Tavily answer (AI-synthesized)
    if (data.answer) {
      results.push({
        title: 'Tavily AI Answer',
        url: 'https://tavily.com',
        content: data.answer,
        snippet: data.answer.slice(0, 300),
        source: 'Tavily AI',
        provider: 'tavily',
        reliabilityScore: 0.75,
        query: `${ctx.query} ${ctx.situationName}`,
        retrievedAt: new Date().toISOString(),
      });
    }

    // Individual results
    if (Array.isArray(data.results)) {
      for (const r of data.results) {
        const url = r.url ?? '';
        results.push({
          title: r.title ?? 'Untitled',
          url,
          content: r.raw_content ?? r.content ?? '',
          snippet: r.content?.slice(0, 300) ?? '',
          source: url ? hostnameFromUrl(url, 'tavily') : 'tavily',
          provider: 'tavily',
          publishedDate: r.published_date,
          reliabilityScore: scoreUrl(url),
          query: `${ctx.query} ${ctx.situationName}`,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('[web-research] Tavily search failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Provider: Parallel.ai
// ---------------------------------------------------------------------------

async function searchParallel(
  ctx: ResearchContext
): Promise<WebResearchResult[]> {
  const apiKey = ctx.userKeys.parallel_key || process.env.PARALLEL_API_KEY;
  if (!apiKey) return [];

  try {
    // Parallel Search API
    const searchBody = {
      objective: `Research: ${ctx.query} about ${ctx.situationName}`,
      search_queries: [
        ctx.query,
        `${ctx.situationName} latest developments`,
        ...(ctx.options.region ? [`${ctx.options.region} ${ctx.query}`] : []),
      ],
      mode: 'basic',
    };

    const res = await fetch('https://api.parallel.ai/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(searchBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.warn('[web-research] Parallel returned', res.status);
      return [];
    }

    const data = await res.json();
    const results: WebResearchResult[] = [];

    if (Array.isArray(data.results)) {
      for (const r of data.results) {
        const excerpt = Array.isArray(r.excerpts)
          ? r.excerpts.map((e: { text?: string } | string) => typeof e === 'string' ? e : e.text ?? '').filter(Boolean).join('\n\n')
          : r.excerpt ?? r.content ?? '';
        const url = r.url ?? '';
        results.push({
          title: r.title ?? 'Untitled',
          url,
          content: excerpt,
          snippet: excerpt.slice(0, 300),
          source: url ? hostnameFromUrl(url, 'parallel') : 'parallel',
          provider: 'parallel',
          publishedDate: r.published_date,
          reliabilityScore: scoreUrl(url),
          query: `${ctx.query} ${ctx.situationName}`,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('[web-research] Parallel search failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Provider: Firecrawl (legacy)
// ---------------------------------------------------------------------------

async function searchFirecrawl(
  ctx: ResearchContext
): Promise<WebResearchResult[]> {
  const apiKey = ctx.userKeys.firecrawl_key || process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `${ctx.query} ${ctx.situationName}`,
        limit: ctx.options.maxResults ?? 5,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results: WebResearchResult[] = [];

    if (Array.isArray(data.data)) {
      for (const r of data.data) {
        const url = r.url ?? '';
        results.push({
          title: r.title ?? 'Untitled',
          url,
          content: r.markdown ?? r.content ?? '',
          snippet: (r.description ?? '').slice(0, 300),
          source: url ? hostnameFromUrl(url, 'firecrawl') : 'firecrawl',
          provider: 'firecrawl',
          publishedDate: r.publishedDate,
          reliabilityScore: scoreUrl(url),
          query: `${ctx.query} ${ctx.situationName}`,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('[web-research] Firecrawl search failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main: Unified research function
// ---------------------------------------------------------------------------

/**
 * Execute web research using all available providers.
 *
 * Strategy:
 *   1. Google Search (Gemini grounded) — ALWAYS runs first (free, fast)
 *   2. Premium providers in parallel — Tavily, Parallel.ai, Firecrawl
 *      (only if user has API keys configured)
 *
 * User's favorite sources are woven into search queries to focus results
 * on outlets they trust.
 */
export async function executeWebResearch(
  query: string,
  situationName: string,
  uid: string,
  options: WebResearchOptions = {}
): Promise<WebResearchResult[]> {
  // Load user's API keys from Firestore
  const userKeys = await getUserApiKeys(uid);

  // ── Query Intelligence: craft precise queries per tool + methodology ──
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
    console.log(`[web-research] Query Intelligence for "${options.toolId}": ${craftedQueries.reasoning}`);

    // Use tool-specific time window if not explicitly set
    if (!options.timeRange) {
      options.timeRange = getToolTimeWindow(options.toolId);
    }

    // Merge tool source hints with user favorites
    const toolHints = getToolSourceHints(options.toolId);
    if (toolHints.length > 0 && (!options.favoriteSources || options.favoriteSources.length === 0)) {
      options.favoriteSources = toolHints;
    }
  }

  const cacheKey = resultCacheKey(uid, query, situationName, options);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Use crafted primary query if available, otherwise use the raw query
  const effectiveQuery = craftedQueries?.primary ?? query;

  const ctx: ResearchContext = {
    query: effectiveQuery,
    situationName,
    country: options.region,
    options,
    userKeys,
  };

  // Phase 1: Google Search (always available, runs first)
  // Use multiple crafted queries for broader coverage
  console.log(`[web-research] Phase 1: Google Search for "${effectiveQuery}"`);
  const googleResults = await searchGoogle(ctx);

  // If we have crafted focused queries, run them too for richer results
  if (craftedQueries && craftedQueries.focused.length > 0) {
    for (const focusedQuery of craftedQueries.focused.slice(0, 2)) {
      try {
        const focusedCtx = { ...ctx, query: focusedQuery };
        const focusedResults = await searchGoogle(focusedCtx);
        googleResults.push(...focusedResults);
      } catch {
        // Non-critical — additional queries can fail
      }
    }
  }

  // Phase 2: Premium providers in parallel (only those with API keys)
  const premiumProviders: Promise<WebResearchResult[]>[] = [];

  if (userKeys.tavily_key) {
    console.log('[web-research] Phase 2: Tavily (user key configured)');
    premiumProviders.push(searchTavily(ctx));
  }
  if (userKeys.parallel_key || process.env.PARALLEL_API_KEY) {
    console.log('[web-research] Phase 2: Parallel.ai');
    premiumProviders.push(searchParallel(ctx));
  }
  if (userKeys.firecrawl_key || process.env.FIRECRAWL_API_KEY) {
    console.log('[web-research] Phase 2: Firecrawl');
    premiumProviders.push(searchFirecrawl(ctx));
  }

  const premiumResults: WebResearchResult[] = [];
  if (premiumProviders.length > 0) {
    const settled = await Promise.allSettled(premiumProviders);
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        premiumResults.push(...result.value);
      }
    }
  }

  // Merge and deduplicate by URL. Synthetic grounded summaries use their
  // Google Search URL; malformed provider rows fall back to title/source.
  const allResults = [...googleResults, ...premiumResults];
  const seen = new Set<string>();
  const deduped: WebResearchResult[] = [];
  for (const r of allResults) {
    const key = (r.url || `${r.provider}:${r.source}:${r.title}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  // Sort by source quality, with a small bonus for records that carry content.
  deduped.sort((a, b) => {
    const aScore = a.reliabilityScore + (a.content?.length > 80 ? 0.08 : 0);
    const bScore = b.reliabilityScore + (b.content?.length > 80 ? 0.08 : 0);
    return bScore - aScore;
  });

  // Limit results
  const maxResults = options.maxResults ?? 10;
  const limited = deduped.slice(0, maxResults);

  setCache(cacheKey, limited);
  console.log(`[web-research] Total: ${limited.length} results (Google: ${googleResults.length}, Premium: ${premiumResults.length})`);

  return limited;
}

/**
 * Get which search providers are available for a user.
 * Used by the UI to show provider status badges.
 */
export async function getAvailableProviders(uid: string): Promise<{
  providers: Array<{
    id: SearchProvider;
    name: string;
    available: boolean;
    isDefault: boolean;
    note: string;
  }>;
}> {
  const keys = await getUserApiKeys(uid);

  return {
    providers: [
      {
        id: 'google-search',
        name: 'Google Search (Gemini)',
        available: true,
        isDefault: true,
        note: 'Always available — uses Gemini grounding',
      },
      {
        id: 'tavily',
        name: 'Tavily',
        available: !!keys.tavily_key,
        isDefault: false,
        note: keys.tavily_key
          ? 'Active — premium web research'
          : 'Add API key in Settings → API Keys',
      },
      {
        id: 'parallel',
        name: 'Parallel.ai',
        available: !!keys.parallel_key,
        isDefault: false,
        note: keys.parallel_key
          ? 'Active — AI-powered search & enrichment'
          : 'Add API key in Settings → API Keys',
      },
      {
        id: 'firecrawl',
        name: 'Firecrawl',
        available: !!(keys.firecrawl_key || process.env.FIRECRAWL_API_KEY),
        isDefault: false,
        note: keys.firecrawl_key
          ? 'Active — deep web scraping'
          : 'Add API key in Settings → API Keys',
      },
    ],
  };
}
