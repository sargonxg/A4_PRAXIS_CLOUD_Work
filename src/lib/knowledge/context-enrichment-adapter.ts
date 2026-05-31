import { GoogleAuth } from 'google-auth-library';
import {
  buildTurnCapsule,
  type KernelMemoryItem,
  type TurnCapsule,
  type TurnCapsuleInput,
} from '@/lib/ai/context-kernel';
import type { CapsuleServiceDeps } from '@/lib/context/capsule-service';
import { cogneeDatasetFor, type MemoryHit } from '@/lib/knowledge/memory-layer';
import {
  TrustGraphRecallResponseSchema,
  buildTrustGraphCollectionId,
  buildTrustGraphWorkspaceId,
} from '@/lib/knowledge/trustgraph-contract';
import {
  GraphLiteRecallResponseSchema,
  buildGraphLiteCollectionId,
  buildGraphLiteWorkspaceId,
} from '@/lib/knowledge/graphlite-contract';

export type ContextEnrichmentCogneeStatus = 'enabled' | 'disabled' | 'degraded';
export type ContextEnrichmentTrustGraphStatus = 'enabled' | 'disabled' | 'degraded';
export type ContextEnrichmentGraphLiteStatus = 'enabled' | 'disabled' | 'degraded';
export type ContextEnrichmentSource = 'firestore' | 'cognee' | 'trustgraph' | 'graphlite' | 'future_graphiti';

export interface ContextEnrichmentReceipt {
  firestore: 'ready';
  canonicalStatus: 'firestore-canonical';
  cognee: ContextEnrichmentCogneeStatus;
  trustgraph: ContextEnrichmentTrustGraphStatus;
  graphlite: ContextEnrichmentGraphLiteStatus;
  graphiti: 'deferred';
  memoryItemIds: string[];
  usedMemoryItemIds: string[];
  ignoredMemoryItemIds: string[];
  memoryHitCount: number;
  trustgraphItemIds: string[];
  usedTrustGraphItemIds: string[];
  ignoredTrustGraphItemIds: string[];
  trustgraphHitCount: number;
  graphliteItemIds: string[];
  usedGraphLiteItemIds: string[];
  ignoredGraphLiteItemIds: string[];
  graphliteHitCount: number;
  graphCandidateIds: string[];
  explainabilityIds: string[];
  writebackProposalIds: string[];
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

export interface TrustGraphRecallRequest {
  uid: string;
  capsuleId: string;
  query: string;
  limit: number;
}

export interface TrustGraphRecallResult {
  status: ContextEnrichmentTrustGraphStatus;
  hits: MemoryHit[];
  graphCandidateIds?: string[];
  explainabilityIds?: string[];
  warning?: string;
}

export interface GraphLiteRecallRequest {
  uid: string;
  capsuleId: string;
  query: string;
  limit: number;
}

export interface GraphLiteRecallResult {
  status: ContextEnrichmentGraphLiteStatus;
  hits: MemoryHit[];
  graphCandidateIds?: string[];
  explainabilityIds?: string[];
  warning?: string;
}

export interface CogneeEnrichmentProvider {
  enabled: boolean;
  recall(input: CogneeRecallRequest): Promise<CogneeRecallResult>;
}

export interface TrustGraphEnrichmentProvider {
  enabled: boolean;
  recall(input: TrustGraphRecallRequest): Promise<TrustGraphRecallResult>;
}

export interface GraphLiteEnrichmentProvider {
  enabled: boolean;
  recall(input: GraphLiteRecallRequest): Promise<GraphLiteRecallResult>;
}

export interface TemporalGraphProvider {
  status(): { status: 'deferred'; enabled: false };
  getTemporalDeltas(): Promise<never>;
}

export interface ContextEnrichmentDeps extends CapsuleServiceDeps {
  cognee?: CogneeEnrichmentProvider;
  trustgraph?: TrustGraphEnrichmentProvider;
  graphlite?: GraphLiteEnrichmentProvider;
}

export type EnrichedTurnCapsule = TurnCapsule & { enrichment: ContextEnrichmentState };

let googleAuth: GoogleAuth | null = null;

export async function buildEnrichedTurnCapsule(
  input: TurnCapsuleInput,
  deps?: ContextEnrichmentDeps,
): Promise<EnrichedTurnCapsule> {
  const baseCapsule = await buildTurnCapsule(input, deps);
  const cognee = deps?.cognee ?? createDefaultCogneeEnrichmentProvider();
  const trustgraph = deps?.trustgraph ?? createDefaultTrustGraphEnrichmentProvider();
  const graphlite = deps?.graphlite ?? createDefaultGraphLiteEnrichmentProvider();
  const query = input.query?.trim();
  if (!input.uid || !query) {
    return attachEnrichment(baseCapsule, {
      receipt: buildContextEnrichmentReceipt({
        cogneeEnabled: false,
        trustgraphEnabled: false,
        graphliteEnabled: false,
      }),
      memoryHitCount: 0,
    });
  }

  const memoryItems: KernelMemoryItem[] = [];
  const warnings: string[] = [];
  let cogneeStatus: ContextEnrichmentCogneeStatus = cognee.enabled ? 'enabled' : 'disabled';
  let trustgraphStatus: ContextEnrichmentTrustGraphStatus = trustgraph.enabled ? 'enabled' : 'disabled';
  let graphliteStatus: ContextEnrichmentGraphLiteStatus = graphlite.enabled ? 'enabled' : 'disabled';
  let cogneeMemoryIds: string[] = [];
  let ignoredMemoryItemIds: string[] = [];
  let trustgraphItemIds: string[] = [];
  let ignoredTrustGraphItemIds: string[] = [];
  let graphliteItemIds: string[] = [];
  let ignoredGraphLiteItemIds: string[] = [];
  let graphCandidateIds: string[] = [];
  let explainabilityIds: string[] = [];

  if (cognee.enabled) {
    try {
      const recall = await cognee.recall({
        uid: input.uid,
        capsuleId: baseCapsule.capsuleId,
        query,
        limit: 6,
      });
      cogneeStatus = recall.status;
      const usableHits = recall.hits.filter(isUsableAdvisoryHit);
      const ignoredHits = recall.hits.filter((hit) => !isUsableAdvisoryHit(hit));
      const cogneeMemoryItems = usableHits.map((hit) => advisoryHitToMemoryItem('cognee', hit, baseCapsule.capsuleId));
      cogneeMemoryIds = cogneeMemoryItems.map((item) => item.id);
      ignoredMemoryItemIds = ignoredHits.map((hit) => `cognee:${hit.id}`);
      memoryItems.push(...cogneeMemoryItems);
      if (recall.warning) warnings.push(recall.warning);
      if (ignoredMemoryItemIds.length) warnings.push(`Ignored Cognee hits without provenance: ${ignoredMemoryItemIds.join(', ')}`);
    } catch (err) {
      cogneeStatus = 'degraded';
      warnings.push(`Cognee recall degraded: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (trustgraph.enabled) {
    try {
      const recall = await trustgraph.recall({
        uid: input.uid,
        capsuleId: baseCapsule.capsuleId,
        query,
        limit: 6,
      });
      trustgraphStatus = recall.status;
      const usableHits = recall.hits.filter(isUsableAdvisoryHit);
      const ignoredHits = recall.hits.filter((hit) => !isUsableAdvisoryHit(hit));
      const trustgraphMemoryItems = usableHits.map((hit) => advisoryHitToMemoryItem('trustgraph', hit, baseCapsule.capsuleId));
      trustgraphItemIds = trustgraphMemoryItems.map((item) => item.id);
      ignoredTrustGraphItemIds = ignoredHits.map((hit) => `trustgraph:${hit.id}`);
      graphCandidateIds = uniqueStrings(recall.graphCandidateIds ?? []);
      explainabilityIds = uniqueStrings(recall.explainabilityIds ?? []);
      memoryItems.push(...trustgraphMemoryItems);
      if (recall.warning) warnings.push(recall.warning);
      if (ignoredTrustGraphItemIds.length) warnings.push(`Ignored TrustGraph hits without provenance: ${ignoredTrustGraphItemIds.join(', ')}`);
    } catch (err) {
      trustgraphStatus = 'degraded';
      warnings.push(`TrustGraph recall degraded: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (graphlite.enabled) {
    try {
      const recall = await graphlite.recall({
        uid: input.uid,
        capsuleId: baseCapsule.capsuleId,
        query,
        limit: 6,
      });
      graphliteStatus = recall.status;
      const usableHits = recall.hits.filter(isUsableAdvisoryHit);
      const ignoredHits = recall.hits.filter((hit) => !isUsableAdvisoryHit(hit));
      const graphliteMemoryItems = usableHits.map((hit) => advisoryHitToMemoryItem('graphlite', hit, baseCapsule.capsuleId));
      graphliteItemIds = graphliteMemoryItems.map((item) => item.id);
      ignoredGraphLiteItemIds = ignoredHits.map((hit) => `graphlite:${hit.id}`);
      graphCandidateIds = uniqueStrings([...graphCandidateIds, ...(recall.graphCandidateIds ?? [])]);
      explainabilityIds = uniqueStrings([...explainabilityIds, ...(recall.explainabilityIds ?? [])]);
      memoryItems.push(...graphliteMemoryItems);
      if (recall.warning) warnings.push(recall.warning);
      if (ignoredGraphLiteItemIds.length) warnings.push(`Ignored GraphLite hits without provenance: ${ignoredGraphLiteItemIds.join(', ')}`);
    } catch (err) {
      graphliteStatus = 'degraded';
      warnings.push(`GraphLite recall degraded: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const enriched = memoryItems.length
    ? await buildTurnCapsule({
        ...input,
        capsuleId: baseCapsule.capsuleId,
        memoryItems: [...(input.memoryItems ?? []), ...memoryItems],
      }, deps)
    : baseCapsule;

  return attachEnrichment(enriched, {
    receipt: buildContextEnrichmentReceipt({
      cogneeEnabled: cognee.enabled,
      cogneeStatus,
      trustgraphEnabled: trustgraph.enabled,
      trustgraphStatus,
      graphliteEnabled: graphlite.enabled,
      graphliteStatus,
      memoryItemIds: cogneeMemoryIds,
      usedMemoryItemIds: cogneeMemoryIds,
      ignoredMemoryItemIds,
      trustgraphItemIds,
      usedTrustGraphItemIds: trustgraphItemIds,
      ignoredTrustGraphItemIds,
      graphliteItemIds,
      usedGraphLiteItemIds: graphliteItemIds,
      ignoredGraphLiteItemIds,
      graphCandidateIds,
      explainabilityIds,
      writebackProposalIds: [
        ...cogneeMemoryIds.map((id) => `review-card:${id}`),
        ...trustgraphItemIds.map((id) => `review-card:${id}`),
        ...graphliteItemIds.map((id) => `review-card:${id}`),
        ...graphCandidateIds,
      ],
      warnings,
    }),
    memoryHitCount: memoryItems.length,
  });
}

export function buildContextEnrichmentReceipt(input: {
  cogneeEnabled: boolean;
  cogneeStatus?: ContextEnrichmentCogneeStatus;
  trustgraphEnabled?: boolean;
  trustgraphStatus?: ContextEnrichmentTrustGraphStatus;
  graphliteEnabled?: boolean;
  graphliteStatus?: ContextEnrichmentGraphLiteStatus;
  memoryItemIds?: string[];
  usedMemoryItemIds?: string[];
  ignoredMemoryItemIds?: string[];
  trustgraphItemIds?: string[];
  usedTrustGraphItemIds?: string[];
  ignoredTrustGraphItemIds?: string[];
  graphliteItemIds?: string[];
  usedGraphLiteItemIds?: string[];
  ignoredGraphLiteItemIds?: string[];
  graphCandidateIds?: string[];
  explainabilityIds?: string[];
  writebackProposalIds?: string[];
  warnings?: string[];
}): ContextEnrichmentReceipt {
  const memoryItemIds = input.memoryItemIds ?? [];
  const usedMemoryItemIds = input.usedMemoryItemIds ?? memoryItemIds;
  const ignoredMemoryItemIds = input.ignoredMemoryItemIds ?? [];
  const trustgraphItemIds = input.trustgraphItemIds ?? [];
  const usedTrustGraphItemIds = input.usedTrustGraphItemIds ?? trustgraphItemIds;
  const ignoredTrustGraphItemIds = input.ignoredTrustGraphItemIds ?? [];
  const graphliteItemIds = input.graphliteItemIds ?? [];
  const usedGraphLiteItemIds = input.usedGraphLiteItemIds ?? graphliteItemIds;
  const ignoredGraphLiteItemIds = input.ignoredGraphLiteItemIds ?? [];
  return {
    firestore: 'ready',
    canonicalStatus: 'firestore-canonical',
    cognee: input.cogneeStatus ?? (input.cogneeEnabled ? 'enabled' : 'disabled'),
    trustgraph: input.trustgraphStatus ?? (input.trustgraphEnabled ? 'enabled' : 'disabled'),
    graphlite: input.graphliteStatus ?? (input.graphliteEnabled ? 'enabled' : 'disabled'),
    graphiti: 'deferred',
    memoryItemIds,
    usedMemoryItemIds,
    ignoredMemoryItemIds,
    memoryHitCount: usedMemoryItemIds.length,
    trustgraphItemIds,
    usedTrustGraphItemIds,
    ignoredTrustGraphItemIds,
    trustgraphHitCount: usedTrustGraphItemIds.length,
    graphliteItemIds,
    usedGraphLiteItemIds,
    ignoredGraphLiteItemIds,
    graphliteHitCount: usedGraphLiteItemIds.length,
    graphCandidateIds: input.graphCandidateIds ?? [],
    explainabilityIds: input.explainabilityIds ?? [],
    writebackProposalIds: input.writebackProposalIds ?? [],
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
        headers: await advisoryServiceHeaders(input.uid, input.capsuleId, backendUrl, {
          'X-PRAXIS-MEMORY-DATASET': cogneeDatasetFor({ ownerUid: input.uid, caseId: input.capsuleId }),
        }),
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

export function createDefaultTrustGraphEnrichmentProvider(env: NodeJS.ProcessEnv = process.env): TrustGraphEnrichmentProvider {
  const backendUrl = env.TRUSTGRAPH_BACKEND_URL?.replace(/\/$/, '');
  const enabled = env.TRUSTGRAPH_ENABLED === 'true' && Boolean(backendUrl);
  const workspaceMode = env.TRUSTGRAPH_WORKSPACE_MODE ?? 'owner-capsule';
  const collectionPrefix = env.TRUSTGRAPH_COLLECTION_PREFIX ?? 'praxis';
  return {
    enabled,
    async recall(input) {
      if (!enabled || !backendUrl) return { status: 'disabled', hits: [] };
      const workspaceId = buildTrustGraphWorkspaceId({ uid: input.uid, capsuleId: input.capsuleId, mode: workspaceMode });
      const collectionId = buildTrustGraphCollectionId({ uid: input.uid, capsuleId: input.capsuleId, prefix: collectionPrefix });
      const response = await fetch(`${backendUrl}/v1/capsules/recall`, {
        method: 'POST',
        headers: await advisoryServiceHeaders(input.uid, input.capsuleId, backendUrl, {
          'X-PRAXIS-TRUSTGRAPH-WORKSPACE': workspaceId,
          'X-PRAXIS-TRUSTGRAPH-COLLECTION': collectionId,
        }),
        body: JSON.stringify({
          uid: input.uid,
          capsuleId: input.capsuleId,
          workspaceId,
          collectionId,
          query: input.query,
          limit: input.limit,
          includeExplainability: true,
          advisoryOnly: true,
        }),
      });
      if (!response.ok) {
        return { status: 'degraded', hits: [], warning: `TrustGraph recall returned HTTP ${response.status}` };
      }
      const payload = TrustGraphRecallResponseSchema.safeParse(await response.json().catch(() => ({})));
      if (!payload.success) {
        return { status: 'degraded', hits: [], warning: 'TrustGraph recall returned an invalid contract payload' };
      }
      return {
        status: payload.data.status,
        hits: payload.data.hits.slice(0, input.limit),
        graphCandidateIds: payload.data.graphCandidateIds,
        explainabilityIds: payload.data.explainabilityIds,
        warning: payload.data.warning,
      };
    },
  };
}

export function createDefaultGraphLiteEnrichmentProvider(env: NodeJS.ProcessEnv = process.env): GraphLiteEnrichmentProvider {
  const backendUrl = env.GRAPHLITE_BACKEND_URL?.replace(/\/$/, '');
  const enabled = env.GRAPHLITE_ENABLED === 'true' && Boolean(backendUrl);
  const workspaceMode = env.GRAPHLITE_WORKSPACE_MODE ?? 'owner-capsule';
  const collectionPrefix = env.GRAPHLITE_COLLECTION_PREFIX ?? 'praxis';
  return {
    enabled,
    async recall(input) {
      if (!enabled || !backendUrl) return { status: 'disabled', hits: [] };
      const workspaceId = buildGraphLiteWorkspaceId({ uid: input.uid, capsuleId: input.capsuleId, mode: workspaceMode });
      const collectionId = buildGraphLiteCollectionId({ uid: input.uid, capsuleId: input.capsuleId, prefix: collectionPrefix });
      const response = await fetch(`${backendUrl}/v1/capsules/recall`, {
        method: 'POST',
        headers: await advisoryServiceHeaders(input.uid, input.capsuleId, backendUrl, {
          'X-PRAXIS-GRAPHLITE-WORKSPACE': workspaceId,
          'X-PRAXIS-GRAPHLITE-COLLECTION': collectionId,
        }),
        body: JSON.stringify({
          uid: input.uid,
          capsuleId: input.capsuleId,
          workspaceId,
          collectionId,
          query: input.query,
          limit: input.limit,
          includeExplainability: true,
          advisoryOnly: true,
        }),
      });
      if (!response.ok) {
        return { status: 'degraded', hits: [], warning: `GraphLite recall returned HTTP ${response.status}` };
      }
      const payload = GraphLiteRecallResponseSchema.safeParse(await response.json().catch(() => ({})));
      if (!payload.success) {
        return { status: 'degraded', hits: [], warning: 'GraphLite recall returned an invalid contract payload' };
      }
      return {
        status: payload.data.status,
        hits: payload.data.hits.slice(0, input.limit),
        graphCandidateIds: payload.data.graphCandidateIds,
        explainabilityIds: payload.data.explainabilityIds,
        warning: payload.data.warning,
      };
    },
  };
}

function attachEnrichment(capsule: TurnCapsule, enrichment: ContextEnrichmentState): EnrichedTurnCapsule {
  return { ...capsule, enrichment };
}

async function advisoryServiceHeaders(
  uid: string,
  capsuleId: string,
  backendUrl: string,
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-PRAXIS-UID': uid,
    'X-PRAXIS-CASE-ID': capsuleId,
    'X-PRAXIS-CAPSULE-ID': capsuleId,
    ...extra,
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

function advisoryHitToMemoryItem(source: 'cognee' | 'trustgraph' | 'graphlite', hit: MemoryHit, capsuleId: string): KernelMemoryItem {
  return {
    id: `${source}:${hit.id}`,
    type: 'semantic',
    text: hit.text,
    capsuleId,
    updatedAt: typeof hit.metadata?.updatedAt === 'string' ? hit.metadata.updatedAt : undefined,
  };
}

function isUsableAdvisoryHit(hit: MemoryHit): boolean {
  return Boolean(hit.text?.trim()) && hasAdvisoryProvenance(hit);
}

function hasAdvisoryProvenance(hit: MemoryHit): boolean {
  if (typeof hit.sourceId === 'string' && hit.sourceId.trim()) return true;
  const metadata = hit.metadata ?? {};
  return [
    metadata.sourceId,
    metadata.sourceIds,
    metadata.documentId,
    metadata.documentIds,
    metadata.runId,
    metadata.runIds,
    metadata.graphCandidateId,
    metadata.graphCandidateIds,
    metadata.pathId,
    metadata.pathIds,
    metadata.explainabilityId,
    metadata.explainabilityIds,
  ].some(hasStringProvenance);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((item) => item.trim().length > 0)));
}

function hasStringProvenance(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  return Array.isArray(value) && value.some((item) => typeof item === 'string' && item.trim().length > 0);
}
