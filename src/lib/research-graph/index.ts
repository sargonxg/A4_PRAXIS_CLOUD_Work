import type { SubscriptionTier } from '@/lib/api/tier';

export type ResearchGraphQueryKind =
  | 'current_media_pulse'
  | 'wikidata_entity_grounding'
  | 'cross_source_context'
  | 'event_timeline_bigquery';

export type ResearchGraphProvider =
  | 'gdelt-doc'
  | 'wikidata-sparql'
  | 'gdelt-bigquery'
  | 'research-graph';

export type ResearchGraphStatus = 'ready' | 'degraded' | 'blocked';

export type ResearchGraphCostPosture = 'free_open_data' | 'server_capped_bigquery';

export interface ResearchGraphEntityMatch {
  qid: string;
  label: string;
  description?: string;
  aliases: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  country?: string;
  inception?: string;
  dissolution?: string;
  officialSite?: string;
  externalIds: Record<string, string>;
  confidence: number;
}

export interface ResearchGraphSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ResearchGraphSignal {
  label: string;
  value: string;
  confidence: number;
  sourceUrl?: string;
}

export interface ResearchGraphReceipt {
  provider: ResearchGraphProvider;
  queryKind: ResearchGraphQueryKind;
  status: ResearchGraphStatus;
  filters: Record<string, unknown>;
  generatedAt: string;
  citations: string[];
  sourceUrls: string[];
  entityMatches: ResearchGraphEntityMatch[];
  eventSeries: ResearchGraphSeriesPoint[];
  mediaSeries: ResearchGraphSeriesPoint[];
  extractedSignals: ResearchGraphSignal[];
  confidence: number;
  caveats: string[];
  costPosture: ResearchGraphCostPosture;
  capped?: boolean;
  blockedReason?: string;
  advisoryOnly: true;
}

export type ResearchGraphBlockedReason =
  | 'server_disabled'
  | 'sample_mode_disabled'
  | 'raw_query_rejected'
  | 'missing_topic'
  | 'missing_entity'
  | 'wikidata_lookup_failed'
  | 'gdelt_lookup_failed'
  | 'bigquery_disabled'
  | 'missing_date_range'
  | 'missing_filter'
  | 'missing_limit'
  | 'missing_byte_cap'
  | 'dry_run_required'
  | 'dry_run_exceeds_cap'
  | 'backend_not_configured';

type Env = Record<string, string | undefined>;
type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface ResearchGraphActor {
  isDemo?: boolean;
  tier?: SubscriptionTier;
}

export interface ResearchGraphSearchInput {
  queryKind: ResearchGraphQueryKind;
  topic?: string;
  entity?: string;
  entities?: string[];
  place?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  maxResults?: number;
  env?: Env;
  actor?: ResearchGraphActor;
  generatedAt?: string;
  fetchImpl?: FetchLike;
}

export interface BigQueryEventTimelineInput {
  startDate?: string;
  endDate?: string;
  filter?: string;
  limit?: number;
  env?: Env;
  dryRunEstimateBytes?: number;
}

export interface BigQueryEventTimelineValidation {
  ok: boolean;
  blockedReason?: ResearchGraphBlockedReason;
  maxBytesBilled?: number;
}

export interface BigQueryTemplate {
  sql: string;
  parameters: {
    startDate: number;
    endDate: number;
    filter: string;
    limit: number;
  };
  maximumBytesBilled: number | null;
}

const GDELT_DOC_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const DEFAULT_USER_AGENT = 'PRAXIS Research Graph/1.0 (advisory receipts; contact: giulio@tacitus.me)';
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_GDELT_QUERY_LENGTH = 180;
const MAX_GDELT_RESULTS = 10;
const MAX_GDELT_DAYS = 30;
const MAX_WIKIDATA_LIMIT = 8;
const WIKIDATA_CACHE_TTL_MS = 60 * 60 * 1000;

const wikidataCache = new Map<string, { expiresAt: number; receipt: ResearchGraphReceipt }>();

export function isResearchGraphServerEnabled(env: Env = process.env): boolean {
  return env.RESEARCH_GRAPH_ENABLED?.toLowerCase() === 'true';
}

export function buildBlockedResearchGraphReceipt(input: {
  queryKind: ResearchGraphQueryKind;
  blockedReason: ResearchGraphBlockedReason;
  filters?: Record<string, unknown>;
  provider?: ResearchGraphProvider;
  generatedAt?: string;
  costPosture?: ResearchGraphCostPosture;
  caveats?: string[];
}): ResearchGraphReceipt {
  return {
    provider: input.provider ?? 'research-graph',
    queryKind: input.queryKind,
    status: 'blocked',
    filters: input.filters ?? {},
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    citations: [],
    sourceUrls: [],
    entityMatches: [],
    eventSeries: [],
    mediaSeries: [],
    extractedSignals: [],
    confidence: 0,
    caveats: input.caveats ?? [blockedReasonMessage(input.blockedReason)],
    costPosture: input.costPosture ?? 'free_open_data',
    capped: true,
    blockedReason: input.blockedReason,
    advisoryOnly: true,
  };
}

export async function runResearchGraphSearch(input: ResearchGraphSearchInput): Promise<ResearchGraphReceipt> {
  try {
    rejectRawResearchGraphQuery(input);
  } catch {
    return buildBlockedResearchGraphReceipt({
      queryKind: input.queryKind,
      blockedReason: 'raw_query_rejected',
      filters: safeFilters(input),
      generatedAt: input.generatedAt,
    });
  }

  const env = input.env ?? process.env;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  if (!isResearchGraphServerEnabled(env)) {
    return buildBlockedResearchGraphReceipt({
      queryKind: input.queryKind,
      blockedReason: 'server_disabled',
      filters: safeFilters(input),
      generatedAt,
    });
  }
  if (input.actor?.isDemo) {
    return buildBlockedResearchGraphReceipt({
      queryKind: input.queryKind,
      blockedReason: 'sample_mode_disabled',
      filters: safeFilters(input),
      generatedAt,
    });
  }

  if (input.queryKind === 'current_media_pulse') {
    return runCurrentMediaPulse(input, generatedAt);
  }
  if (input.queryKind === 'wikidata_entity_grounding') {
    return runWikidataEntityGrounding(input, generatedAt);
  }
  if (input.queryKind === 'cross_source_context') {
    return runCrossSourceContext(input, generatedAt);
  }
  return runEventTimelineBigQuery(input, generatedAt);
}

export function rejectRawResearchGraphQuery(value: unknown): void {
  const rawKeys = new Set(['sql', 'sparql', 'rawsql', 'rawsparql', 'rawquery', 'querysql', 'querysparql']);
  const visit = (item: unknown): void => {
    if (typeof item === 'string') {
      if (/\bselect\s+\*/i.test(item) || /\bsparql\b/i.test(item) || /\bfrom\s+`?gdelt-bq/i.test(item)) {
        throw new Error('Raw SQL/SPARQL is not accepted by Research graph.');
      }
      return;
    }
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }
    for (const [key, child] of Object.entries(item as Record<string, unknown>)) {
      if (rawKeys.has(key.toLowerCase())) {
        throw new Error('Raw SQL/SPARQL is not accepted by Research graph.');
      }
      visit(child);
    }
  };
  visit(value);
}

export function normalizeGdeltDocResponse(input: {
  queryKind: Extract<ResearchGraphQueryKind, 'current_media_pulse' | 'cross_source_context'>;
  filters: Record<string, unknown>;
  articleList: unknown;
  timeline: unknown;
  generatedAt: string;
}): ResearchGraphReceipt {
  const articles = extractGdeltArticles(input.articleList).slice(0, MAX_GDELT_RESULTS);
  const mediaSeries = extractGdeltTimeline(input.timeline);
  const sourceUrls = uniqueStrings(articles.map((article) => article.url)).slice(0, MAX_GDELT_RESULTS);
  const peak = mediaSeries.reduce<ResearchGraphSeriesPoint | null>((best, point) => {
    if (!best || point.value > best.value) return point;
    return best;
  }, null);
  const extractedSignals: ResearchGraphSignal[] = [
    {
      label: 'Article matches',
      value: `${articles.length} matching article${articles.length === 1 ? '' : 's'}`,
      confidence: articles.length ? 0.64 : 0.3,
      sourceUrl: sourceUrls[0],
    },
  ];
  if (peak) {
    extractedSignals.push({
      label: 'Media pulse peak',
      value: `${peak.value} on ${peak.date}`,
      confidence: 0.58,
    });
  }
  for (const article of articles.slice(0, 3)) {
    extractedSignals.push({
      label: article.domain ? `Reported by ${article.domain}` : 'Source article',
      value: article.title || article.url,
      confidence: 0.56,
      sourceUrl: article.url,
    });
  }

  return {
    provider: 'gdelt-doc',
    queryKind: input.queryKind,
    status: articles.length || mediaSeries.length ? 'ready' : 'degraded',
    filters: input.filters,
    generatedAt: input.generatedAt,
    citations: [GDELT_DOC_ENDPOINT],
    sourceUrls,
    entityMatches: [],
    eventSeries: [],
    mediaSeries,
    extractedSignals,
    confidence: clamp01((articles.length ? 0.5 : 0.2) + Math.min(mediaSeries.length, 5) * 0.04),
    caveats: [
      'GDELT DOC/API is an advisory media signal, not canonical graph truth.',
      'Article volume can reflect media attention, duplication, language coverage, or source availability.',
    ],
    costPosture: 'free_open_data',
    capped: articles.length >= MAX_GDELT_RESULTS,
    advisoryOnly: true,
  };
}

export function normalizeWikidataEntityResponse(input: {
  search: string;
  bindings: Array<Record<string, { value?: string }>>;
  generatedAt: string;
}): ResearchGraphReceipt {
  const grouped = new Map<string, ResearchGraphEntityMatch>();
  for (const binding of input.bindings) {
    const qid = qidFromWikidataUri(stringBinding(binding, 'item'));
    const label = stringBinding(binding, 'itemLabel');
    if (!qid || !label) continue;
    const existing = grouped.get(qid) ?? {
      qid,
      label,
      description: stringBinding(binding, 'itemDescription') ?? undefined,
      aliases: [],
      coordinates: coordinatesFromWkt(stringBinding(binding, 'coord')),
      country: stringBinding(binding, 'countryLabel') ?? undefined,
      inception: datePart(stringBinding(binding, 'inception')) ?? undefined,
      dissolution: datePart(stringBinding(binding, 'dissolution')) ?? undefined,
      officialSite: stringBinding(binding, 'officialWebsite') ?? undefined,
      externalIds: {},
      confidence: 0.72,
    };
    const alias = stringBinding(binding, 'altLabel');
    if (alias && alias !== existing.label && !existing.aliases.includes(alias)) {
      existing.aliases.push(alias);
    }
    const viaf = stringBinding(binding, 'viaf');
    const isni = stringBinding(binding, 'isni');
    const grid = stringBinding(binding, 'grid');
    if (viaf) existing.externalIds.VIAF = viaf;
    if (isni) existing.externalIds.ISNI = isni;
    if (grid) existing.externalIds.GRID = grid;
    existing.aliases = existing.aliases.slice(0, 8);
    grouped.set(qid, existing);
  }
  const entityMatches = Array.from(grouped.values()).slice(0, MAX_WIKIDATA_LIMIT);
  const sourceUrls = uniqueStrings(entityMatches.flatMap((match) => [
    match.officialSite,
    `https://www.wikidata.org/wiki/${match.qid}`,
  ].filter((url): url is string => Boolean(url))));
  return {
    provider: 'wikidata-sparql',
    queryKind: 'wikidata_entity_grounding',
    status: entityMatches.length ? 'ready' : 'degraded',
    filters: { search: trimTo(input.search, 120) },
    generatedAt: input.generatedAt,
    citations: [WIKIDATA_SPARQL_ENDPOINT],
    sourceUrls,
    entityMatches,
    eventSeries: [],
    mediaSeries: [],
    extractedSignals: entityMatches.map((match) => ({
      label: `Resolved ${match.qid}`,
      value: [match.label, match.description].filter(Boolean).join(' - '),
      confidence: match.confidence,
      sourceUrl: `https://www.wikidata.org/wiki/${match.qid}`,
    })),
    confidence: entityMatches.length ? 0.74 : 0.25,
    caveats: [
      'Wikidata entity matches require analyst review before use as canonical PRAXIS graph nodes.',
      'Aliases and external IDs are grounding hints, not proof of relationship or causality.',
    ],
    costPosture: 'free_open_data',
    capped: entityMatches.length >= MAX_WIKIDATA_LIMIT,
    advisoryOnly: true,
  };
}

export function validateBigQueryEventTimeline(input: BigQueryEventTimelineInput): BigQueryEventTimelineValidation {
  const env = input.env ?? process.env;
  if (env.GDELT_BIGQUERY_ENABLED?.toLowerCase() !== 'true') {
    return { ok: false, blockedReason: 'bigquery_disabled' };
  }
  if (!isIsoDate(input.startDate) || !isIsoDate(input.endDate)) {
    return { ok: false, blockedReason: 'missing_date_range' };
  }
  if (!safeSearchText(input.filter, 80)) {
    return { ok: false, blockedReason: 'missing_filter' };
  }
  if (!Number.isInteger(input.limit) || !input.limit || input.limit < 1 || input.limit > 500) {
    return { ok: false, blockedReason: 'missing_limit' };
  }
  const maxBytesBilled = Number(env.RESEARCH_GRAPH_MAX_BYTES_BILLED);
  if (!Number.isFinite(maxBytesBilled) || maxBytesBilled <= 0) {
    return { ok: false, blockedReason: 'missing_byte_cap' };
  }
  if (!Number.isFinite(input.dryRunEstimateBytes)) {
    return { ok: false, blockedReason: 'dry_run_required', maxBytesBilled };
  }
  if ((input.dryRunEstimateBytes ?? Infinity) > maxBytesBilled) {
    return { ok: false, blockedReason: 'dry_run_exceeds_cap', maxBytesBilled };
  }
  return { ok: true, maxBytesBilled };
}

export function buildEventTimelineBigQueryTemplate(input: {
  startDate: string;
  endDate: string;
  filter: string;
  limit: number;
  maxBytesBilled?: number;
}): BigQueryTemplate {
  const sql = [
    'SELECT',
    '  SQLDATE,',
    '  Actor1Name,',
    '  Actor2Name,',
    '  EventCode,',
    '  GoldsteinScale,',
    '  NumArticles,',
    '  SOURCEURL',
    'FROM `gdelt-bq.gdeltv2.events`',
    'WHERE SQLDATE BETWEEN @startDate AND @endDate',
    '  AND (LOWER(Actor1Name) LIKE @filter OR LOWER(Actor2Name) LIKE @filter OR LOWER(ActionGeo_FullName) LIKE @filter)',
    'ORDER BY SQLDATE DESC',
    'LIMIT @limit',
  ].join('\n');
  return {
    sql,
    parameters: {
      startDate: dateToSqlDate(input.startDate),
      endDate: dateToSqlDate(input.endDate),
      filter: `%${safeSearchText(input.filter, 80).toLowerCase()}%`,
      limit: Math.min(Math.max(input.limit, 1), 500),
    },
    maximumBytesBilled: input.maxBytesBilled ?? null,
  };
}

export function isResearchGraphReceipt(value: unknown): value is ResearchGraphReceipt {
  return Boolean(
    value
      && typeof value === 'object'
      && !Array.isArray(value)
      && (value as { advisoryOnly?: unknown }).advisoryOnly === true
      && typeof (value as { queryKind?: unknown }).queryKind === 'string'
      && typeof (value as { provider?: unknown }).provider === 'string',
  );
}

export function coerceResearchGraphReceipts(value: unknown): ResearchGraphReceipt[] {
  if (isResearchGraphReceipt(value)) return [value];
  if (Array.isArray(value)) return value.filter(isResearchGraphReceipt);
  if (value && typeof value === 'object') {
    const nested = (value as { receipts?: unknown; receipt?: unknown }).receipts ?? (value as { receipt?: unknown }).receipt;
    if (nested) return coerceResearchGraphReceipts(nested);
  }
  return [];
}

async function runCurrentMediaPulse(input: ResearchGraphSearchInput, generatedAt: string): Promise<ResearchGraphReceipt> {
  const topic = safeSearchText(input.topic ?? input.entity ?? input.entities?.join(' '), MAX_GDELT_QUERY_LENGTH);
  if (!topic) {
    return buildBlockedResearchGraphReceipt({
      queryKind: 'current_media_pulse',
      blockedReason: 'missing_topic',
      filters: safeFilters(input),
      generatedAt,
    });
  }
  try {
    const filters = gdeltFilters(input, topic);
    const [articleList, timeline] = await Promise.all([
      fetchJson(buildGdeltDocUrl({ ...filters, mode: 'artlist' }), input),
      fetchJson(buildGdeltDocUrl({ ...filters, mode: 'timelinevolraw' }), input),
    ]);
    return normalizeGdeltDocResponse({
      queryKind: 'current_media_pulse',
      filters,
      articleList,
      timeline,
      generatedAt,
    });
  } catch (err) {
    return buildBlockedResearchGraphReceipt({
      queryKind: 'current_media_pulse',
      blockedReason: 'gdelt_lookup_failed',
      filters: safeFilters(input),
      generatedAt,
      provider: 'gdelt-doc',
      caveats: [err instanceof Error ? err.message : 'GDELT DOC/API lookup failed.'],
    });
  }
}

async function runWikidataEntityGrounding(input: ResearchGraphSearchInput, generatedAt: string): Promise<ResearchGraphReceipt> {
  const search = safeSearchText(input.entity ?? input.topic ?? input.entities?.[0], 120);
  if (!search) {
    return buildBlockedResearchGraphReceipt({
      queryKind: 'wikidata_entity_grounding',
      blockedReason: 'missing_entity',
      filters: safeFilters(input),
      generatedAt,
    });
  }
  const cacheKey = search.toLowerCase();
  const cached = wikidataCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.receipt;
  try {
    const query = buildWikidataEntityGroundingSparql(search, MAX_WIKIDATA_LIMIT);
    const url = new URL(WIKIDATA_SPARQL_ENDPOINT);
    url.searchParams.set('query', query);
    url.searchParams.set('format', 'json');
    const data = await fetchJson(url, input);
    const bindings = Array.isArray((data as { results?: { bindings?: unknown } }).results?.bindings)
      ? (data as { results: { bindings: Array<Record<string, { value?: string }>> } }).results.bindings
      : [];
    const receipt = normalizeWikidataEntityResponse({ search, bindings, generatedAt });
    wikidataCache.set(cacheKey, { expiresAt: Date.now() + WIKIDATA_CACHE_TTL_MS, receipt });
    return receipt;
  } catch (err) {
    return buildBlockedResearchGraphReceipt({
      queryKind: 'wikidata_entity_grounding',
      blockedReason: 'wikidata_lookup_failed',
      filters: { search },
      generatedAt,
      provider: 'wikidata-sparql',
      caveats: [err instanceof Error ? err.message : 'Wikidata SPARQL lookup failed.'],
    });
  }
}

async function runCrossSourceContext(input: ResearchGraphSearchInput, generatedAt: string): Promise<ResearchGraphReceipt> {
  const entityReceipt = await runWikidataEntityGrounding({
    ...input,
    queryKind: 'wikidata_entity_grounding',
    generatedAt,
  }, generatedAt);
  const resolvedTerms = uniqueStrings([
    ...entityReceipt.entityMatches.map((match) => match.label),
    ...entityReceipt.entityMatches.flatMap((match) => match.aliases),
    input.topic,
    input.place,
  ].filter((item): item is string => Boolean(item))).slice(0, 6);
  const mediaReceipt = await runCurrentMediaPulse({
    ...input,
    queryKind: 'current_media_pulse',
    topic: resolvedTerms.join(' '),
    generatedAt,
  }, generatedAt);
  return {
    provider: 'research-graph',
    queryKind: 'cross_source_context',
    status: entityReceipt.status === 'blocked' && mediaReceipt.status === 'blocked' ? 'blocked' : 'ready',
    filters: {
      ...safeFilters(input),
      resolvedTerms,
    },
    generatedAt,
    citations: uniqueStrings([...entityReceipt.citations, ...mediaReceipt.citations]),
    sourceUrls: uniqueStrings([...entityReceipt.sourceUrls, ...mediaReceipt.sourceUrls]),
    entityMatches: entityReceipt.entityMatches,
    eventSeries: [],
    mediaSeries: mediaReceipt.mediaSeries,
    extractedSignals: [
      ...entityReceipt.extractedSignals,
      ...mediaReceipt.extractedSignals,
      {
        label: 'Cross-source context',
        value: `${entityReceipt.entityMatches.length} Wikidata match${entityReceipt.entityMatches.length === 1 ? '' : 'es'} checked against GDELT media signals.`,
        confidence: 0.6,
      },
    ],
    confidence: clamp01((entityReceipt.confidence + mediaReceipt.confidence) / 2),
    caveats: uniqueStrings([...entityReceipt.caveats, ...mediaReceipt.caveats]),
    costPosture: 'free_open_data',
    capped: Boolean(entityReceipt.capped || mediaReceipt.capped),
    blockedReason: entityReceipt.status === 'blocked' && mediaReceipt.status === 'blocked'
      ? entityReceipt.blockedReason ?? mediaReceipt.blockedReason
      : undefined,
    advisoryOnly: true,
  };
}

function runEventTimelineBigQuery(input: ResearchGraphSearchInput, generatedAt: string): ResearchGraphReceipt {
  const validation = validateBigQueryEventTimeline({
    startDate: input.startDate,
    endDate: input.endDate,
    filter: input.topic ?? input.entity ?? input.place,
    limit: input.maxResults,
    env: input.env,
  });
  if (!validation.ok) {
    return buildBlockedResearchGraphReceipt({
      queryKind: 'event_timeline_bigquery',
      blockedReason: validation.blockedReason ?? 'bigquery_disabled',
      filters: safeFilters(input),
      provider: 'gdelt-bigquery',
      generatedAt,
      costPosture: 'server_capped_bigquery',
    });
  }
  return buildBlockedResearchGraphReceipt({
    queryKind: 'event_timeline_bigquery',
    blockedReason: 'backend_not_configured',
    filters: safeFilters(input),
    provider: 'gdelt-bigquery',
    generatedAt,
    costPosture: 'server_capped_bigquery',
    caveats: ['GDELT BigQuery is a separate server-capped backend mode and is not enabled in the default Ask PRAXIS path.'],
  });
}

function buildWikidataEntityGroundingSparql(search: string, limit: number): string {
  const safeSearch = escapeSparqlString(safeSearchText(search, 120));
  const safeLimit = Math.min(Math.max(limit, 1), MAX_WIKIDATA_LIMIT);
  return `
SELECT ?item ?itemLabel ?itemDescription ?altLabel ?coord ?countryLabel ?inception ?dissolution ?officialWebsite ?viaf ?isni ?grid WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org";
      wikibase:api "EntitySearch";
      mwapi:search "${safeSearch}";
      mwapi:language "en".
    ?item wikibase:apiOutputItem mwapi:item.
  }
  OPTIONAL { ?item skos:altLabel ?altLabel FILTER(LANG(?altLabel) = "en") }
  OPTIONAL { ?item wdt:P625 ?coord. }
  OPTIONAL { ?item wdt:P17 ?country. }
  OPTIONAL { ?item wdt:P571 ?inception. }
  OPTIONAL { ?item wdt:P576 ?dissolution. }
  OPTIONAL { ?item wdt:P856 ?officialWebsite. }
  OPTIONAL { ?item wdt:P214 ?viaf. }
  OPTIONAL { ?item wdt:P213 ?isni. }
  OPTIONAL { ?item wdt:P2427 ?grid. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT ${safeLimit}`.trim();
}

function gdeltFilters(input: ResearchGraphSearchInput, topic: string): Record<string, unknown> {
  const maxResults = Math.min(Math.max(input.maxResults ?? 8, 1), MAX_GDELT_RESULTS);
  const days = Math.min(Math.max(input.days ?? 7, 1), MAX_GDELT_DAYS);
  return {
    topic,
    query: buildGdeltDocQuery(topic),
    maxResults,
    days,
    startDate: isIsoDate(input.startDate) ? input.startDate : undefined,
    endDate: isIsoDate(input.endDate) ? input.endDate : undefined,
    place: safeSearchText(input.place, 80) || undefined,
  };
}

function buildGdeltDocUrl(filters: Record<string, unknown> & { mode: 'artlist' | 'timelinevolraw' }): string {
  const url = new URL(GDELT_DOC_ENDPOINT);
  url.searchParams.set('query', String(filters.query ?? ''));
  url.searchParams.set('mode', filters.mode);
  url.searchParams.set('format', 'json');
  if (filters.mode === 'artlist') {
    url.searchParams.set('maxrecords', String(filters.maxResults ?? MAX_GDELT_RESULTS));
    url.searchParams.set('sort', 'datedesc');
  }
  if (typeof filters.startDate === 'string' && typeof filters.endDate === 'string') {
    url.searchParams.set('startdatetime', filters.startDate.replace(/-/g, '') + '000000');
    url.searchParams.set('enddatetime', filters.endDate.replace(/-/g, '') + '235959');
  } else {
    url.searchParams.set('timespan', `${filters.days ?? 7}d`);
  }
  return url.toString();
}

function buildGdeltDocQuery(topic: string): string {
  const terms = uniqueStrings(topic.split(/[;,]/).flatMap((part) => part.split(/\s+and\s+|\s+or\s+/i)))
    .map((term) => safeSearchText(term, 48))
    .filter(Boolean)
    .slice(0, 5);
  const query = terms.length ? terms.map((term) => `"${term.replace(/"/g, '')}"`).join(' OR ') : `"${safeSearchText(topic, 80)}"`;
  return trimTo(query, MAX_GDELT_QUERY_LENGTH);
}

async function fetchJson(url: string | URL, input: ResearchGraphSearchInput): Promise<unknown> {
  const env = input.env ?? process.env;
  const fetchImpl = input.fetchImpl ?? fetch;
  const timeoutMs = Number(env.RESEARCH_GRAPH_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: 'application/json',
        'user-agent': env.RESEARCH_GRAPH_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Research graph provider returned HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function extractGdeltArticles(value: unknown): Array<{
  title: string;
  url: string;
  domain?: string;
  seenDate?: string;
  sourceCountry?: string;
  language?: string;
}> {
  const articles = Array.isArray((value as { articles?: unknown })?.articles)
    ? (value as { articles: unknown[] }).articles
    : [];
  return articles.flatMap((article) => {
    if (!article || typeof article !== 'object') return [];
    const record = article as Record<string, unknown>;
    const url = stringValue(record.url);
    if (!url) return [];
    return [{
      title: stringValue(record.title) ?? url,
      url,
      domain: stringValue(record.domain) ?? undefined,
      seenDate: stringValue(record.seendate) ?? stringValue(record.seenDate) ?? undefined,
      sourceCountry: stringValue(record.sourcecountry) ?? stringValue(record.sourceCountry) ?? undefined,
      language: stringValue(record.language) ?? undefined,
    }];
  });
}

function extractGdeltTimeline(value: unknown): ResearchGraphSeriesPoint[] {
  const raw = Array.isArray((value as { timeline?: unknown })?.timeline)
    ? (value as { timeline: unknown[] }).timeline
    : Array.isArray((value as { timelinevol?: unknown })?.timelinevol)
      ? (value as { timelinevol: unknown[] }).timelinevol
      : Array.isArray((value as { data?: unknown })?.data)
        ? (value as { data: unknown[] }).data
        : [];
  return raw.flatMap((point) => {
    if (!point || typeof point !== 'object') return [];
    const record = point as Record<string, unknown>;
    const date = normalizeDateLabel(stringValue(record.date) ?? stringValue(record.datetime) ?? stringValue(record.Date));
    const valueNumber = numberValue(record.value) ?? numberValue(record.Value) ?? numberValue(record.count) ?? numberValue(record.volume);
    if (!date || typeof valueNumber !== 'number') return [];
    return [{ date, value: valueNumber }];
  }).slice(0, 90);
}

function safeFilters(input: ResearchGraphSearchInput): Record<string, unknown> {
  return {
    topic: safeSearchText(input.topic, MAX_GDELT_QUERY_LENGTH) || undefined,
    entity: safeSearchText(input.entity, 120) || undefined,
    entities: input.entities?.map((entity) => safeSearchText(entity, 80)).filter(Boolean).slice(0, 8),
    place: safeSearchText(input.place, 80) || undefined,
    startDate: isIsoDate(input.startDate) ? input.startDate : undefined,
    endDate: isIsoDate(input.endDate) ? input.endDate : undefined,
    days: Number.isFinite(input.days) ? Math.min(Math.max(Number(input.days), 1), MAX_GDELT_DAYS) : undefined,
    maxResults: Number.isFinite(input.maxResults) ? Math.min(Math.max(Number(input.maxResults), 1), MAX_GDELT_RESULTS) : undefined,
  };
}

function safeSearchText(value: unknown, maxLength = 180): string {
  if (typeof value !== 'string') return '';
  return trimTo(value.replace(/[^\w\s.,'/-]/g, ' ').replace(/\s+/g, ' '), maxLength);
}

function trimTo(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength).trim();
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function stringBinding(binding: Record<string, { value?: string }>, key: string): string | null {
  return stringValue(binding[key]?.value);
}

function qidFromWikidataUri(value: string | null): string | null {
  const match = value?.match(/\/(Q\d+)$/);
  return match?.[1] ?? null;
}

function coordinatesFromWkt(value: string | null): ResearchGraphEntityMatch['coordinates'] | undefined {
  const match = value?.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!match) return undefined;
  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { latitude, longitude };
}

function datePart(value: string | null): string | null {
  return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

function normalizeDateLabel(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  if (/^\d{14}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  return value.slice(0, 10);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateToSqlDate(value: string): number {
  return Number(value.replace(/-/g, ''));
}

function escapeSparqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function blockedReasonMessage(reason: ResearchGraphBlockedReason): string {
  switch (reason) {
    case 'server_disabled':
      return 'Research graph is disabled on this server; Ask PRAXIS should answer normally without it.';
    case 'sample_mode_disabled':
      return 'Research graph is available only to authenticated users, not public/sample turns.';
    case 'raw_query_rejected':
      return 'Research graph accepts only approved templates, never raw SQL or SPARQL.';
    case 'missing_topic':
      return 'A bounded topic is required for GDELT media pulse queries.';
    case 'missing_entity':
      return 'An entity name is required for Wikidata grounding.';
    case 'bigquery_disabled':
      return 'GDELT BigQuery is disabled by default because query processing can bill the PRAXIS GCP project.';
    case 'missing_date_range':
      return 'BigQuery timeline mode requires a bounded start and end date.';
    case 'missing_filter':
      return 'BigQuery timeline mode requires an actor, place, or topic filter.';
    case 'missing_limit':
      return 'BigQuery timeline mode requires a bounded LIMIT.';
    case 'missing_byte_cap':
      return 'BigQuery timeline mode requires RESEARCH_GRAPH_MAX_BYTES_BILLED.';
    case 'dry_run_required':
      return 'BigQuery timeline mode requires a dry-run byte estimate before execution.';
    case 'dry_run_exceeds_cap':
      return 'BigQuery dry-run estimate exceeds the configured byte cap.';
    case 'backend_not_configured':
      return 'BigQuery execution is not wired in this Ask PRAXIS deployment.';
    case 'gdelt_lookup_failed':
      return 'GDELT DOC/API lookup failed; Ask PRAXIS should continue with a degraded receipt.';
    case 'wikidata_lookup_failed':
      return 'Wikidata SPARQL lookup failed; Ask PRAXIS should continue with a degraded receipt.';
  }
}
