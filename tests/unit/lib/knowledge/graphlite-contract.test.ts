import { describe, expect, it } from 'vitest';
import {
  GRAPHLITE_CLI_CRATE,
  GRAPHLITE_CLI_VERSION,
  GraphLiteRecallResponseSchema,
  buildGraphLiteCollectionId,
  buildGraphLiteWorkspaceId,
} from '@/lib/knowledge/graphlite-contract';

describe('GraphLite bridge contract', () => {
  it('documents the installed crates.io CLI package', () => {
    expect(GRAPHLITE_CLI_CRATE).toBe('gql-cli');
    expect(GRAPHLITE_CLI_VERSION).toBe('0.0.1');
  });

  it('builds owner-capsule scoped workspace and collection ids', () => {
    expect(buildGraphLiteWorkspaceId({ uid: 'User 1', capsuleId: 'Cap/Alpha', mode: 'owner-capsule' }))
      .toBe('owner_user-1__capsule_cap-alpha');
    expect(buildGraphLiteCollectionId({ uid: 'User 1', capsuleId: 'Cap/Alpha', prefix: 'praxis' }))
      .toBe('praxis__user-1__cap-alpha');
  });

  it('keeps recall responses advisory and provenance shaped', () => {
    const parsed = GraphLiteRecallResponseSchema.parse({
      status: 'enabled',
      hits: [{ id: 'hit-1', text: 'GraphLite path summary.', score: 0.81, sourceId: 'src-1' }],
      graphCandidateIds: ['proposal-1'],
      explainabilityIds: ['path-1'],
    });

    expect(parsed.hits[0]).toMatchObject({
      id: 'hit-1',
      text: 'GraphLite path summary.',
      score: 0.81,
      sourceId: 'src-1',
    });
    expect(parsed.graphCandidateIds).toEqual(['proposal-1']);
    expect(parsed.explainabilityIds).toEqual(['path-1']);
  });
});
