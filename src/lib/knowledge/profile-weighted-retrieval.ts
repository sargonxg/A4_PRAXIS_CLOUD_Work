import type { RetrievedChunk } from '@/lib/context/system-prompt-block';

/**
 * Profile-weighted retrieval stub — full implementation is Task 8.
 * Re-ranks SKC results by cosine similarity between chunk vectors
 * and the analyst profile embedding vector.
 */
export async function retrieveForProfile(_opts: {
  uid: string;
  situationId?: string;
  query: string;
  topK: number;
}): Promise<RetrievedChunk[]> {
  return [];
}
