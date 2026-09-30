import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/components/app/praxis-chat.tsx'), 'utf8');

describe('PraxisChat owner-scoped cache integration', () => {
  it('binds even caller-supplied namespaces to the signed-in owner and server thread', () => {
    expect(source).toContain('askChatCacheKey({ mode, ownerId: user?.id, capsuleId: activeCapsuleId, threadId: conversationThreadId, namespace: storageKey })');
    expect(source).not.toContain('const localStorageKey = storageKey ??');
    expect(source).toContain('scopedAskChatMessages(messageCache, localStorageKey)');
    expect(source).toContain('scopedAskChatDraft(draft, draftOwnerScope)');
  });

  it('hydrates each scope before sending or persisting and resets the history editing guard', () => {
    expect(source).toContain('loadAskChatCache<ChatMessage>(window.localStorage, localStorageKey)');
    expect(source).toContain('persistAskChatCache(window.localStorage, localStorageKey, messageCache)');
    expect(source).toContain('locallyEdited.current = false');
    expect(source).toContain('!contextReady || !cacheReady || !text');
    expect(source).toContain('updateAskChatCache(previous, localStorageKey, update)');
  });

  it('cancels requests on scope changes and prevents old stream completion from changing the next scope', () => {
    expect(source).toContain('return () => activeRequestRef.current?.abort()');
    expect(source).toContain('signal: requestController.signal');
    expect(source).toContain('if (!token || requestController.signal.aborted) return');
    expect(source).toContain('if (!requestController.signal.aborted) setIsStreaming(false)');
    expect(source).toContain('if (cancelled || locallyEdited.current || !history?.turns?.length) return');
    expect(source).toContain('localStorageKey, setMessages]);');
  });

  it('keeps unowned prompt handoffs restricted to the public sign-in journey', () => {
    const publicBranch = source.indexOf('if (isPublic) {', source.indexOf('const sendWithText'));
    const handoffWrite = source.indexOf('window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, text)', source.indexOf('const sendWithText'));
    expect(handoffWrite).toBeGreaterThan(publicBranch);
    expect(source).toContain('window.localStorage.removeItem(PENDING_TASKLET_PROMPT_KEY)');
    expect(source).toContain('if (isPublic) window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, mission.prompt)');
  });
});
