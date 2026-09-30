import { sanitizeActiveContextStack, type ActiveContextStackState } from './active-context-stack';

export function activeContextCacheKey(remote: boolean, ownerId?: string | null): string | null {
  if (!remote) return 'praxis-active-context-stack:v2:guest';
  return ownerId ? `praxis-active-context-stack:v2:${JSON.stringify(['owner', ownerId])}` : null;
}

export function readScopedContextStack(scopeKey: string | null): ActiveContextStackState | null {
  if (!scopeKey || typeof window === 'undefined') return null;
  try {
    // An old global cache cannot establish who owns its source refs or notes.
    const raw = window.localStorage.getItem(scopeKey);
    return raw ? sanitizeActiveContextStack(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeScopedContextStack(scopeKey: string, stack: ActiveContextStackState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(scopeKey, JSON.stringify(stack));
  } catch {
    // The server-confirmed attachment remains usable when browser storage is blocked.
  }
}
