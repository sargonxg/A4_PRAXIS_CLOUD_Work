import { getGroundedSearchEvents } from '@/lib/data-feeds/grounded-search-client';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import { fuseSourceResults } from '@/lib/data-feeds/fuse';
import type { SourceConnectorResult } from '@/lib/data-feeds/types';
import type { ContextCapsule } from '@/types/context-capsule';
import type { CorpusItem, CorpusSearchResponse } from '@/types/corpus';

export type CapsuleSourcingLaneId =
  | 'google-search-grounding'
  | 'situation-knowledge-corpus'
  | 'vertex-rag-corpus';

export interface CapsuleSourcingLane {
  id: CapsuleSourcingLaneId;
  label: string;
  enabled: boolean;
  reason: string;
}

export interface CapsuleSourcingPlan {
  capsuleId: string;
  capsuleVersion: string;
  mode: ContextCapsule['sourcing']['mode'];
  lanes: CapsuleSourcingLane[];
  minSourcesPerClaim: number;
  maxUngroundedClaims: number;
  trustRank: ContextCapsule['retrieval']['trustRank'];
  topK: number;
  corpora: string[];
  allowedDomains: string[];
  blockedDomains: string[];
  requiredSourceTypes: string[];
  recencyWindowDays?: number;
}

export interface CapsuleContextRetrievalInput {
  uid: string;
  situationId: string;
  query: string;
  capsule: ContextCapsule;
  deps?: Partial<CapsuleContextRetrievalDeps>;
}

export interface CapsuleContextRetrievalDeps {
  groundedSearch: typeof getGroundedSearchEvents;
  searchCorpus: typeof searchSituationCorpus;
  retrieveVertexRag: (input: {
    query: string;
    corpusNames: string[];
    topK: number;
    vectorIndex?: string;
  }) => Promise<SourceConnectorResult[]>;
}

export interface CapsuleContextRetrievalResult {
  plan: CapsuleSourcingPlan;
  receipts: SourceConnectorResult[];
  sourceCount: number;
}

export function buildCapsuleSourcingPlan(capsule: ContextCapsule): CapsuleSourcingPlan {
  const mode = capsule.sourcing.mode;
  const retrievalMode = capsule.retrieval.mode;
  const wantsLive = mode === 'live-search' || mode === 'hybrid' || retrievalMode === 'live-search' || retrievalMode === 'hybrid';
  const wantsSkc = mode === 'skc' || mode === 'corpus' || mode === 'hybrid' || retrievalMode === 'skc' || retrievalMode === 'corpus' || retrievalMode === 'hybrid';
  const wantsRag = capsule.retrieval.corpora.length > 0 && (mode === 'corpus' || mode === 'hybrid' || retrievalMode === 'corpus' || retrievalMode === 'hybrid');

  return {
    capsuleId: capsule.id,
    capsuleVersion: capsule.version,
    mode,
    lanes: ([
      {
        id: 'google-search-grounding',
        label: 'Google Search grounding',
        enabled: wantsLive,
        reason: wantsLive ? 'Sourcing policy allows live search.' : 'Capsule is configured for corpus-only retrieval.',
      },
      {
        id: 'situation-knowledge-corpus',
        label: 'Situation Knowledge Corpus',
        enabled: wantsSkc,
        reason: wantsSkc ? 'Retrieves user receipts, documents, graph notes, and tool outputs.' : 'SKC retrieval is not requested.',
      },
      {
        id: 'vertex-rag-corpus',
        label: 'Vertex AI RAG Engine corpus',
        enabled: wantsRag,
        reason: wantsRag ? 'Capsule declares Vertex RAG corpora.' : 'No Vertex RAG corpus configured.',
      },
    ] satisfies CapsuleSourcingLane[]).filter((lane) => lane.enabled),
    minSourcesPerClaim: capsule.sourcing.minSourcesPerClaim,
    maxUngroundedClaims: capsule.guardrails.maxUngroundedClaims,
    trustRank: capsule.retrieval.trustRank,
    topK: capsule.retrieval.topK,
    corpora: capsule.retrieval.corpora,
    allowedDomains: capsule.sourcing.allowedDomains,
    blockedDomains: capsule.sourcing.blockedDomains,
    requiredSourceTypes: capsule.sourcing.requiredSourceTypes,
    recencyWindowDays: capsule.sourcing.recencyWindowDays,
  };
}

export async function retrieveCapsuleContext(input: CapsuleContextRetrievalInput): Promise<CapsuleContextRetrievalResult> {
  const deps: CapsuleContextRetrievalDeps = {
    groundedSearch: getGroundedSearchEvents,
    searchCorpus: searchSituationCorpus,
    retrieveVertexRag: defaultVertexRagRetriever,
    ...input.deps,
  };
  const plan = buildCapsuleSourcingPlan(input.capsule);
  const work: Promise<SourceConnectorResult[]>[] = [];

  if (plan.lanes.some((lane) => lane.id === 'google-search-grounding')) {
    work.push(deps.groundedSearch({
      query: input.query,
      limit: plan.topK,
    }).then((events) => events.map((event) => ({
      id: `grounding:${event.id}`,
      provider: 'google-search-grounding' as const,
      title: event.title,
      url: event.url,
      snippet: event.description,
      retrievedAt: new Date().toISOString(),
      publishedAt: event.date,
      trustScore: trustForDomain(event.url, input.capsule.sourcing.sourceTrust, 0.8),
      sourceType: event.type,
      metadata: { actors: event.actors, severity: event.severity, location: event.location },
    }))));
  }

  if (plan.lanes.some((lane) => lane.id === 'situation-knowledge-corpus')) {
    work.push(deps.searchCorpus({
      uid: input.uid,
      situationId: input.situationId,
      query: input.query,
      limit: plan.topK,
      checkFreshness: Boolean(plan.recencyWindowDays),
    }).then((response) => corpusToSourceResults(response)));
  }

  if (plan.lanes.some((lane) => lane.id === 'vertex-rag-corpus')) {
    work.push(deps.retrieveVertexRag({
      query: input.query,
      corpusNames: plan.corpora,
      topK: plan.topK,
      vectorIndex: input.capsule.retrieval.vectorIndex,
    }));
  }

  const batches = await Promise.all(work);
  const receipts = fuseSourceResults(batches.flat(), {
    trustRank: plan.trustRank,
    limit: plan.topK,
    allowedDomains: plan.allowedDomains,
    blockedDomains: plan.blockedDomains,
  });

  return {
    plan,
    receipts,
    sourceCount: receipts.length,
  };
}

function corpusToSourceResults(response: CorpusSearchResponse): SourceConnectorResult[] {
  return response.items.map((item) => corpusItemToSourceResult(item));
}

function corpusItemToSourceResult(item: CorpusItem): SourceConnectorResult {
  return {
    id: `skc:${item.sourceType}:${item.sourceId}`,
    provider: 'skc',
    title: item.title,
    url: item.citation,
    snippet: item.excerpt,
    retrievedAt: new Date().toISOString(),
    publishedAt: item.freshness || undefined,
    trustScore: trustForCorpusConfidence(item.confidence),
    sourceType: item.sourceType,
    metadata: {
      reason: item.reason,
      score: item.score,
      citationRef: item.citationRef,
    },
  };
}

async function defaultVertexRagRetriever(input: {
  query: string;
  corpusNames: string[];
  topK: number;
  vectorIndex?: string;
}): Promise<SourceConnectorResult[]> {
  if (process.env.VERTEX_RAG_ENABLED !== 'true') return [];
  const endpoint = process.env.PRAXIS_VERTEX_RAG_PROXY_URL;
  if (!endpoint) return [];
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) return [];
  const payload = await response.json().catch(() => ({})) as { contexts?: SourceConnectorResult[] };
  return Array.isArray(payload.contexts) ? payload.contexts : [];
}

function trustForCorpusConfidence(confidence: CorpusItem['confidence']): number {
  if (confidence === 'high') return 0.95;
  if (confidence === 'medium') return 0.75;
  if (confidence === 'low') return 0.45;
  return 0.35;
}

function trustForDomain(url: string, sourceTrust: Record<string, number> | undefined, fallback: number): number {
  if (!sourceTrust) return fallback;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return sourceTrust[host] ?? fallback;
  } catch {
    return fallback;
  }
}
