import { afterEach, describe, expect, it, vi } from 'vitest';
import { signConversationContext, verifyConversationContextToken } from '@/lib/context/conversation-token';
import { withContextAware } from '@/lib/context/context-aware';
import type { ConversationContext } from '@/types/context';

vi.mock('@/lib/firebase/situations', () => ({
  getSituationAdmin: vi.fn().mockResolvedValue(null),
}));

const conversation: ConversationContext = {
  sessionId: 's1',
  startedAt: '2026-05-06T00:00:00.000Z',
  focusedNodeId: 'node-1',
  recentActions: [{ id: 'a1', type: 'node_focused', label: 'Node focused', at: '2026-05-06T00:01:00.000Z' }],
};

describe('conversation context tokens', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('signs and verifies focused conversation context', () => {
    const token = signConversationContext(conversation, 'secret', Date.parse('2026-05-06T00:00:00.000Z'));
    const verified = verifyConversationContextToken(token, 'secret', Date.parse('2026-05-06T00:05:00.000Z'));
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.conversation.focusedNodeId).toBe('node-1');
      expect(verified.conversation.recentActions).toHaveLength(1);
    }
  });

  it('prefers signed tokens and ignores unsigned production headers by default', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PRAXIS_CONTEXT_TOKEN_SECRET', 'secret');
    const token = signConversationContext(conversation, 'secret', Date.parse('2026-05-06T00:00:00.000Z'));

    const signed = await withContextAware({
      req: new Request('https://praxis.test/tool', { headers: { 'X-Praxis-Conversation-Token': token } }),
      user: { uid: 'u1', email: 'a@b.test', name: 'A', isDemo: true },
    });
    expect(signed.snapshot.conversation.focusedNodeId).toBe('node-1');

    const unsigned = await withContextAware({
      req: new Request('https://praxis.test/tool', { headers: { 'X-Praxis-Conversation': JSON.stringify(conversation) } }),
      user: { uid: 'u1', email: 'a@b.test', name: 'A', isDemo: true },
    });
    expect(unsigned.snapshot.conversation.focusedNodeId).toBeUndefined();
  });
});
