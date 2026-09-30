import { persistCapsuleDockStack, type SaveActiveContextStack } from '@/hooks/use-capsule-dock-actions';
import { assignCapsuleToDockSlot, type ActiveContextStackState } from '@/lib/context/active-context-stack';

/** Resolve a saved builder link before changing the active workspace context. */
export async function attachSavedCapsuleForAsk(
  input: { capsuleId: string; ownerId: string; signal: AbortSignal },
  deps: { fetch?: typeof fetch; getStack: () => ActiveContextStackState; saveStack: SaveActiveContextStack },
): Promise<ActiveContextStackState> {
  const response = await (deps.fetch ?? fetch)(`/api/context/capsules/${encodeURIComponent(input.capsuleId)}`, {
    credentials: 'include',
    signal: input.signal,
  });
  if (!response.ok) throw new Error('The saved capsule is unavailable for this account.');
  const body = await response.json() as { capsule?: { capsuleId?: string; ownerUid?: string; label?: string; version?: number; archivedAt?: string | null } };
  const capsule = body.capsule;
  if (!capsule || capsule.capsuleId !== input.capsuleId || capsule.ownerUid !== input.ownerId || capsule.archivedAt) {
    throw new Error('The saved capsule is unavailable for this account.');
  }
  input.signal.throwIfAborted();
  const next = assignCapsuleToDockSlot(deps.getStack(), 'situation', {
    capsuleId: capsule.capsuleId,
    label: capsule.label,
    version: capsule.version,
  });
  // The shared dock save resolves canonical source/document cores on the server.
  const saved = await persistCapsuleDockStack(deps.saveStack, next);
  input.signal.throwIfAborted();
  if (saved.capsuleId !== input.capsuleId) throw new Error('The saved capsule attachment could not be confirmed.');
  return saved;
}
