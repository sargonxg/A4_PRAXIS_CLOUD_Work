import {
  loadLegacyAskThreadHistory,
  savedConversationTurnsToMessages,
  type ChatMessage,
  type SavedConversationTurn,
} from './tasklet-workbench-conversation';

export function workbenchRequestKey(ownerId: string | null | undefined, capsuleId: string, threadId: string | null): string {
  return JSON.stringify([ownerId ?? null, capsuleId, threadId]);
}

/** A local send or scope change invalidates every older history/turn response. */
export function createWorkbenchRequestOwner() {
  let key: string | null = null;
  let revision = 0;
  const controllers = new Set<AbortController>();
  const invalidate = () => {
    revision++;
    for (const controller of controllers) controller.abort();
    controllers.clear();
  };
  return {
    invalidate,
    currentScope: () => key,
    setScope(next: string) {
      if (next === key) return false;
      invalidate();
      key = next;
      return true;
    },
    begin() {
      const capturedKey = key;
      const capturedRevision = revision;
      const controller = new AbortController();
      controllers.add(controller);
      return {
        signal: controller.signal,
        isCurrent: () => !controller.signal.aborted && key === capturedKey && revision === capturedRevision,
        cancel: () => { controller.abort(); controllers.delete(controller); },
      };
    },
  };
}

export type WorkbenchRequest = ReturnType<ReturnType<typeof createWorkbenchRequestOwner>['begin']>;

type HistoryInput = {
  capsuleId: string;
  threadId: string;
  request: WorkbenchRequest;
  onMessages: (messages: ChatMessage[]) => void;
  onStatus: (status: string) => void;
};

/** Apply history only while its owner, conversation and local edit revision remain current. */
export async function loadWorkbenchConversationHistory({ capsuleId, threadId, request, onMessages, onStatus }: HistoryInput): Promise<void> {
  if (!request.isCurrent()) return;
  const restoreLegacy = async () => {
    const messages = await loadLegacyAskThreadHistory(capsuleId, threadId, request.signal);
    if (!request.isCurrent()) return;
    onMessages(messages);
    onStatus(messages.length ? `Conversation link loaded (${messages.length / 2} turns).` : 'New conversation link ready.');
  };
  try {
    const response = await fetch(`/api/conversations/${encodeURIComponent(threadId)}`, {
      credentials: 'include', signal: request.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!request.isCurrent()) return;
    if (!response.ok) throw new Error(payload?.error ?? 'conversation history failed');
    const turns = Array.isArray(payload?.turns) ? payload.turns as SavedConversationTurn[] : [];
    if (turns.length) {
      onMessages(savedConversationTurnsToMessages(turns));
      onStatus(`Conversation link loaded (${turns.length} turns).`);
      return;
    }
    await restoreLegacy();
  } catch (error) {
    if (!request.isCurrent()) return;
    try { await restoreLegacy(); }
    catch {
      if (request.isCurrent()) onStatus(error instanceof Error ? `Conversation link could not load: ${error.message}` : 'Conversation link could not load.');
    }
  }
}
