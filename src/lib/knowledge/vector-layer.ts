/**
 * PRAXIS Vector Layer — Firestore native KNN vector search.
 * Stores canonical-dimension embeddings; searches via findNearest with COSINE distance.
 * Gracefully disabled if no embedding model is available.
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getEmbeddingModel } from '@/lib/ai/providers';
import { generateEmbedding, generateEmbeddings, chunkText } from './embedding-service';
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from './embedding-config';
import type { VectorResult } from './types';
import { findVertexVectorNeighbors, isVertexVectorSearchConfigured } from './vertex-vector-search';

export type CapsuleEmbeddingKind = 'section' | 'claim' | 'source';

export interface CapsuleEmbeddingInput {
  recordId: string;
  capsuleId: string;
  kind: CapsuleEmbeddingKind;
  text: string;
  sectionId?: string;
  claimId?: string;
  sourceId?: string;
  sourceReceiptIds?: string[];
}

export interface CapsuleEmbeddingRecord extends CapsuleEmbeddingInput {
  embedding: number[];
  embeddingDimension: typeof EMBEDDING_DIMENSION;
  embeddingModel: typeof EMBEDDING_MODEL;
  createdAt: string;
}

export interface CapsuleSimilarityNeighbor {
  capsuleId: string;
  score: number;
  matchedRecordIds: [string, string];
}

type CapsuleEmbeddingSource = {
  sectionIds?: readonly string[];
  identity?: { capsuleId?: string; label?: string; summary?: string };
  claimLedger?: { allClaims?: Array<{
    claimId?: string;
    text?: string;
    support?: string;
    receipts?: Array<{
      sourceId?: string;
      snippet?: string;
      publisher?: string | null;
      date?: string | null;
      reliabilityTier?: number | null;
      confidence?: number | null;
    }>;
  }> };
  sourceSpine?: { sourceRefs?: Array<{
    sourceId?: string;
    label?: string;
    url?: string | null;
    publisher?: string | null;
    date?: string | null;
    reliabilityTier?: number | null;
  }> };
  [key: string]: unknown;
};

export function buildCapsuleEmbeddingInputs(capsule: CapsuleEmbeddingSource): CapsuleEmbeddingInput[] {
  const capsuleId = cleanId(capsule.identity?.capsuleId ?? 'capsule');
  const sectionInputs = (capsule.sectionIds ?? []).flatMap((sectionId): CapsuleEmbeddingInput[] => {
    const text = serializeForEmbedding((capsule as Record<string, unknown>)[sectionId]);
    if (!text) return [];
    return [{
      recordId: `${capsuleId}:section:${sectionId}`,
      capsuleId,
      kind: 'section',
      sectionId,
      text,
    }];
  });
  const claimInputs = (capsule.claimLedger?.allClaims ?? []).flatMap((claim): CapsuleEmbeddingInput[] => {
    const claimId = cleanId(claim.claimId ?? claim.text ?? 'claim');
    const receiptText = (claim.receipts ?? [])
      .map((receipt) => [
        receipt.sourceId,
        receipt.publisher,
        receipt.date,
        receipt.reliabilityTier ? `tier ${receipt.reliabilityTier}` : '',
        receipt.confidence !== null && receipt.confidence !== undefined ? `confidence ${receipt.confidence}` : '',
        receipt.snippet,
      ].filter(Boolean).join(' | '))
      .filter(Boolean)
      .join('\n');
    const text = [claim.support ? `support: ${claim.support}` : '', claim.text, receiptText].filter(Boolean).join('\n');
    if (!text.trim()) return [];
    return [{
      recordId: `${capsuleId}:claim:${claimId}`,
      capsuleId,
      kind: 'claim',
      claimId,
      text,
      sourceReceiptIds: (claim.receipts ?? []).map((receipt) => receipt.sourceId).filter((id): id is string => Boolean(id)),
    }];
  });
  const receiptSnippetsBySource = new Map<string, string[]>();
  for (const claim of capsule.claimLedger?.allClaims ?? []) {
    for (const receipt of claim.receipts ?? []) {
      if (!receipt.sourceId || !receipt.snippet) continue;
      const snippets = receiptSnippetsBySource.get(receipt.sourceId) ?? [];
      snippets.push(receipt.snippet);
      receiptSnippetsBySource.set(receipt.sourceId, snippets);
    }
  }
  const sourceInputs = (capsule.sourceSpine?.sourceRefs ?? []).flatMap((source): CapsuleEmbeddingInput[] => {
    const sourceId = cleanId(source.sourceId ?? source.label ?? 'source');
    const text = [
      source.label,
      source.publisher,
      source.date,
      source.url,
      source.reliabilityTier ? `tier ${source.reliabilityTier}` : '',
      ...(receiptSnippetsBySource.get(source.sourceId ?? '') ?? []),
    ].filter(Boolean).join('\n');
    if (!text.trim()) return [];
    return [{
      recordId: `${capsuleId}:source:${sourceId}`,
      capsuleId,
      kind: 'source',
      sourceId,
      text,
    }];
  });
  return [...sectionInputs, ...claimInputs, ...sourceInputs];
}

export async function embedCapsuleSemanticLayer(
  capsule: CapsuleEmbeddingSource,
  deps: {
    embedTexts?: (texts: string[]) => Promise<(number[] | null)[]>;
    now?: () => string;
  } = {},
): Promise<CapsuleEmbeddingRecord[]> {
  const inputs = buildCapsuleEmbeddingInputs(capsule);
  const embeddings = await (deps.embedTexts ?? generateEmbeddings)(inputs.map((input) => input.text));
  const createdAt = deps.now?.() ?? new Date().toISOString();
  return inputs.flatMap((input, index): CapsuleEmbeddingRecord[] => {
    const embedding = embeddings[index];
    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) return [];
    return [{
      ...input,
      embedding,
      embeddingDimension: EMBEDDING_DIMENSION,
      embeddingModel: EMBEDDING_MODEL,
      createdAt,
    }];
  });
}

export function findCrossCapsuleSimilarities(
  records: CapsuleEmbeddingRecord[],
  capsuleId: string,
  topK = 5,
): CapsuleSimilarityNeighbor[] {
  const queryRecords = records.filter((record) => record.capsuleId === capsuleId);
  if (!queryRecords.length) return [];
  const bestByCapsule = new Map<string, CapsuleSimilarityNeighbor>();
  for (const query of queryRecords) {
    for (const candidate of records) {
      if (candidate.capsuleId === capsuleId) continue;
      const score = cosineSimilarity(query.embedding, candidate.embedding);
      const existing = bestByCapsule.get(candidate.capsuleId);
      if (!existing || score > existing.score) {
        bestByCapsule.set(candidate.capsuleId, {
          capsuleId: candidate.capsuleId,
          score,
          matchedRecordIds: [query.recordId, candidate.recordId],
        });
      }
    }
  }
  return Array.from(bestByCapsule.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export class VectorLayer {
  private embeddingAvailable: boolean;

  constructor(private uid: string, private situationId: string) {
    // Check at construction time — re-checked per-call with null guard
    this.embeddingAvailable = getEmbeddingModel() !== null;
    if (!this.embeddingAvailable) {
      console.warn('[SKC:vector] Embedding model unavailable. Vector search disabled.');
    }
  }

  private embeddingsRef() {
    return adminDb
      .collection('users').doc(this.uid)
      .collection('situations').doc(this.situationId)
      .collection('embeddings');
  }

  private toolEmbeddingsRef() {
    return adminDb
      .collection('users').doc(this.uid)
      .collection('situations').doc(this.situationId)
      .collection('tool-embeddings');
  }

  private capsuleEmbeddingsRef() {
    return adminDb
      .collection('users').doc(this.uid)
      .collection('capsule-embeddings');
  }

  async ingestCapsuleSemanticLayer(capsule: CapsuleEmbeddingSource): Promise<CapsuleEmbeddingRecord[]> {
    if (!this.embeddingAvailable) return [];
    const records = await embedCapsuleSemanticLayer(capsule);
    const batch = adminDb.batch();
    for (const record of records) {
      batch.set(this.capsuleEmbeddingsRef().doc(record.recordId.replace(/[/#?[\]]+/g, '-')), {
        ...record,
        embedding: FieldValue.vector(record.embedding),
      });
    }
    await batch.commit();
    return records;
  }

  async ingestDocument(docId: string, text: string, entityRefs: string[] = []): Promise<void> {
    if (!this.embeddingAvailable) return;
    const chunks = chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    const batch = adminDb.batch();
    chunks.forEach((chunk, i) => {
      const emb = embeddings[i];
      if (!emb) return;
      const ref = this.embeddingsRef().doc(`${docId}-chunk-${i}`);
      batch.set(ref, {
        embedding: FieldValue.vector(emb),
        embeddingDimension: EMBEDDING_DIMENSION,
        embeddingModel: EMBEDDING_MODEL,
        text: chunk,
        sourceDocId: docId,
        pageNumber: i,
        entityReferences: entityRefs,
        situationId: this.situationId,
        createdAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  }

  async ingestToolOutput(toolId: string, summary: string): Promise<void> {
    if (!this.embeddingAvailable) return;
    const emb = await generateEmbedding(summary);
    if (!emb) return;
    await this.toolEmbeddingsRef().doc(toolId).set({
      embedding: FieldValue.vector(emb),
      embeddingDimension: EMBEDDING_DIMENSION,
      embeddingModel: EMBEDDING_MODEL,
      summary,
      toolId,
      situationId: this.situationId,
      generatedAt: new Date().toISOString(),
    });
  }

  async search(query: string, topK = 10): Promise<VectorResult[]> {
    if (!this.embeddingAvailable) return [];
    const queryEmb = await generateEmbedding(query);
    if (!queryEmb) return [];

    try {
      if (isVertexVectorSearchConfigured()) {
        try {
          const neighbors = await findVertexVectorNeighbors({
            featureVector: queryEmb,
            neighborCount: topK,
          });
          if (neighbors.length) {
            const hydrated: Array<VectorResult | null> = await Promise.all(neighbors.map(async (neighbor) => {
              const doc = await this.embeddingsRef().doc(neighbor.datapointId).get();
              if (!doc.exists) return null;
              const data = doc.data() ?? {};
              let vector: number[] | undefined;
              const raw = data.embedding;
              if (raw && typeof raw.toArray === 'function') {
                vector = raw.toArray();
              } else if (Array.isArray(raw)) {
                vector = raw as number[];
              }
              const result: VectorResult = {
                chunkId: doc.id,
                text: data.text ?? '',
                score: neighbor.distance === null ? 0 : 1 - neighbor.distance,
                sourceDocId: data.sourceDocId,
                entityReferences: data.entityReferences ?? [],
                timestamp: data.createdAt ?? '',
                vector,
              };
              return result;
            }));
            return hydrated.filter((item): item is VectorResult => Boolean(item));
          }
        } catch (vertexErr) {
          console.warn('[SKC:vector] Vertex Vector Search failed; falling back to Firestore KNN:', vertexErr);
        }
      }

      const results = await this.embeddingsRef()
        .findNearest({
          vectorField: 'embedding',
          queryVector: FieldValue.vector(queryEmb),
          limit: topK,
          distanceMeasure: 'COSINE',
        })
        .get();

      return results.docs.map(d => {
        const data = d.data();
        // Firestore returns vectors as VectorValue — normalise to plain number[]
        // so consumers (e.g. profile-weighted rerank) can dot-product without
        // needing a Firestore-specific cast.
        let vector: number[] | undefined;
        const raw = data.embedding;
        if (raw && typeof raw.toArray === 'function') {
          vector = raw.toArray();
        } else if (Array.isArray(raw)) {
          vector = raw as number[];
        }
        return {
          chunkId: d.id,
          text: data.text ?? '',
          score: 1 - (data.distance ?? 0), // COSINE distance → similarity
          sourceDocId: data.sourceDocId,
          entityReferences: data.entityReferences ?? [],
          timestamp: data.createdAt ?? '',
          vector,
        };
      });
    } catch (err) {
      console.error('[SKC:vector] findNearest failed (vector index may need creation):', err);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.embeddingAvailable) return false;
    try {
      const snap = await this.embeddingsRef().limit(1).get();
      return !snap.empty; // healthy if has at least one embedding
    } catch {
      return false;
    }
  }

  async getEmbeddingCount(): Promise<number> {
    try {
      const snap = await this.embeddingsRef().count().get();
      return snap.data().count;
    } catch {
      return 0;
    }
  }
}

function serializeForEmbedding(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value).slice(0, 4000);
  } catch {
    return String(value).slice(0, 4000);
  }
}

function cleanId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
