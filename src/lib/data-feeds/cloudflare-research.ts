/** Server-side, read-only bridge to the private research Worker. Never import in client components. */
const API_VERSION = 'policy-research-db/1';
const MAX_RESPONSE_BYTES = 2_000_000;
const EVENT_FILTERS = ['country', 'from', 'to', 'actor', 'type', 'precision', 'date_precision'];
const PARAMETERS: Record<string, readonly string[]> = {
  status: [], datasets: [], provenance: [], lenses: [],
  events: [...EVENT_FILTERS, 'limit', 'cursor'],
  aggregates: EVENT_FILTERS,
  sources: ['q', 'type', 'limit', 'offset'],
  indicators: ['country', 'indicator', 'from_year', 'to_year', 'limit', 'offset'],
};

export class ResearchDatasetError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
  }
}

export interface ResearchDatasetEnvelope {
  api_version: 'policy-research-db/1';
  status: 'ready';
  backend: 'd1';
  read_only: true;
  snapshot: { id: string; date_start: string; date_end: string };
  [key: string]: unknown;
}

type ResearchEnvironment = Readonly<Record<string, string | undefined>>;

function failure(code: string, status: number, message: string): never {
  throw new ResearchDatasetError(code, status, message);
}

/** The Worker validates filter values; this bridge also restricts paths, duplicates and request size. */
export async function readCloudflareResearch(
  parameters: URLSearchParams,
  environment: ResearchEnvironment = process.env,
): Promise<ResearchDatasetEnvelope> {
  if (typeof window !== 'undefined') failure('SERVER_ONLY', 503, 'Research access requires the server.');
  const resource = parameters.get('resource') ?? 'status';
  if (!Object.hasOwn(PARAMETERS, resource)) failure('INVALID_RESOURCE', 400, 'Choose a supported research resource.');
  for (const key of parameters.keys()) {
    if (parameters.getAll(key).length !== 1 || (key !== 'resource' && !PARAMETERS[resource].includes(key))) {
      failure('INVALID_PARAMETER', 400, 'The research query contains an unsupported or repeated parameter.');
    }
  }
  if (parameters.toString().length > 3500) failure('QUERY_TOO_LONG', 400, 'The research query is too long.');
  const { PRAXIS_RESEARCH_API_ORIGIN: origin, PRAXIS_RESEARCH_ACCESS_CLIENT_ID: clientId,
    PRAXIS_RESEARCH_ACCESS_CLIENT_SECRET: clientSecret } = environment;
  if (!origin || !clientId || !clientSecret) {
    failure('RESEARCH_UNCONFIGURED', 503, 'The private research connection is not configured.');
  }
  let base: URL;
  try { base = new URL(origin); } catch { failure('RESEARCH_CONFIGURATION', 503, 'The research connection configuration is invalid.'); }
  // A configured origin is operator-owned. Requests cannot provide hosts, paths or credentials.
  if (base.protocol !== 'https:' || base.username || base.password || base.port || base.pathname !== '/' || base.search || base.hash) {
    failure('RESEARCH_CONFIGURATION', 503, 'The research connection requires an HTTPS origin.');
  }
  const url = new URL(`/api/research/${resource}`, base);
  for (const [key, value] of parameters) if (key !== 'resource') url.searchParams.append(key, value);
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json', 'CF-Access-Client-Id': clientId, 'CF-Access-Client-Secret': clientSecret },
    });
  } catch {
    failure('RESEARCH_UNREACHABLE', 503, 'The private research service could not be reached.');
  }
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 400) failure('RESEARCH_FILTERS', 400, 'The research service rejected these filters.');
    failure('RESEARCH_UPSTREAM', 503, 'The private research service is unavailable or access was refused.');
  }
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json') || !response.body) {
    await response.body?.cancel();
    failure('RESEARCH_PROTOCOL', 503, 'The research service did not return its data contract.');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, text = '';
  let payload: unknown;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) failure('RESEARCH_RESPONSE_LIMIT', 503, 'The research response exceeded its bound.');
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    payload = JSON.parse(text);
  } catch (error) {
    if (error instanceof ResearchDatasetError) throw error;
    failure('RESEARCH_PROTOCOL', 503, 'The research response could not be read.');
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  if (!payload || typeof payload !== 'object') failure('RESEARCH_PROTOCOL', 503, 'The research response is invalid.');
  const data = payload as Record<string, unknown>;
  const snapshot = data.snapshot as Record<string, unknown> | undefined;
  if (data.api_version !== API_VERSION || data.status !== 'ready' || data.backend !== 'd1' || data.read_only !== true
      || !snapshot || typeof snapshot.id !== 'string' || !/^[a-f0-9]{64}$/.test(snapshot.id)
      || typeof snapshot.date_start !== 'string' || typeof snapshot.date_end !== 'string') {
    failure('RESEARCH_PROTOCOL', 503, 'The research service is not a ready, versioned D1 snapshot.');
  }
  return data as ResearchDatasetEnvelope;
}
