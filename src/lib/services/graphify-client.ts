/**
 * Graphify Client — Integration with safishamsi/graphify
 *
 * Premium graph backend option for PRAXIS providing:
 * - Temporal knowledge graphs with bi-temporal support
 * - ACO-native entity types
 * - Built-in conflict analysis functions
 * - Graph diff and evolution tracking
 *
 * Configuration stored in Firestore:
 *   users/{uid}/settings/graph_backend
 *   { provider: 'graphify', endpoint: '...', apiKey: '...', projectId: '...' }
 */

export interface GraphifyConfig {
  endpoint: string;
  apiKey: string;
  projectId: string;
}

export interface GraphifyNode {
  id: string;
  label: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface GraphifyEdge {
  source: string;
  target: string;
  type: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export class GraphifyClient {
  private config: GraphifyConfig;

  constructor(config: GraphifyConfig) {
    this.config = config;
  }

  private headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Project-ID': this.config.projectId,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.endpoint}/health`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async pushGraph(
    situationId: string,
    nodes: GraphifyNode[],
    edges: GraphifyEdge[],
  ): Promise<{ nodeCount: number; edgeCount: number }> {
    const res = await fetch(`${this.config.endpoint}/api/v1/graphs/${situationId}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ nodes, edges, timestamp: new Date().toISOString() }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`Graphify push failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  async getGraph(situationId: string): Promise<{ nodes: GraphifyNode[]; edges: GraphifyEdge[] }> {
    const res = await fetch(`${this.config.endpoint}/api/v1/graphs/${situationId}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Graphify get failed: ${res.status}`);
    return res.json();
  }

  async queryGraph(situationId: string, query: string): Promise<unknown> {
    const res = await fetch(`${this.config.endpoint}/api/v1/graphs/${situationId}/query`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`Graphify query failed: ${res.status}`);
    return res.json();
  }

  async getEvolution(
    situationId: string,
    from: string,
    to: string,
  ): Promise<{
    addedNodes: GraphifyNode[];
    removedNodes: string[];
    addedEdges: GraphifyEdge[];
    removedEdges: string[];
    modifiedNodes: Array<{ id: string; changes: Record<string, unknown> }>;
  }> {
    const res = await fetch(
      `${this.config.endpoint}/api/v1/graphs/${situationId}/evolution?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new Error(`Graphify evolution failed: ${res.status}`);
    return res.json();
  }

  async getAnalysis(situationId: string): Promise<{
    pivotActors: unknown[];
    hiddenLinkages: unknown[];
    factionMap: unknown;
    escalation: unknown;
  }> {
    const res = await fetch(
      `${this.config.endpoint}/api/v1/graphs/${situationId}/analysis`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new Error(`Graphify analysis failed: ${res.status}`);
    return res.json();
  }
}

/**
 * Create a GraphifyClient from user settings stored in Firestore.
 * Returns null if Graphify is not configured.
 */
export function createGraphifyClient(settings: {
  provider?: string;
  endpoint?: string;
  apiKey?: string;
  projectId?: string;
}): GraphifyClient | null {
  if (
    settings.provider !== 'graphify' ||
    !settings.endpoint ||
    !settings.apiKey ||
    !settings.projectId
  ) {
    return null;
  }

  return new GraphifyClient({
    endpoint: settings.endpoint,
    apiKey: settings.apiKey,
    projectId: settings.projectId,
  });
}
