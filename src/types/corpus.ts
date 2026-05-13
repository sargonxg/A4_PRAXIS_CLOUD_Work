/**
 * Situation corpus retrieval types.
 *
 * Powers `/api/intelligence/corpus-search`, the shared retrieval function
 * `searchSituationCorpus`, and (later) Ask PRAXIS, Brainstorming Table,
 * Humanitarian, and any agent that needs to ground answers in the user's
 * situation-specific evidence rather than generic chat priors.
 *
 * Spec: docs/CORPUS_ARCHITECTURE.md (retrieval contract).
 */

export type CorpusSourceType =
  | 'argus'
  | 'sources'
  | 'documents'
  | 'graph'
  | 'tool-output'
  | 'situation'
  | 'profile'
  | 'event'
  | 'timeline';

export type CorpusConfidence = 'high' | 'medium' | 'low' | 'unknown';

export interface CorpusItem {
  /** Layer this item came from. Drives UI grouping and prompt sectioning. */
  sourceType: CorpusSourceType;
  /** Stable identifier within the layer. e.g. `doc_abc#chunk_7`, `tool-data/argus`. */
  sourceId: string;
  /** Concise human-readable label. */
  title: string;
  /** Short text suitable for inserting into a prompt or rendering inline. */
  excerpt: string;
  /** Firestore path / URL / graph node id — for citation linking. */
  citation: string;
  /** Coarse confidence band reflecting source reliability + retrieval signal. */
  confidence: CorpusConfidence;
  /** ISO timestamp the underlying record was last generated/observed. May be empty if unknown. */
  freshness: string;
  /** Why the retriever picked this item (for transparency and debugging). */
  reason: string;
  /** Numeric score retained for client-side sorting/debug. Higher = better match. */
  score?: number;
}

export type CorpusLayer =
  | 'argus'
  | 'sources'
  | 'documents'
  | 'graph'
  | 'tool-output';

export interface CorpusSearchRequest {
  situationId: string;
  query: string;
  layers?: CorpusLayer[];
  limit?: number;
  contextPackageId?: string;
  coreIds?: string[];
  checkFreshness?: boolean;
}

export interface CorpusSearchTrace {
  query: string;
  layersSearched: CorpusLayer[];
  ranking: string;
  contextPackageId?: string;
  contextHealthScore?: number;
  freshnessChecked?: boolean;
  /** Per-layer item counts after retrieval, before final cut. */
  layerCounts: Partial<Record<CorpusLayer, number>>;
  /** Total candidates considered before the limit was applied. */
  totalCandidates: number;
  /** Total ms spent retrieving (server-side). */
  durationMs: number;
}

export interface CorpusSearchResponse {
  items: CorpusItem[];
  trace: CorpusSearchTrace;
}

export const DEFAULT_CORPUS_LAYERS: CorpusLayer[] = [
  'argus',
  'sources',
  'documents',
  'graph',
  'tool-output',
];

export const DEFAULT_CORPUS_LIMIT = 12;
export const MAX_CORPUS_LIMIT = 50;
