/**
 * PRAXIS Python Backend client — CLIENT-SIDE facade.
 *
 * React components call the authenticated Next.js proxy at /api/backend/*.
 * The proxy attaches Cloud Run OIDC plus X-PRAXIS-UID server-side so the
 * private Python backend never needs to be exposed to browsers.
 *
 * For server-side API routes → backend calls, use callBackend() from
 * src/lib/api/praxis-backend-server.ts instead (OIDC-authenticated).
 */
async function backendFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`/api/backend${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Backend error ${res.status}: ${body}`);
  }

  return res.json();
}

type Source = { type: 'url' | 'text' | 'file'; content: string; filename?: string };

export const praxisBackend = {
  /** Run full pipeline: extract → build → cluster → analyze → sync */
  runPipeline: (sitId: string, sources: Source[]) =>
    backendFetch('/pipeline/run', {
      method: 'POST',
      body: JSON.stringify({ situation_id: sitId, sources }),
    }),

  /** Ingest a single URL into the existing graph */
  ingestUrl: (sitId: string, url: string) =>
    backendFetch('/pipeline/ingest-url', {
      method: 'POST',
      body: JSON.stringify({ situation_id: sitId, url }),
    }),

  /** Pull grounded-search and public corroborating feeds for the situation region */
  ingestFeeds: (sitId: string) =>
    backendFetch('/pipeline/ingest-feeds', {
      method: 'POST',
      body: JSON.stringify({ situation_id: sitId }),
    }),

  /** Get graph snapshot (nodes + edges + analysis) */
  getGraph: (sitId: string) => backendFetch(`/graph/${sitId}`),

  /** Keyword-based graph traversal query */
  queryGraph: (sitId: string, question: string) =>
    backendFetch(`/graph/${sitId}/query`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  /** Get interactive HTML visualization URL */
  getVisualizationUrl: (sitId: string) =>
    `/api/backend/graph/${sitId}/visualization`,

  /** Get full actor profile from graph */
  getActorProfile: (sitId: string, actorId: string) =>
    backendFetch(`/graph/${sitId}/actor/${actorId}`),

  /** Get shortest path between two entities */
  getPath: (sitId: string, source: string, target: string) =>
    backendFetch(`/graph/${sitId}/path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`),

  // Analysis endpoints
  getPivotActors: (sitId: string) => backendFetch(`/analyze/${sitId}/pivot-actors`),
  getHiddenLinkages: (sitId: string) => backendFetch(`/analyze/${sitId}/hidden-linkages`),
  getEscalation: (sitId: string) => backendFetch(`/analyze/${sitId}/escalation`),
  getFactions: (sitId: string) => backendFetch(`/analyze/${sitId}/factions`),
  getNegotiationSpace: (sitId: string) => backendFetch(`/analyze/${sitId}/negotiation-space`),
  getIntelligenceGaps: (sitId: string) => backendFetch(`/analyze/${sitId}/intelligence-gaps`),
  getBrief: (sitId: string) => backendFetch(`/analyze/${sitId}/brief.json`),

  // Temporal / Graphiti endpoints
  /** Semantic + temporal search over the conflict memory graph */
  temporalSearch: (sitId: string, query: string, numResults = 10, validAt?: string) =>
    backendFetch(`/graph/${sitId}/temporal/search`, {
      method: 'POST',
      body: JSON.stringify({ query, num_results: numResults, valid_at: validAt }),
    }),

  /** Return full fact timeline for a named entity */
  entityTimeline: (sitId: string, entityName: string, limit = 20) =>
    backendFetch(`/graph/${sitId}/temporal/entity/${encodeURIComponent(entityName)}?limit=${limit}`),
};
