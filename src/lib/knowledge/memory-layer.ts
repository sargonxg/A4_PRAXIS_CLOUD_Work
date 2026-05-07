/**
 * PRAXIS Memory Layer — Cognee adapter facade.
 *
 * This layer is probabilistic and disabled by default. It can enrich recall,
 * but it is never authoritative for ACO graph facts.
 */

export type MemoryLayerMode = 'postgres-kuzu' | 'neo4j' | 'postgres-only-vector' | 'disabled';

export interface MemoryScope {
  ownerUid: string;
  caseId: string;
  sessionId?: string;
}

export interface MemoryHit {
  id: string;
  text: string;
  score: number;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryLayerHealth {
  enabled: boolean;
  mode: MemoryLayerMode;
  ready: boolean;
  reason?: string;
}

export function cogneeDatasetFor(scope: Pick<MemoryScope, 'ownerUid' | 'caseId'>): string {
  if (!scope.ownerUid || !scope.caseId) {
    throw new Error('Cognee memory scope requires ownerUid and caseId');
  }
  return `${scope.ownerUid}__${scope.caseId}`;
}

export class MemoryLayer {
  constructor(private readonly scope: MemoryScope) {}

  dataset(): string {
    return cogneeDatasetFor(this.scope);
  }

  async recall(query: string, limit = 10): Promise<MemoryHit[]> {
    if (!query.trim()) return [];
    const response = await fetch('/api/memory/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...this.scope, query, limit }),
    });
    if (response.status === 404 || response.status === 503) return [];
    if (!response.ok) throw new Error(`Memory recall failed: ${response.status}`);
    const payload = (await response.json()) as { hits?: MemoryHit[] };
    return payload.hits ?? [];
  }

  async remember(content: string, sourceId?: string, metadata?: Record<string, unknown>): Promise<boolean> {
    if (!content.trim()) return false;
    const response = await fetch('/api/memory/remember', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...this.scope, content, sourceId, metadata }),
    });
    return response.ok;
  }
}
