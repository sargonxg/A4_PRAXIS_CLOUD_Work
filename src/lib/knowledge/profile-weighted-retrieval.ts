import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { SituationKnowledgeCore } from './situation-knowledge-core';
import type { RetrievedChunk } from '@/lib/context/system-prompt-block';
import {
  getSourcePostureMap,
  normalizeSourceId,
  sourcePostureMultiplier,
  type SourceMixWeight,
} from '@/lib/sources/posture';

export async function retrieveForProfile(opts: {
  uid: string;
  situationId?: string;
  query: string;
  topK: number;
  sourceMix?: SourceMixWeight[];
}): Promise<RetrievedChunk[]> {
  try {
    const profile = await getAnalystProfile(opts.uid).catch(() => null);

    // Without a situationId there is no graph context to retrieve from
    const situationId = opts.situationId ?? '';
    const skc = new SituationKnowledgeCore(opts.uid, situationId);
    const base = await skc.retrieve(opts.query, opts.topK * 2);

    const postureMap = await getSourcePostureMap(base.map((chunk) => chunk.source));

    // No profile embedding → return source-posture/path-reranked base order
    const profileVec = profile?.embedding?.vector;
    if (!profileVec || profileVec.length === 0) {
      return base
        .map((chunk) => scoreWithSourcePosture(chunk, postureMap, opts.sourceMix))
        .sort((a, b) => (b._profileScore ?? 0) - (a._profileScore ?? 0))
        .slice(0, opts.topK)
        .map(mapChunk);
    }

    // Rerank by a blend of (original retrieval score) + (profile cosine-sim).
    // 0.5/0.5 keeps relevance anchored while nudging toward analyst-fit.
    // Chunks with no vector fall back to their base score only — they no
    // longer collapse to 0 as in the previous inert implementation.
    const reranked = base
      .map(c => {
        const obj = c as { vector?: number[]; score?: number };
        const profileScore = obj.vector ? cosine(obj.vector, profileVec) : 0;
        const baseScore = obj.score ?? 0;
        const blended = obj.vector ? 0.5 * baseScore + 0.5 * profileScore : baseScore;
        const posture = postureMap[normalizeSourceId(String((c as { source?: string }).source ?? 'unknown'))];
        return { ...c, _profileScore: blended * sourcePostureMultiplier(posture, opts.sourceMix) };
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
  const obj = c as { id?: string; text?: string; source?: string; score?: number; _profileScore?: number };
  return {
    id: obj.id ?? 'unknown',
    text: obj.text ?? '',
    source: obj.source ?? 'unknown',
    score: obj._profileScore ?? obj.score,
  };
}

function scoreWithSourcePosture<T extends { source: string; score?: number }>(
  chunk: T,
  postureMap: Record<string, Awaited<ReturnType<typeof getSourcePostureMap>>[string]>,
  sourceMix: SourceMixWeight[] | undefined,
): T & { _profileScore: number } {
  const posture = postureMap[normalizeSourceId(chunk.source)];
  return {
    ...chunk,
    _profileScore: (chunk.score ?? 0) * sourcePostureMultiplier(posture, sourceMix),
  };
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
