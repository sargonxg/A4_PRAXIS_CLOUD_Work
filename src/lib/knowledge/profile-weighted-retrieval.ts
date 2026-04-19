import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { SituationKnowledgeCore } from './situation-knowledge-core';
import type { RetrievedChunk } from '@/lib/context/system-prompt-block';

export async function retrieveForProfile(opts: {
  uid: string;
  situationId?: string;
  query: string;
  topK: number;
}): Promise<RetrievedChunk[]> {
  try {
    const profile = await getAnalystProfile(opts.uid).catch(() => null);

    // Without a situationId there is no graph context to retrieve from
    const situationId = opts.situationId ?? '';
    const skc = new SituationKnowledgeCore(opts.uid, situationId);
    const base = await skc.retrieve(opts.query, opts.topK * 2);

    // No profile embedding → return base order
    const profileVec = profile?.embedding?.vector;
    if (!profileVec || profileVec.length === 0) {
      return base.slice(0, opts.topK).map(mapChunk);
    }

    // Rerank by cosine-sim between chunk vector (if present) and profile vector
    const reranked = base
      .map(c => {
        const vec = (c as unknown as { vector?: number[] }).vector;
        const score = vec ? cosine(vec, profileVec) : 0;
        return { ...c, _profileScore: score };
      })
      .sort((a, b) => (b._profileScore ?? 0) - (a._profileScore ?? 0))
      .slice(0, opts.topK);

    return reranked.map(mapChunk);
  } catch (err) {
    console.warn('[profile-weighted-retrieval] fallback:', err);
    return [];
  }
}

function mapChunk(c: unknown): RetrievedChunk {
  const obj = c as { id?: string; text?: string; source?: string; score?: number };
  return {
    id: obj.id ?? 'unknown',
    text: obj.text ?? '',
    source: obj.source ?? 'unknown',
    score: obj.score,
  };
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
