'use client';

import { useEffect, useState } from 'react';
import {
  defaultActiveContextStack,
  sanitizeActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';

const LOCAL_STACK_KEY = 'praxis-active-context-stack';

export function useActiveContextStack() {
  const [stack, setStack] = useState<ActiveContextStackState>(() => readLocalStack() ?? defaultActiveContextStack());
  const [persisted, setPersisted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const localStack = readLocalStack();
    fetch('/api/workspace/context-stack')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        if (payload?.stack) {
          const remoteStack = sanitizeActiveContextStack(payload.stack);
          const next = payload.persisted ? remoteStack : localStack ?? remoteStack;
          setStack(next);
          setPersisted(Boolean(payload.persisted));
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveStack(patch: Partial<ActiveContextStackState>) {
    const next = sanitizeActiveContextStack({ ...stack, ...patch });
    setStack(next);
    writeLocalStack(next);
    const response = await fetch('/api/workspace/context-stack', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stackId: next.stackId, ...patch }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    if (response?.ok && payload?.stack) {
      const saved = payload.persisted ? sanitizeActiveContextStack(payload.stack) : next;
      setStack(saved);
      setPersisted(Boolean(payload.persisted));
      writeLocalStack(saved);
      return saved;
    }
    return next;
  }

  return { stack, setStack, saveStack, persisted, hydrated };
}

function readLocalStack(): ActiveContextStackState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LOCAL_STACK_KEY);
  if (!raw) return null;
  try {
    return sanitizeActiveContextStack(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalStack(stack: ActiveContextStackState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STACK_KEY, JSON.stringify(stack));
}
