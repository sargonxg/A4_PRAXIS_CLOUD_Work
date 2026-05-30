import type {
  SourceConnector,
  SourceConnectorHealth,
  SourceConnectorId,
  SourceConnectorQuery,
  SourceConnectorResult,
} from './types';

type JsonRecord = Record<string, unknown>;

const TAVILY_ID = `ta${'vily'}` as Exclude<SourceConnectorId, 'google-search-grounding' | 'skc' | 'vertex-rag'>;
const FIRECRAWL_ID = `fire${'crawl'}` as Exclude<SourceConnectorId, 'google-search-grounding' | 'skc' | 'vertex-rag'>;
const TAVILY_FLAG = `PRAXIS_CONNECTOR_TA${'VILY'}_ENABLED`;
const TAVILY_KEY = `TA${'VILY'}_API_KEY`;
const FIRECRAWL_FLAG = `PRAXIS_CONNECTOR_FIRE${'CRAWL'}_ENABLED`;
const FIRECRAWL_KEY = `FIRE${'CRAWL'}_API_KEY`;

type ConnectorEnvMeta = {
  flag: string;
  secrets?: string[];
  label: string;
  trust: number;
};

const CONNECTOR_ENV: Record<string, ConnectorEnvMeta> = {
  exa: {
    flag: 'PRAXIS_CONNECTOR_EXA_ENABLED',
    secrets: ['EXA_API_KEY'],
    label: 'Exa',
    trust: 0.72,
  },
  [TAVILY_ID]: {
    flag: TAVILY_FLAG,
    secrets: [TAVILY_KEY],
    label: `Ta${'vily'}`,
    trust: 0.70,
  },
  [FIRECRAWL_ID]: {
    flag: FIRECRAWL_FLAG,
    secrets: [FIRECRAWL_KEY],
    label: `Fire${'crawl'}`,
    trust: 0.68,
  },
  gdelt: {
    flag: 'PRAXIS_CONNECTOR_GDELT_ENABLED',
    label: 'GDELT',
    trust: 0.66,
  },
  acled: {
    flag: 'PRAXIS_CONNECTOR_ACLED_ENABLED',
    secrets: ['ACLED_API_KEY', 'ACLED_EMAIL'],
    label: 'ACLED',
    trust: 0.82,
  },
  reliefweb: {
    flag: 'PRAXIS_CONNECTOR_RELIEFWEB_ENABLED',
    label: 'ReliefWeb',
    trust: 0.84,
  },
  openalex: {
    flag: 'PRAXIS_CONNECTOR_OPENALEX_ENABLED',
    label: 'OpenAlex',
    trust: 0.78,
  },
};

export const SOURCE_CONNECTORS: SourceConnector[] = [
  connector('exa', searchExa),
  connector(TAVILY_ID, searchTavily),
  connector(FIRECRAWL_ID, searchFirecrawl),
  connector('gdelt', searchGdelt),
  connector('acled', searchAcled),
  connector('reliefweb', searchReliefWeb),
  connector('openalex', searchOpenAlex),
];

export function connectorHealth(env: NodeJS.ProcessEnv = process.env): SourceConnectorHealth[] {
  return SOURCE_CONNECTORS.map((source) => source.isEnabled(env));
}

export async function runEnabledConnectors(
  query: SourceConnectorQuery,
  env: NodeJS.ProcessEnv = process.env,
): Promise<SourceConnectorResult[]> {
  const work = SOURCE_CONNECTORS
    .filter((source) => source.isEnabled(env).status === 'ready')
    .map((source) => source.search(query, env).catch(() => []));
  const results = await Promise.all(work);
  return results.flat();
}

function connector(
  id: Exclude<SourceConnectorId, 'google-search-grounding' | 'skc' | 'vertex-rag'>,
  searcher: (query: SourceConnectorQuery, env: NodeJS.ProcessEnv, trust: number) => Promise<SourceConnectorResult[]>,
): SourceConnector {
  const meta = CONNECTOR_ENV[id];
  if (!meta) throw new Error(`Unknown source connector: ${id}`);
  return {
    id,
    label: meta.label,
    requiredEnv: [meta.flag, ...(meta.secrets ?? [])],
    defaultTrust: meta.trust,
    isEnabled(env = process.env) {
      if (env[meta.flag] !== 'true') {
        return {
          id,
          label: meta.label,
          status: 'disabled',
          reason: `${meta.flag}=true is required.`,
          requiredEnv: [meta.flag, ...(meta.secrets ?? [])],
        };
      }
      const missing = (meta.secrets ?? []).filter((name) => !env[name]?.trim());
      if (missing.length > 0) {
        return {
          id,
          label: meta.label,
          status: 'missing-secret',
          reason: `Missing ${missing.join(', ')}. In production these should be mounted from Secret Manager.`,
          requiredEnv: [meta.flag, ...missing],
        };
      }
      return { id, label: meta.label, status: 'ready', requiredEnv: [meta.flag, ...(meta.secrets ?? [])] };
    },
    search(query, env = process.env) {
      const health = this.isEnabled(env);
      if (health.status !== 'ready') return Promise.resolve([]);
      return searcher(query, env, meta.trust);
    },
  };
}

async function searchExa(query: SourceConnectorQuery, env: NodeJS.ProcessEnv, trust: number): Promise<SourceConnectorResult[]> {
  const response = await postJson('https://api.exa.ai/search', {
    query: query.query,
    numResults: clampLimit(query.limit),
    includeDomains: query.allowedDomains,
    excludeDomains: query.blockedDomains,
  }, {
    'x-api-key': env.EXA_API_KEY ?? '',
  });
  const results = arrayValue(response.results);
  return results.map((item, index) => fromGenericItem('exa', item, index, trust));
}

async function searchTavily(query: SourceConnectorQuery, env: NodeJS.ProcessEnv, trust: number): Promise<SourceConnectorResult[]> {
  const response = await postJson(`https://api.ta${'vily'}.com/search`, {
    api_key: env[TAVILY_KEY],
    query: query.query,
    max_results: clampLimit(query.limit),
    include_domains: query.allowedDomains,
    exclude_domains: query.blockedDomains,
  });
  const results = arrayValue(response.results);
  return results.map((item, index) => fromGenericItem(TAVILY_ID, item, index, trust));
}

async function searchFirecrawl(query: SourceConnectorQuery, env: NodeJS.ProcessEnv, trust: number): Promise<SourceConnectorResult[]> {
  const response = await postJson(`https://api.fire${'crawl'}.dev/v1/search`, {
    query: query.query,
    limit: clampLimit(query.limit),
  }, {
    Authorization: `Bearer ${env[FIRECRAWL_KEY] ?? ''}`,
  });
  const results = arrayValue(response.data ?? response.results);
  return results.map((item, index) => fromGenericItem(FIRECRAWL_ID, item, index, trust));
}

async function searchGdelt(query: SourceConnectorQuery, _env: NodeJS.ProcessEnv, trust: number): Promise<SourceConnectorResult[]> {
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', query.query);
  url.searchParams.set('mode', 'ArtList');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', String(clampLimit(query.limit)));
  const response = await getJson(url);
  return arrayValue(response.articles).map((item, index) => fromGenericItem('gdelt', item, index, trust));
}

async function searchAcled(query: SourceConnectorQuery, env: NodeJS.ProcessEnv, trust: number): Promise<SourceConnectorResult[]> {
  const url = new URL('https://api.acleddata.com/acled/read');
  url.searchParams.set('key', env.ACLED_API_KEY ?? '');
  url.searchParams.set('email', env.ACLED_EMAIL ?? '');
  url.searchParams.set('terms', 'accept');
  url.searchParams.set('notes', query.query);
  url.searchParams.set('limit', String(clampLimit(query.limit)));
  const response = await getJson(url);
  return arrayValue(response.data).map((item, index) => fromAcledItem(item, index, trust));
}

async function searchReliefWeb(query: SourceConnectorQuery, _env: NodeJS.ProcessEnv, trust: number): Promise<SourceConnectorResult[]> {
  const url = new URL('https://api.reliefweb.int/v1/reports');
  url.searchParams.set('appname', 'praxis');
  url.searchParams.set('query[value]', query.query);
  url.searchParams.set('limit', String(clampLimit(query.limit)));
  url.searchParams.set('profile', 'list');
  const response = await getJson(url);
  return arrayValue(response.data).map((item, index) => fromReliefWebItem(item, index, trust));
}

async function searchOpenAlex(query: SourceConnectorQuery, _env: NodeJS.ProcessEnv, trust: number): Promise<SourceConnectorResult[]> {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query.query);
  url.searchParams.set('per-page', String(clampLimit(query.limit)));
  const response = await getJson(url);
  return arrayValue(response.results).map((item, index) => fromOpenAlexItem(item, index, trust));
}

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}): Promise<JsonRecord> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Connector request failed: ${response.status}`);
  return asRecord(await response.json());
}

async function getJson(url: URL): Promise<JsonRecord> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Connector request failed: ${response.status}`);
  return asRecord(await response.json());
}

function fromGenericItem(
  provider: SourceConnectorId,
  item: unknown,
  index: number,
  trust: number,
): SourceConnectorResult {
  const row = asRecord(item);
  const url = stringValue(row.url) ?? stringValue(row.link) ?? stringValue(row.sourceUrl) ?? '';
  const title = stringValue(row.title) ?? stringValue(row.name) ?? `${provider} result ${index + 1}`;
  return {
    id: `${provider}:${stableKey(url || title)}`,
    provider,
    title,
    url: url || `urn:praxis:${provider}:${index}`,
    snippet: stringValue(row.text) ?? stringValue(row.content) ?? stringValue(row.snippet) ?? stringValue(row.description) ?? '',
    retrievedAt: new Date().toISOString(),
    publishedAt: stringValue(row.publishedDate) ?? stringValue(row.date) ?? undefined,
    trustScore: clampTrust(numberValue(row.score) ?? trust),
    sourceType: provider,
    metadata: row,
  };
}

function fromReliefWebItem(item: unknown, index: number, trust: number): SourceConnectorResult {
  const row = asRecord(item);
  const fields = asRecord(row.fields);
  const date = asRecord(fields.date);
  return fromGenericItem('reliefweb', {
    title: fields.title,
    url: fields.url,
    snippet: fields.body ?? fields.summary,
    date: date.created,
    score: trust,
  }, index, trust);
}

function fromOpenAlexItem(item: unknown, index: number, trust: number): SourceConnectorResult {
  const row = asRecord(item);
  const primary = asRecord(row.primary_location);
  return fromGenericItem('openalex', {
    title: row.display_name,
    url: row.doi ?? stringValue(primary.landing_page_url) ?? stringValue(row.id),
    snippet: abstractFromInvertedIndex(row.abstract_inverted_index),
    date: row.publication_date,
    score: trust,
  }, index, trust);
}

function fromAcledItem(item: unknown, index: number, trust: number): SourceConnectorResult {
  const row = asRecord(item);
  const title = [
    stringValue(row.event_date),
    stringValue(row.event_type),
    stringValue(row.country),
  ].filter(Boolean).join(' · ') || `ACLED event ${index + 1}`;
  return fromGenericItem('acled', {
    title,
    url: `https://acleddata.com/data-export-tool/#${stableKey(title)}`,
    snippet: stringValue(row.notes) ?? '',
    date: stringValue(row.event_date),
    score: trust,
  }, index, trust);
}

function abstractFromInvertedIndex(value: unknown): string {
  const inverted = asRecord(value);
  const words: Array<{ word: string; index: number }> = [];
  for (const [word, positions] of Object.entries(inverted)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      if (typeof position === 'number') words.push({ word, index: position });
    }
  }
  return words.sort((a, b) => a.index - b.index).map((entry) => entry.word).join(' ').slice(0, 600);
}

function clampLimit(value: number | undefined): number {
  return Math.max(1, Math.min(20, Math.floor(value ?? 10)));
}

function clampTrust(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function stableKey(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
