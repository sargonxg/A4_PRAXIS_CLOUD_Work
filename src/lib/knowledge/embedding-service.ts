/**
 * PRAXIS Embedding Service — centralized embedding generation.
 * Gracefully handles unavailable embedding models (returns empty arrays).
 */

import { embed, embedMany } from 'ai';
import { getEmbeddingModel } from '@/lib/ai/providers';
import { EMBEDDING_DIMENSION } from './embedding-config';

export const EMBEDDING_DIMENSIONS = EMBEDDING_DIMENSION;
const MAX_CHUNK_SIZE = 2000;
const OVERLAP = 200;
const MAX_BATCH_SIZE = 100;
const MAX_TEXT_LENGTH = 10000; // Gemini embedding max ~10K chars

export function chunkText(text: string, maxSize = MAX_CHUNK_SIZE, overlap = OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start >= text.length || end === text.length) break;
  }
  return chunks.filter(c => c.length > 50); // skip tiny chunks
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const model = getEmbeddingModel();
  if (!model) return null;
  try {
    const { embedding } = await embed({
      model,
      value: text.slice(0, MAX_TEXT_LENGTH),
    });
    return embedding;
  } catch (err) {
    console.error('[embedding-service] Failed to generate embedding:', err);
    return null;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  const model = getEmbeddingModel();
  if (!model) return texts.map(() => null);

  const results: (number[] | null)[] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    try {
      const { embeddings } = await embedMany({
        model,
        values: batch.map(t => t.slice(0, MAX_TEXT_LENGTH)),
      });
      results.push(...embeddings);
    } catch (err) {
      console.error('[embedding-service] Batch embedding failed:', err);
      results.push(...batch.map(() => null));
    }
  }
  return results;
}
