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

export interface AdvisoryMemoryCandidate extends MemoryHit {
  confidence: number;
  canonical: false;
  provenance: string;
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
    const payload = (await response.json()) as { hits?: MemoryHit[]; candidates?: MemoryHit[] };
    return normalizeMemoryHits(payload.hits ?? payload.candidates ?? []);
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

export async function recallAdvisoryMemory(
  uid: string,
  capsule: {
    capsuleId: string;
    ownerUid?: string;
    label?: string;
    summary?: string;
    memoryPosture?: unknown;
    v3?: { memoryPosture?: { cogneeDatasetId?: string; advisoryCogneeRecall?: string[]; cogneeMode?: string } };
  },
  options: {
    query?: string;
    limit?: number;
    enabled?: boolean;
    fetcher?: typeof fetch;
  } = {},
): Promise<{
  status: 'disabled' | 'enabled' | 'degraded';
  candidates: AdvisoryMemoryCandidate[];
  capsule: typeof capsule;
}> {
  const enabled = options.enabled ?? isCogneeEnabledForClient();
  if (!enabled) return { status: 'disabled', candidates: [], capsule };
  const fetcher = options.fetcher ?? fetch;
  const query = (options.query ?? capsule.summary ?? capsule.label ?? capsule.capsuleId).trim();
  if (!query) return { status: 'disabled', candidates: [], capsule };
  try {
    const response = await fetcher('/api/memory/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        caseId: capsule.capsuleId,
        capsuleId: capsule.capsuleId,
        dataset: capsule.v3?.memoryPosture?.cogneeDatasetId ?? cogneeDatasetFor({ ownerUid: uid, caseId: capsule.capsuleId }),
        query,
        k: options.limit ?? 6,
        limit: options.limit ?? 6,
      }),
    });
    if (!response.ok) return { status: 'degraded', candidates: [], capsule };
    const payload = (await response.json().catch(() => ({}))) as { status?: string; hits?: MemoryHit[]; candidates?: MemoryHit[] };
    const rawCandidates = normalizeMemoryHits(payload.candidates ?? payload.hits ?? []);
    const candidates = rawCandidates.map(toAdvisoryCandidate).slice(0, options.limit ?? 6);
    if (payload.status === 'disabled' || payload.status === 'memory_layer_disabled') {
      return { status: 'disabled', candidates: [], capsule };
    }
    return {
      status: candidates.length ? 'enabled' : 'disabled',
      candidates,
      capsule: withAdvisoryRecall(capsule, candidates),
    };
  } catch {
    return { status: 'degraded', candidates: [], capsule };
  }
}

function normalizeMemoryHits(values: MemoryHit[]): MemoryHit[] {
  if (!Array.isArray(values)) return [];
  return values.flatMap((hit): MemoryHit[] => {
    if (!hit || typeof hit !== 'object' || typeof hit.text !== 'string') return [];
    return [{
      id: String(hit.id || 'cognee-candidate'),
      text: hit.text,
      score: capCogneeConfidence(hit.score),
      sourceId: typeof hit.sourceId === 'string' ? hit.sourceId : undefined,
      metadata: hit.metadata && typeof hit.metadata === 'object' ? hit.metadata : {},
    }];
  });
}

function toAdvisoryCandidate(hit: MemoryHit): AdvisoryMemoryCandidate {
  const provenance = hit.sourceId
    ?? (typeof hit.metadata?.sourceId === 'string' ? hit.metadata.sourceId : null)
    ?? (typeof hit.metadata?.documentId === 'string' ? hit.metadata.documentId : null)
    ?? 'cognee';
  const confidence = capCogneeConfidence(hit.score);
  return {
    ...hit,
    score: confidence,
    confidence,
    canonical: false,
    provenance,
  };
}

function withAdvisoryRecall<T extends { memoryPosture?: unknown; v3?: { memoryPosture?: Record<string, unknown> } }>(
  capsule: T,
  candidates: AdvisoryMemoryCandidate[],
): T {
  const existing = isRecord(capsule.v3?.memoryPosture) ? capsule.v3?.memoryPosture : {};
  const advisoryCogneeRecall = uniqueStrings([
    ...stringArray(existing.advisoryCogneeRecall),
    ...candidates.map(formatAdvisoryCandidate),
  ]).slice(0, 20);
  return {
    ...capsule,
    memoryPosture: {
      ...existing,
      advisoryCogneeRecall,
      cogneeMode: 'advisory-only',
    },
    v3: capsule.v3
      ? {
        ...capsule.v3,
        memoryPosture: {
          ...existing,
          advisoryCogneeRecall,
          cogneeMode: 'advisory-only',
        },
      }
      : capsule.v3,
  };
}

export function formatAdvisoryCandidate(candidate: Pick<AdvisoryMemoryCandidate, 'text' | 'confidence' | 'provenance'>): string {
  return `${candidate.text.trim()} (confidence ${capCogneeConfidence(candidate.confidence).toFixed(3)}; provenance ${candidate.provenance})`;
}

function capCogneeConfidence(value: unknown): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.round(Math.max(0, Math.min(numeric, 0.6)) * 1000) / 1000;
}

function isCogneeEnabledForClient(): boolean {
  return process.env.COGNEE_ENABLED === 'true'
    || process.env.NEXT_PUBLIC_COGNEE_ENABLED === 'true';
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
