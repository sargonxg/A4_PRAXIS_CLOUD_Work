import { describe, expect, it } from 'vitest';
import {
  emptyGuideChatState,
  guideChatCacheKey,
  scopedGuideChatState,
  updateGuideChatState,
} from '@/components/praxis/tasklet-workbench-conversation';

const defaultPrompt = 'Explain this policy workspace';

describe('Guide chat owner isolation', () => {
  it('separates signed-in owners and explicit guest caches without using the legacy key', () => {
    expect(guideChatCacheKey(true, 'a')).not.toBe(guideChatCacheKey(true, 'b'));
    expect(guideChatCacheKey(false, 'a')).not.toBe(guideChatCacheKey(true, 'a'));
    expect(guideChatCacheKey(true, null)).toBeNull();
    expect(guideChatCacheKey(true, 'a')).not.toBe('praxis-guide-chat-state:v1');
  });

  it('immediately masks another owner’s transcript, unsent prompt, scoped capsule and thread', () => {
    const a = guideChatCacheKey(true, 'a');
    const b = guideChatCacheKey(true, 'b');
    const state = {
      ...emptyGuideChatState(a, defaultPrompt), hydrated: true, open: true,
      prompt: 'Private ministry instructions', threadId: 'a-private-thread', capsuleId: 'a-private-capsule',
      messages: [{ role: 'user' as const, text: 'Private assessment' }],
    };
    const visible = scopedGuideChatState(state, b, defaultPrompt);
    expect(visible.messages).toEqual([]);
    expect(visible.prompt).toBe(defaultPrompt);
    expect(visible.capsuleId).toBeNull();
    expect(visible.threadId).toBeNull();
    expect(visible.open).toBe(false);
    expect(visible.hydrated).toBe(false);
  });

  it('rejects old scope setters and retains the current owner’s guide for reload', () => {
    const a = guideChatCacheKey(true, 'a');
    const b = guideChatCacheKey(true, 'b');
    const state = { ...emptyGuideChatState(b, defaultPrompt), hydrated: true };
    expect(updateGuideChatState(state, a, { prompt: 'Private question from A' })).toBe(state);
    const updated = updateGuideChatState(state, b, { prompt: 'Question from B' });
    expect(scopedGuideChatState(updated, b, defaultPrompt).prompt).toBe('Question from B');
  });
});
