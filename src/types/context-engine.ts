import type { CorpusItem, CorpusLayer, CorpusSearchResponse } from '@/types/corpus';
import type { ContextCoreId } from '@/lib/product/context-core-map';

export type ContextPackageOwnerScope = 'user' | 'team' | 'situation';

export interface ContextPackageCoreRefs {
  userCoreId?: string;
  teamCoreId?: string;
  situationCoreId: string;
  pathCoreId?: string;
  sourceCoreIds: string[];
  documentCoreIds: string[];
  graphCoreId?: string;
  outputCoreIds: string[];
}

export interface ContextRetrievalPolicy {
  layers: CorpusLayer[];
  limit: number;
  checkFreshness: boolean;
  freshnessWindowDays?: number;
}

export interface ContextHealthSignal {
  coreId: ContextCoreId;
  status: 'ready' | 'thin' | 'staged' | 'missing';
  score: number;
  message: string;
}

export interface ContextHealth {
  score: number;
  signals: ContextHealthSignal[];
  missingCores: ContextCoreId[];
  warnings: string[];
}

export interface ContextPackage {
  id: string;
  label: string;
  ownerUid: string;
  ownerScope: ContextPackageOwnerScope;
  version: number;
  active: boolean;
  coreRefs: ContextPackageCoreRefs;
  retrievalPolicy: ContextRetrievalPolicy;
  health: ContextHealth;
  createdAt: string;
  updatedAt: string;
}

export interface RuntimeContextPack {
  package: ContextPackage;
  promptBlock: string;
  corpus: CorpusSearchResponse;
  traceId: string;
  resolvedAt: string;
}

export type IngestionRunStage =
  | 'uploaded'
  | 'extracted'
  | 'chunked'
  | 'embedded'
  | 'structured'
  | 'indexed'
  | 'checked'
  | 'failed';

export interface IngestionRun {
  id: string;
  ownerUid: string;
  situationId: string;
  documentId: string;
  title: string;
  status: IngestionRunStage;
  stages: Partial<Record<IngestionRunStage, string>>;
  chunkCount: number;
  candidateCount: number;
  graphDeltaCount: number;
  error?: string;
  traceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateGraphDelta {
  id: string;
  ownerUid: string;
  situationId: string;
  documentId?: string;
  kind: 'actor' | 'claim' | 'event' | 'commitment' | 'source-fact';
  label: string;
  evidence: CorpusItem[];
  confidence: number;
  status: 'review';
  createdAt: string;
}

export type ClaimVerdict = 'supported' | 'contradicted' | 'insufficient_evidence' | 'stale';

export interface ClaimCheckResult {
  verdict: ClaimVerdict;
  confidence: number;
  evidence: CorpusItem[];
  gaps: string[];
  traceId: string;
  checkedAt: string;
}

export interface KnowledgeAdapter {
  ingestDocument(input: {
    uid: string;
    situationId: string;
    documentId: string;
    title: string;
    fileType: string;
    text: string;
    bucketUri?: string | null;
  }): Promise<IngestionRun>;
  recall(input: {
    uid: string;
    contextPackageId?: string;
    situationId: string;
    query: string;
    layers?: CorpusLayer[];
    limit?: number;
    checkFreshness?: boolean;
  }): Promise<CorpusSearchResponse>;
  checkClaim(input: {
    uid: string;
    contextPackageId?: string;
    situationId: string;
    claim: string;
    checkFreshness?: boolean;
  }): Promise<ClaimCheckResult>;
  buildContextPack(input: {
    uid: string;
    contextPackageId?: string;
    coreRefs?: Partial<ContextPackageCoreRefs>;
    situationId: string;
    query?: string;
  }): Promise<RuntimeContextPack>;
  proposeGraphDelta(input: {
    uid: string;
    situationId: string;
    documentId?: string;
    evidence: CorpusItem[];
  }): Promise<CandidateGraphDelta[]>;
  explainTrace(input: { uid: string; runId: string; situationId?: string }): Promise<Record<string, unknown>>;
}
