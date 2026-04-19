/**
 * PRAXIS Vector Layer — Firestore native KNN vector search.
 * Stores 768-dim embeddings; searches via findNearest with COSINE distance.
 * Gracefully disabled if no embedding model is available.
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateEmbedding, generateEmbeddings, chunkText } from './embedding-service';
import type { VectorResult } from './types';

export class VectorLayer {
  private embeddingAvailable: boolean;

  constructor(private uid: string, private situationId: string) {
    // Check at construction time — re-checked per-call with null guard
    const { getEmbeddingModel } = require('@/lib/ai/providers');
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
