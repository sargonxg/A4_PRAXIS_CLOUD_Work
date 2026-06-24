import {
  DEFAULT_CONTEXT_STACK_ID,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import type { CapsuleLibraryEntry } from '@/lib/capsules/library';

export type SaveActiveContextStack = (patch: Partial<ActiveContextStackState>) => Promise<ActiveContextStackState>;

export type TryLibraryCapsuleResult =
  | { status: 'attached'; capsuleId: string; seeded: boolean }
  | { status: 'needs-auth'; capsuleId: string }
  | { status: 'failed'; capsuleId: string; reason: string };

export interface TryLibraryCapsuleDeps {
  fetch?: typeof fetch;
  saveStack: SaveActiveContextStack;
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

  await deps.saveStack({
    stackId: entry.id || DEFAULT_CONTEXT_STACK_ID,
    capsuleId: entry.id,
    capsuleRefs: [{
      capsuleId: entry.id,
      label: entry.title,
      role: 'primary',
      primary: true,
      order: 0,
      version: null,
    }],
    userModelId: entry.coreRefs.userCoreId,
    situationId: entry.coreRefs.situationCoreId,
    sourceIds: entry.coreRefs.sourceCoreIds,
    documentIds: entry.coreRefs.documentCoreIds,
    outputGoal: entry.coreRefs.outputCoreIds[0] ?? entry.coreRefs.productCoreIds[0] ?? null,
    contextBlocks: {
      userCore: entry.coreRefs.userCoreId ? [{
        id: entry.coreRefs.userCoreId,
        capsuleId: entry.id,
        label: entry.title,
        role: 'user',
        primary: true,
        order: 0,
      }] : [],
      situation: entry.coreRefs.situationCoreId ? [{
        id: entry.coreRefs.situationCoreId,
        capsuleId: entry.id,
        label: entry.title,
        role: 'situation',
        primary: true,
        order: 0,
      }] : [],
      sources: [
        ...entry.coreRefs.sourceCoreIds.map((id, order) => ({
          id,
          capsuleId: entry.id,
          label: null,
          role: 'source',
          primary: order === 0,
          order,
        })),
        ...entry.coreRefs.documentCoreIds.map((id, order) => ({
          id,
          capsuleId: entry.id,
          label: null,
          role: 'document',
          primary: false,
          order: entry.coreRefs.sourceCoreIds.length + order,
        })),
      ],
      thinkingDevices: entry.coreRefs.toolCoreIds.map((id, order) => ({
        id,
        capsuleId: entry.id,
        label: null,
        role: 'tool',
        primary: order === 0,
        order,
      })),
      output: entry.coreRefs.outputCoreIds.map((id, order) => ({
        id,
        capsuleId: entry.id,
        label: null,
        role: 'output',
        primary: order === 0,
        order,
      })),
    },
  });

  return { status: 'attached', capsuleId: entry.id, seeded: available.seeded };
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
