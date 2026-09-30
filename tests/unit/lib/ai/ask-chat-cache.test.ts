import { describe, expect, it } from 'vitest';
import {
  askChatCacheKey,
  loadAskChatCache,
  persistAskChatCache,
  scopedAskChatDraft,
  scopedAskChatMessages,
  updateAskChatCache,
} from '@/lib/ai/ask-chat-cache';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
const privateMessage: Message = { id: 'a-private', role: 'user', content: 'Private ministry assessment' };
const nextMessage: Message = { id: 'b-private', role: 'user', content: 'A separate policy question' };

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

function key(ownerId: string, threadId = 'home-capsule-a') {
  return askChatCacheKey({ mode: 'authenticated', ownerId, threadId, namespace: 'praxis-authenticated-home-chat' })!;
}

describe('Ask chat cache owner and conversation isolation', () => {
  it('never reuses the old unscoped home cache across analyst accounts', () => {
    const storage = memoryStorage();
    storage.setItem('praxis-authenticated-home-chat', JSON.stringify([privateMessage]));
    expect(loadAskChatCache<Message>(storage, key('analyst-b')).messages).toEqual([]);
    expect(key('analyst-a')).not.toBe(key('analyst-b'));
  });

  it('hides account A immediately and never writes its transcript into account B before hydration', () => {
    const storage = memoryStorage();
    const a = key('analyst-a');
    const b = key('analyst-b');
    const state = { cacheKey: a, messages: [privateMessage] };
    expect(scopedAskChatMessages(state, b)).toEqual([]);
    expect(persistAskChatCache(storage, b, state)).toBe(false);
    expect(storage.getItem(b)).toBeNull();
    const bState = updateAskChatCache(loadAskChatCache<Message>(storage, b), b, [nextMessage]);
    expect(persistAskChatCache(storage, b, bState)).toBe(true);
    expect(JSON.parse(storage.getItem(b)!)).toEqual([nextMessage]);
  });

  it('uses a separate transcript per capsule thread even with an explicit shared storage namespace', () => {
    const storage = memoryStorage();
    const a = key('analyst-a');
    const b = key('analyst-a', 'home-capsule-b');
    storage.setItem(a, JSON.stringify([privateMessage]));
    expect(a).not.toBe(b);
    expect(loadAskChatCache<Message>(storage, b).messages).toEqual([]);
    expect(loadAskChatCache<Message>(storage, a).messages).toEqual([privateMessage]);
  });

  it('discards old history and stream updates after switching owners or capsule threads', () => {
    const a = key('analyst-a');
    const b = key('analyst-b', 'home-capsule-b');
    const bState = { cacheKey: b, messages: [nextMessage] };
    expect(updateAskChatCache(bState, a, [privateMessage])).toBe(bState);
    expect(updateAskChatCache(bState, a, (messages) => [...messages, privateMessage])).toBe(bState);
    expect(scopedAskChatMessages(bState, b)).toEqual([nextMessage]);
  });

  it('separates capsule history even when a caller explicitly reuses the same thread id', () => {
    const common = { mode: 'authenticated' as const, ownerId: 'analyst-a', threadId: 'fixed-thread' };
    expect(askChatCacheKey({ ...common, capsuleId: 'capsule-a' })).not.toBe(askChatCacheKey({ ...common, capsuleId: 'capsule-b' }));
  });

  it('hides an unsent private draft immediately after an account switch', () => {
    const draft = { ownerScope: 'analyst-a', text: privateMessage.content };
    expect(scopedAskChatDraft(draft, 'analyst-a')).toBe(privateMessage.content);
    expect(scopedAskChatDraft(draft, 'analyst-b')).toBe('');
    expect(scopedAskChatDraft(draft, 'pending')).toBe('');
  });

  it('does not create a shared authenticated cache while the owner is loading', () => {
    const cacheKey = askChatCacheKey({ mode: 'authenticated', ownerId: null, threadId: 'home-direct' });
    expect(cacheKey).toBeNull();
    const storage = memoryStorage();
    const state = loadAskChatCache<Message>(storage, cacheKey);
    expect(persistAskChatCache(storage, cacheKey, state)).toBe(false);
    expect(scopedAskChatMessages(state, cacheKey)).toEqual([]);
  });

  it('recovers from malformed or inaccessible storage and validates the cached message shape', () => {
    const storage = memoryStorage();
    const a = key('analyst-a');
    storage.setItem(a, '{malformed');
    expect(loadAskChatCache<Message>(storage, a).messages).toEqual([]);
    storage.setItem(a, JSON.stringify([privateMessage, { id: 'bad', role: 'system', content: 'Injected' }, null]));
    expect(loadAskChatCache<Message>(storage, a).messages).toEqual([privateMessage]);
    expect(loadAskChatCache<Message>({ getItem: () => { throw new Error('Storage blocked'); } }, a).messages).toEqual([]);
    expect(persistAskChatCache({ setItem: () => { throw new Error('Storage full'); } }, a, { cacheKey: a, messages: [privateMessage] })).toBe(false);
  });

  it('bounds saved and restored history to the latest 50 turns', () => {
    const storage = memoryStorage();
    const a = key('analyst-a');
    const messages: Message[] = Array.from({ length: 60 }, (_, i) => ({ id: `turn-${i}`, role: 'user', content: `Question ${i}` }));
    persistAskChatCache(storage, a, { cacheKey: a, messages });
    expect(loadAskChatCache<Message>(storage, a).messages).toEqual(messages.slice(-50));
  });
});
