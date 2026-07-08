import {
  DEFAULT_CONTEXT_STACK_ID,
  assignCapsuleToDockSlot,
  defaultActiveContextStack,
  type ActiveContextStackState,
  type CapsuleDockSlotKind,
} from '@/lib/context/active-context-stack';
import { proposeDockSlotForCapsule, type CapsuleLibraryEntry } from '@/lib/capsules/library';

export type SaveActiveContextStack = (patch: Partial<ActiveContextStackState>) => Promise<ActiveContextStackState>;

export type TryLibraryCapsuleResult =
  | { status: 'attached'; capsuleId: string; seeded: boolean }
  | { status: 'needs-auth'; capsuleId: string }
  | { status: 'failed'; capsuleId: string; reason: string };

export interface TryLibraryCapsuleDeps {
  fetch?: typeof fetch;
  saveStack: SaveActiveContextStack;
  stack?: ActiveContextStackState | null;
  slotKind?: CapsuleDockSlotKind | null;
}

export async function tryLibraryCapsule(
  entry: CapsuleLibraryEntry,
  deps: TryLibraryCapsuleDeps,
): Promise<TryLibraryCapsuleResult> {
  const fetcher = deps.fetch ?? fetch;
  const available = await ensureStarterCapsuleAvailable(entry.id, fetcher);
  if (available.status !== 'available') {
    return available.status === 'needs-auth'
      ? { status: 'needs-auth', capsuleId: entry.id }
      : { status: 'failed', capsuleId: entry.id, reason: available.reason };
  }

  await deps.saveStack(activeContextPatchForLibraryEntry(entry, {
    stack: deps.stack,
    slotKind: deps.slotKind,
  }));

  return { status: 'attached', capsuleId: entry.id, seeded: available.seeded };
}

export function activeContextPatchForLibraryEntry(
  entry: CapsuleLibraryEntry,
  options: { stack?: ActiveContextStackState | null; slotKind?: CapsuleDockSlotKind | null } = {},
): Partial<ActiveContextStackState> {
  const next = assignCapsuleToDockSlot(
    options.stack ?? defaultActiveContextStack(),
    options.slotKind ?? proposeDockSlotForCapsule(entry),
    {
      capsuleId: entry.id,
      label: entry.title,
      version: entry.version,
    },
  );

  return {
    stackId: next.capsuleId ?? DEFAULT_CONTEXT_STACK_ID,
    capsuleId: next.capsuleId,
    capsuleRefs: next.capsuleRefs,
  };
}

type StarterAvailability =
  | { status: 'available'; seeded: boolean }
  | { status: 'needs-auth' }
  | { status: 'failed'; reason: string };

async function ensureStarterCapsuleAvailable(
  capsuleId: string,
  fetcher: typeof fetch,
): Promise<StarterAvailability> {
  const listResponse = await fetcher('/api/context/capsules', { credentials: 'include' });
  if (listResponse.status === 401 || listResponse.status === 403) return { status: 'needs-auth' };
  if (!listResponse.ok) return { status: 'failed', reason: `capsule list failed (${listResponse.status})` };

  const body = await listResponse.json().catch(() => null) as { capsules?: Array<{ capsuleId?: string }> } | null;
  if (body?.capsules?.some((capsule) => capsule.capsuleId === capsuleId)) {
    return { status: 'available', seeded: false };
  }

  const seedResponse = await fetcher('/api/context/capsules', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'seed-starters' }),
  });
  if (seedResponse.status === 401 || seedResponse.status === 403) return { status: 'needs-auth' };
  if (!seedResponse.ok) return { status: 'failed', reason: `starter seed failed (${seedResponse.status})` };
  return { status: 'available', seeded: true };
}
