'use client';

import {
  DEFAULT_CONTEXT_STACK_ID,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';

export type SaveActiveContextStack = (
  patch: Partial<ActiveContextStackState>,
) => Promise<ActiveContextStackState>;

export function capsuleDockPersistencePatch(
  next: ActiveContextStackState,
): Pick<ActiveContextStackState, 'stackId' | 'capsuleId' | 'capsuleRefs'> {
  return {
    stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
    capsuleId: next.capsuleId,
    capsuleRefs: next.capsuleRefs,
  };
}

export async function persistCapsuleDockStack(
  saveStack: SaveActiveContextStack,
  next: ActiveContextStackState,
): Promise<ActiveContextStackState> {
  return saveStack(capsuleDockPersistencePatch(next));
}
