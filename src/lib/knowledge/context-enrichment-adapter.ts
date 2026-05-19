import { GoogleAuth } from 'google-auth-library';
import {
  buildTurnCapsule,
  type KernelMemoryItem,
  type TurnCapsule,
  type TurnCapsuleInput,
} from '@/lib/ai/context-kernel';
import type { CapsuleServiceDeps } from '@/lib/context/capsule-service';
import { cogneeDatasetFor, type MemoryHit } from '@/lib/knowledge/memory-layer';

export type ContextEnrichmentCogneeStatus = 'enabled' | 'disabled' | 'degraded';
export type ContextEnrichmentSource = 'firestore' | 'cognee' | 'future_graphiti';

export interface ContextEnrichmentReceipt {
  firestore: 'ready';
  cognee: ContextEnrichmentCogneeStatus;
  graphiti: 'deferred';
  memoryItemIds: string[];
  warnings: string[];
}

export interface ContextEnrichmentState {
  receipt: ContextEnrichmentReceipt;
  memoryHitCount: number;
}

export interface CogneeRecallRequest {
  uid: string;
  capsuleId: string;
  query: string;
  limit: number;
}

export interface CogneeRecallResult {
  status: ContextEnrichmentCogneeStatus;
  hits: MemoryHit[];
  warning?: string;
}

export interface CogneeEnrichmentProvider {
  enabled: boolean;
  recall(input: CogneeRecallRequest): Promise<CogneeRecallResult>;
}

export interface TemporalGraphProvider {
  status(): { status: 'deferred'; enabled: false };
  getTemporalDeltas(): Promise<never>;
}

export interface ContextEnrichmentDeps extends CapsuleServiceDeps {
  cognee?: CogneeEnrichmentProvider;
}

export type EnrichedTurnCapsule = TurnCapsule & { enrichment: ContextEnrichmentState };

let googleAuth: GoogleAuth | null = null;

export async function buildEnrichedTurnCapsule(
  input: TurnCapsuleInput,
  deps?: ContextEnrichmentDeps,
): Promise<EnrichedTurnCapsule> {
  const baseCapsule = await buildTurnCapsule(input, deps);
  const cognee = deps?.cognee ?? createDefaultCogneeEnrichmentProvider();
  if (!input.uid || !input.query?.trim() || !cognee.enabled) {
    return attachEnrichment(baseCapsule, {
      receipt: buildContextEnrichmentReceipt({ cogneeEnabled: false }),
      memoryHitCount: 0,
    });
  }

  try {
    const recall = await cognee.recall({
      uid: input.uid,
      capsuleId: baseCapsule.capsuleId,
      query: input.query,
      limit: 6,
    });
    const memoryItems = recall.hits.map((hit) => cogneeHitToMemoryItem(hit, baseCapsule.capsuleId));
    const enriched = memoryItems.length
      ? await buildTurnCapsule({
          ...input,
          capsuleId: baseCapsule.capsuleId,
          memoryItems: [...(input.memoryItems ?? []), ...memoryItems],
        }, deps)
      : baseCapsule;
    return attachEnrichment(enriched, {
      receipt: buildContextEnrichmentReceipt({
        cogneeEnabled: recall.status === 'enabled',
        cogneeStatus: recall.status,
        memoryItemIds: memoryItems.map((item) => item.id),
        warnings: recall.warning ? [recall.warning] : [],
      }),
      memoryHitCount: memoryItems.length,
    });
  } catch (err) {
    return attachEnrichment(baseCapsule, {
      receipt: buildContextEnrichmentReceipt({
        cogneeEnabled: true,
        cogneeStatus: 'degraded',
        warnings: [`Cognee recall degraded: ${err instanceof Error ? err.message : String(err)}`],
      }),
      memoryHitCount: 0,
    });
  }
}

export function buildContextEnrichmentReceipt(input: {
  cogneeEnabled: boolean;
  cogneeStatus?: ContextEnrichmentCogneeStatus;
  memoryItemIds?: string[];
  warnings?: string[];
}): ContextEnrichmentReceipt {
  return {
    firestore: 'ready',
    cognee: input.cogneeStatus ?? (input.cogneeEnabled ? 'enabled' : 'disabled'),
    graphiti: 'deferred',
    memoryItemIds: input.memoryItemIds ?? [],
    warnings: input.warnings ?? [],
  };
}

export function createDisabledTemporalGraphProvider(): TemporalGraphProvider {
  return {
    status: () => ({ status: 'deferred', enabled: false }),
    async getTemporalDeltas(): Promise<never> {
      throw new Error('Graphiti temporal provider is deferred and disabled for this PRAXIS wave.');
    },
  };
}

export function createDefaultCogneeEnrichmentProvider(env: NodeJS.ProcessEnv = process.env): CogneeEnrichmentProvider {
  const backendUrl = env.COGNEE_BACKEND_URL?.replace(/\/$/, '');
  const enabled = env.COGNEE_ENABLED === 'true' && Boolean(backendUrl);
  return {
    enabled,
    async recall(input) {
      if (!enabled || !backendUrl) return { status: 'disabled', hits: [] };
      const response = await fetch(`${backendUrl}/v1/memory/recall`, {
        method: 'POST',
        headers: await cogneeHeaders(input.uid, input.capsuleId, backendUrl),
        body: JSON.stringify({
          uid: input.uid,
          caseId: input.capsuleId,
          capsuleId: input.capsuleId,
          query: input.query,
          limit: input.limit,
        }),
      });
      if (!response.ok) {
        return { status: 'degraded', hits: [], warning: `Cognee recall returned HTTP ${response.status}` };
      }
      const payload = await response.json().catch(() => ({})) as { hits?: MemoryHit[]; status?: string };
      if (payload.status === 'memory_layer_disabled') return { status: 'disabled', hits: [] };
      return {
        status: 'enabled',
        hits: Array.isArray(payload.hits) ? payload.hits.slice(0, input.limit) : [],
      };
    },
  };
}

function attachEnrichment(capsule: TurnCapsule, enrichment: ContextEnrichmentState): EnrichedTurnCapsule {
  return { ...capsule, enrichment };
}

async function cogneeHeaders(uid: string, capsuleId: string, backendUrl: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-PRAXIS-UID': uid,
    'X-PRAXIS-CASE-ID': capsuleId,
    'X-PRAXIS-MEMORY-DATASET': cogneeDatasetFor({ ownerUid: uid, caseId: capsuleId }),
  };
  try {
    googleAuth ??= new GoogleAuth();
    const client = await googleAuth.getIdTokenClient(backendUrl);
    const authHeaders = (await client.getRequestHeaders()) as unknown as Record<string, string>;
    const authorization = authHeaders.Authorization ?? authHeaders.authorization;
    if (authorization) headers.Authorization = String(authorization);
  } catch {
    // Local development without ADC can still exercise disabled/degraded paths.
  }
  return headers;
}

function cogneeHitToMemoryItem(hit: MemoryHit, capsuleId: string): KernelMemoryItem {
  return {
    id: `cognee:${hit.id}`,
    type: 'semantic',
    text: hit.text,
    capsuleId,
    updatedAt: typeof hit.metadata?.updatedAt === 'string' ? hit.metadata.updatedAt : undefined,
  };
}
