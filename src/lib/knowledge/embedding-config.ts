/**
 * Single source of truth for embedding model and dimension across PRAXIS.
 * The active Firestore vector layer and target Postgres graph_embeddings
 * schema must match these constants. Enforced by audit:embedding-dim.
 */

export const EMBEDDING_MODEL = 'text-embedding-005' as const;
export const EMBEDDING_DIMENSION = 768 as const;

export type EmbeddingDimension = typeof EMBEDDING_DIMENSION;
