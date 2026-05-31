import { describe, expect, it } from 'vitest';
import {
  TrustGraphRecallResponseSchema,
  buildTrustGraphCollectionId,
  buildTrustGraphWorkspaceId,
} from '@/lib/knowledge/trustgraph-contract';

describe('TrustGraph bridge contract', () => {
  it('builds owner-capsule scoped workspace and collection ids', () => {
    expect(buildTrustGraphWorkspaceId({ uid: 'User 1', capsuleId: 'Cap/Alpha', mode: 'owner-capsule' }))
      .toBe('owner_user-1__capsule_cap-alpha');
    expect(buildTrustGraphCollectionId({ uid: 'User 1', capsuleId: 'Cap/Alpha', prefix: 'praxis' }))
      .toBe('praxis__user-1__cap-alpha');
  });

  it('keeps recall responses advisory and provenance shaped', () => {
    const parsed = TrustGraphRecallResponseSchema.parse({
      status: 'enabled',
      hits: [{ id: 'hit-1', text: 'Graph path summary.', score: 0.81, sourceId: 'src-1' }],
      graphCandidateIds: ['proposal-1'],
      explainabilityIds: ['path-1'],
    });

    expect(parsed.hits[0]).toMatchObject({
      id: 'hit-1',
      text: 'Graph path summary.',
      score: 0.81,
      sourceId: 'src-1',
    });
    expect(parsed.graphCandidateIds).toEqual(['proposal-1']);
    expect(parsed.explainabilityIds).toEqual(['path-1']);
  });
});
