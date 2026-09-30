'use client';

import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { activeContextCacheKey, readScopedContextStack, writeScopedContextStack } from '@/lib/context/active-context-cache';
import {
  defaultActiveContextStack,
  sanitizeActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';

type ScopedStack = {
  scopeKey: string | null;
  stack: ActiveContextStackState;
  persisted: boolean;
  hydrated: boolean;
};
type ScopeSession = { scopeKey: string | null; controller: AbortController };

export function useActiveContextStack({ remote = true }: { remote?: boolean } = {}) {
  const { user } = useAuth();
  const scopeKey = activeContextCacheKey(remote, user?.id);
  const [snapshot, setSnapshot] = useState<ScopedStack>(() => ({
    scopeKey,
    stack: readScopedContextStack(scopeKey) ?? defaultActiveContextStack(),
    persisted: false,
    hydrated: !remote,
  }));
  const scopeSessionRef = useRef<ScopeSession | null>(null);
  // Mask the previous owner before the new scope's loading effect runs.
  const current = scopeKey && snapshot.scopeKey === scopeKey
    ? snapshot
    : { stack: defaultActiveContextStack(), persisted: false, hydrated: false };
  const { stack, persisted, hydrated } = current;

  useEffect(() => {
    const session: ScopeSession = { scopeKey, controller: new AbortController() };
    scopeSessionRef.current = session;
    const localStack = readScopedContextStack(scopeKey);
    const isCurrent = () => scopeSessionRef.current === session && !session.controller.signal.aborted;
    queueMicrotask(() => {
      if (isCurrent()) setSnapshot({ scopeKey, stack: localStack ?? defaultActiveContextStack(), persisted: false, hydrated: !remote });
    });
    if (!remote || !scopeKey) return () => session.controller.abort();
    fetch('/api/workspace/context-stack', { credentials: 'include', signal: session.controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!isCurrent()) return;
        if (payload?.stack) {
          const remoteStack = sanitizeActiveContextStack(payload.stack);
          const next = payload.persisted ? remoteStack : localStack ?? remoteStack;
          setSnapshot({ scopeKey, stack: next, persisted: Boolean(payload.persisted), hydrated: true });
        }
      })
      .catch(() => { /* Existing owner-scoped context remains usable if reload fails. */ })
      .finally(() => {
        if (isCurrent()) setSnapshot((previous) => ({ ...previous, hydrated: true }));
      });
    return () => session.controller.abort();
  }, [remote, scopeKey]);

  const setStack = useCallback((update: SetStateAction<ActiveContextStackState>) => {
    setSnapshot((previous) => previous.scopeKey === scopeKey && previous.hydrated
      ? { ...previous, stack: typeof update === 'function' ? update(previous.stack) : update }
      : previous);
  }, [scopeKey]);

  async function saveStack(patch: Partial<ActiveContextStackState>, options: { signal?: AbortSignal } = {}) {
    if (!scopeKey || !hydrated) throw new Error('Wait for your own saved context to load, then retry.');
    if (options.signal?.aborted) throw new Error('Your capsule selection changed. Retry from the current workspace.');
    const next = sanitizeActiveContextStack({ ...stack, ...patch });
    if (!remote) {
      setStack(next);
      writeScopedContextStack(scopeKey, next);
      return next;
    }
    const session = scopeSessionRef.current;
    if (!session || session.scopeKey !== scopeKey || session.controller.signal.aborted) {
      throw new Error('Your account context changed. Reload the workspace before saving.');
    }
    const requestSignal = options.signal
      ? AbortSignal.any([session.controller.signal, options.signal])
      : session.controller.signal;
    const response = await fetch('/api/workspace/context-stack', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stackId: next.stackId, ...patch }),
      signal: requestSignal,
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    if (scopeSessionRef.current !== session || requestSignal.aborted) {
      throw new Error('Your account context changed while saving. Reload the workspace before retrying.');
    }
    if (response?.ok && payload?.stack) {
      const saved = payload.persisted ? sanitizeActiveContextStack(payload.stack) : next;
      setSnapshot({ scopeKey, stack: saved, persisted: Boolean(payload.persisted), hydrated: true });
      writeScopedContextStack(scopeKey, saved);
      return saved;
    }
    throw new Error('Your context could not be saved. The previous capsule is still attached; please retry.');
  }

  return { stack, setStack, saveStack, persisted, hydrated };
}
