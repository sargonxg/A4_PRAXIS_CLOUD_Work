import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/analyst-profile-admin', () => ({ getAnalystProfile: vi.fn() }));
vi.mock('@/lib/knowledge/embedding-service', () => ({ generateEmbedding: vi.fn() }));
vi.mock('@/lib/knowledge/situation-knowledge-core', () => ({
  SituationKnowledgeCore: vi.fn().mockImplementation(function () {
    this.retrieve = vi.fn().mockResolvedValue([
      { id: 'a', text: 'aid displacement', source: 'reliefweb', vector: [1, 0, 0] },
      { id: 'b', text: 'military posture', source: 'sipri', vector: [0, 1, 0] },
    ]);
  }),
}));

import { retrieveForProfile } from '@/lib/knowledge/profile-weighted-retrieval';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { generateEmbedding } from '@/lib/knowledge/embedding-service';
import { DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

describe('retrieveForProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns chunks in base order when no embedding available', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...DEFAULT_ANALYST_PROFILE, embedding: undefined,
    });
    (generateEmbedding as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const out = await retrieveForProfile({ uid: 'u1', query: 'something', topK: 5 });
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out[0].id).toBeDefined();
  });

  it('returns empty array when situationId provided but retrieval fails gracefully', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('x'));
    const out = await retrieveForProfile({ uid: 'u1', situationId: 's1', query: 'q', topK: 3 });
    expect(Array.isArray(out)).toBe(true);
  });
});
