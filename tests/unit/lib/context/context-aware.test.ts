import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/situations', () => ({
  getSituationAdmin: vi.fn().mockResolvedValue({
    id: 'case-1',
    name: 'Thin case',
    domain: 'conflict',
    graphEntities: 0,
    sourceUrls: [],
    customSources: [],
  }),
}));

import { withContextAware } from '@/lib/context/context-aware';

describe('context-aware substrate', () => {
  it('returns advisory snapshots instead of blocking low context', async () => {
    const result = await withContextAware({
      req: new Request('https://praxis.test/tool', {
        headers: { 'X-Praxis-Conversation': JSON.stringify({ sessionId: 's1', startedAt: '2026-05-06T00:00:00Z', focusedNodeId: 'n1' }) },
      }),
      user: { uid: 'u1', email: 'a@b.test', name: 'A', isDemo: false },
      situationId: 'case-1',
      spec: { caseGraph: { minNodeCount: 5 }, conversation: { focusedNodeRequired: true }, minHealthScore: 70, graceful: true },
    });

    expect(result.snapshot.composite.health).toBeLessThan(70);
    expect(result.snapshot.composite.advisories.some((item) => item.layer === 'case')).toBe(true);
    expect(result.snapshot.conversation.focusedNodeId).toBe('n1');
    expect(result.headers.get('X-Praxis-Context-Health')).toBeTruthy();
  });
});
