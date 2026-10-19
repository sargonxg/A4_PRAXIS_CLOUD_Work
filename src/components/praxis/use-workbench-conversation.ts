'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { ChatMessage } from './tasklet-workbench-conversation';
import { createWorkbenchRequestOwner, loadWorkbenchConversationHistory, workbenchRequestKey } from './tasklet-workbench-history';

type Scope = { authenticated: boolean; ownerId?: string | null; capsuleId: string; threadId: string | null;
  setStatus: Dispatch<SetStateAction<string>> };

export function useWorkbenchConversation({ authenticated, ownerId, capsuleId, threadId, setStatus }: Scope) {
  const authenticatedOwnerId = authenticated ? ownerId ?? null : null;
  const scopeKey = workbenchRequestKey(authenticatedOwnerId, capsuleId, threadId);
  const [ownedMessages, setOwnedMessages] = useState<{ scope: string | null; messages: ChatMessage[] }>({ scope: null, messages: [] });
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationLoadedFor, setConversationLoadedFor] = useState<string | null>(null);
  const [workbenchRequests] = useState(createWorkbenchRequestOwner);
  const chatMessages = ownedMessages.scope === scopeKey ? ownedMessages.messages : [];
  const setChatMessages = useCallback((update: SetStateAction<ChatMessage[]>) => {
    const writeScope = workbenchRequests.currentScope();
    setOwnedMessages(previous => {
      const current = previous.scope === writeScope ? previous.messages : [];
      const messages = typeof update === 'function' ? update(current) : update;
      // A stale guarded updater returns its input; retain newer-scope state.
      if (messages === current) return previous;
      return { scope: writeScope, messages };
    });
  }, [workbenchRequests]);

  useEffect(() => () => workbenchRequests.invalidate(), [workbenchRequests]);
  useEffect(() => {
    if (workbenchRequests.setScope(scopeKey)) {
      setChatMessages([]);
      setIsStreaming(false);
    }
    if (!authenticatedOwnerId) {
      setConversationLoadedFor(null);
      return;
    }
    if (!threadId || conversationLoadedFor === scopeKey) return;
    setConversationLoadedFor(scopeKey);
    const request = workbenchRequests.begin();
    void loadWorkbenchConversationHistory({
      capsuleId, threadId, request,
      onMessages: messages => setChatMessages(current => request.isCurrent() ? messages : current),
      onStatus: next => setStatus(current => request.isCurrent() ? next : current),
    });
  }, [authenticatedOwnerId, capsuleId, conversationLoadedFor, scopeKey, setChatMessages, setStatus, threadId, workbenchRequests]);

  const cancelWorkbenchRequest = () => { workbenchRequests.invalidate(); setIsStreaming(false); };
  return { authenticatedOwnerId, chatMessages, setChatMessages,
    isStreaming: workbenchRequests.currentScope() === scopeKey ? isStreaming : false, setIsStreaming,
    conversationLoadedFor, setConversationLoadedFor, workbenchRequests, cancelWorkbenchRequest };
}
