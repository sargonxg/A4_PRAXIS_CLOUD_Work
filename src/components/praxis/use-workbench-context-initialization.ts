'use client';

import { useCallback, useEffect, useState } from 'react';

type ContextInitialization = {
  ownerId: string | null;
  hydrated: boolean;
  requestedCapsuleId: string | null;
  routeKey: string;
  attachedCapsuleIds: string[];
  selectCapsule: (id: string) => void;
  initializeCapsule: (id: string, signal: AbortSignal) => Promise<unknown>;
  setStatus: (status: string) => void;
};

/** Resolve an explicit deep-link once, after this owner's saved context loads.
 * Later intentional capsule changes/detachment remain available to the reader. */
export function useWorkbenchContextInitialization({ ownerId, hydrated, requestedCapsuleId, routeKey,
  attachedCapsuleIds, selectCapsule, initializeCapsule, setStatus }: ContextInitialization) {
  const scope = JSON.stringify([ownerId, routeKey, requestedCapsuleId]);
  const [visit, setVisit] = useState({ scope, epoch: 0 });
  // Guarded state adjustment tracks visits without mutating refs during render.
  // Returning A after a committed A→B departure must not reuse A's old completion.
  const epoch = visit.scope === scope ? visit.epoch : visit.epoch + 1;
  if (visit.scope !== scope) setVisit({ scope, epoch });
  const key = JSON.stringify([scope, epoch]);
  const attached = requestedCapsuleId !== null && attachedCapsuleIds.includes(requestedCapsuleId);
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const pending = Boolean(requestedCapsuleId && resolvedFor !== key);
  useEffect(() => {
    if (!ownerId || !hydrated || !requestedCapsuleId || resolvedFor === key) return;
    const controller = new AbortController();
    if (!attached) setStatus('Loading the saved context requested by this conversation…');
    const initialization = attached ? Promise.resolve() : initializeCapsule(requestedCapsuleId, controller.signal);
    void initialization.then(() => {
      if (controller.signal.aborted) return;
      selectCapsule(requestedCapsuleId); setResolvedFor(key); setFailedFor(null);
      setStatus('Conversation context ready. Your draft is ready to send.');
    }).catch(() => {
      if (controller.signal.aborted) return;
      setFailedFor(key);
      setStatus('The requested context could not be attached. Your draft is still here; retry loading context before sending.');
    });
    return () => controller.abort();
  }, [ownerId, hydrated, requestedCapsuleId, key, attached, resolvedFor, retryCount, selectCapsule, initializeCapsule, setStatus]);
  const retry = useCallback(() => { setFailedFor(null); setRetryCount(count => count + 1); }, []);
  return { pending, failed: failedFor === key, retry };
}

/** Both composer controls and the handler use the same owner/context boundary.
 * Empty context is valid; readiness must never require a saved capsule. */
export function workbenchSendReady({ authenticated, ownerId, hydrated, contextPending, requestScope, expectedScope }: {
  authenticated: boolean; ownerId: string | null; hydrated: boolean; contextPending: boolean;
  requestScope: string | null; expectedScope: string;
}): boolean {
  return !authenticated || Boolean(ownerId && hydrated && !contextPending && requestScope === expectedScope);
}
