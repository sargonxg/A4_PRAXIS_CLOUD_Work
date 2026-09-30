type ChatCacheMessage = { id: string; role: 'user' | 'assistant'; content: string };

export type AskChatCacheState<T> = { cacheKey: string | null; messages: T[] };

/** A caller's storage key is a namespace, never a replacement for owner/thread isolation. */
export function askChatCacheKey(input: {
  mode: 'public' | 'authenticated';
  ownerId?: string | null;
  threadId: string;
  capsuleId?: string | null;
  namespace?: string;
}): string | null {
  if (input.mode === 'authenticated' && !input.ownerId) return null;
  return `praxis-chat:v2:${JSON.stringify([input.namespace ?? 'default', input.mode, input.mode === 'authenticated' ? input.ownerId : null, input.capsuleId ?? 'thin-capsule-fallback', input.threadId])}`;
}

export function scopedAskChatDraft(draft: { ownerScope: string; text: string }, ownerScope: string): string {
  return draft.ownerScope === ownerScope ? draft.text : '';
}

export function loadAskChatCache<T extends ChatCacheMessage>(
  storage: Pick<Storage, 'getItem'>,
  cacheKey: string | null,
): AskChatCacheState<T> {
  if (!cacheKey) return { cacheKey, messages: [] };
  try {
    // Legacy unscoped entries cannot establish ownership and must never be imported.
    const saved: unknown = JSON.parse(storage.getItem(cacheKey) ?? '[]');
    const messages = Array.isArray(saved) ? saved.filter(isChatCacheMessage).slice(-50) as T[] : [];
    return { cacheKey, messages };
  } catch {
    return { cacheKey, messages: [] };
  }
}

export function scopedAskChatMessages<T>(state: AskChatCacheState<T>, cacheKey: string | null): T[] {
  return cacheKey && state.cacheKey === cacheKey ? state.messages : [];
}

export function updateAskChatCache<T>(
  state: AskChatCacheState<T>,
  cacheKey: string | null,
  update: T[] | ((messages: T[]) => T[]),
): AskChatCacheState<T> {
  if (!cacheKey || state.cacheKey !== cacheKey) return state;
  return { cacheKey, messages: typeof update === 'function' ? update(state.messages) : update };
}

export function persistAskChatCache<T>(
  storage: Pick<Storage, 'setItem'>,
  cacheKey: string | null,
  state: AskChatCacheState<T>,
): boolean {
  if (!cacheKey || state.cacheKey !== cacheKey) return false;
  try {
    storage.setItem(cacheKey, JSON.stringify(state.messages.slice(-50)));
    return true;
  } catch {
    return false;
  }
}

function isChatCacheMessage(value: unknown): value is ChatCacheMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<ChatCacheMessage>;
  return typeof message.id === 'string'
    && (message.role === 'user' || message.role === 'assistant')
    && typeof message.content === 'string';
}
