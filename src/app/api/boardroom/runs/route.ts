import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { createAgentRun } from '@/lib/agent-runtime/postgres';
import { enqueueAgentRunDispatch } from '@/lib/agent-runtime/cloud-tasks';
import { toAgentRunOutput } from '@/lib/agent-runtime/schema';
import { normalizePointer } from '@/lib/agent-runtime/state';
import {
  activeContextStackFromBoardroomDockPayload,
  normalizeBoardroomCapsuleDockPayload,
  type BoardroomCapsuleDockPayload,
} from '@/lib/boardroom/capsule-dock';
import { buildBoardroomAgentRunInput, BoardroomRunRequestSchema } from '@/lib/boardroom/schema';
import { capsuleToStack, getCapsule, getOrMigrateDefaultCapsule, getStoredContextStack, type PraxisCapsule } from '@/lib/context/capsule-service';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';
import { getCapsuleAtVersion } from '@/lib/context/capsule-version-resolution';
import { buildProtectedContextPromptBlock, resolveInjectableContext } from '@/lib/context/context-injection';
import type { SelectedCoreIds } from '@/lib/agent-runtime/types';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Sample mode cannot create private boardroom runs' }, { status: 403 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = BoardroomRunRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid boardroom run request', details: parsed.error.flatten() }, { status: 400 });
  }

  const situationSlot = parsed.data.capsuleDockPayload?.slots.find((slot) => slot.role === 'situation' && slot.capsuleId);
  const requestedId = parsed.data.capsuleId ?? situationSlot?.capsuleId ?? undefined;
  const explicitVersion = situationSlot?.version ?? null;
  let capsule: PraxisCapsule;
  let contextInjection: { promptBlock: string; capsuleDockPayload: BoardroomCapsuleDockPayload };
  try {
    let snapshot: PraxisCapsule | null;
    let capturedVersion: number;
    let capturedId: string;
    if (explicitVersion !== null && requestedId) {
      capturedId = requestedId;
      capturedVersion = explicitVersion;
      snapshot = await getCapsuleAtVersion(user.uid, capturedId, capturedVersion);
    } else {
      const selected = await resolveCapsule(user.uid, requestedId);
      if (!selected || selected.archivedAt) {
        return NextResponse.json({ error: 'Active capsule not found' }, { status: 404 });
      }
      if (!validSnapshot(selected, user.uid, requestedId ?? selected.capsuleId, selected.version)) return contextUnavailable();
      capturedId = selected.capsuleId;
      capturedVersion = selected.version;
      snapshot = await getCapsuleAtVersion(user.uid, capturedId, capturedVersion);
    }
    if (!validSnapshot(snapshot, user.uid, capturedId, capturedVersion)) return contextUnavailable();
    capsule = snapshot;
    // Pin the governing capsule before compiling the complete typed dock.
    // A queued run must never acquire newer context while awaiting execution.
    contextInjection = await resolveBoardroomContextInjection(
      user.uid, capsule, parsed.data.contextStackId, parsed.data.capsuleDockPayload,
    );
  } catch {
    return contextUnavailable();
  }

  try {
    const run = await createAgentRun(buildBoardroomAgentRunInput({
      ownerUid: user.uid,
      capsuleId: capsule.capsuleId,
      capsuleVersion: capsule.version,
      contextStackId: parsed.data.contextStackId ?? capsule.capsuleId,
      contextPackageId: `capsule:${capsule.capsuleId}:v${capsule.version}`,
      selectedCoreIds: capsule.coreRefs as Partial<SelectedCoreIds>,
      request: { ...parsed.data, capsuleId: capsule.capsuleId, capsuleDockPayload: contextInjection.capsuleDockPayload },
      contextInjectionPromptBlock: contextInjection.promptBlock,
      capsuleDockPayload: contextInjection.capsuleDockPayload,
    }));

    const runOutput = toAgentRunOutput(run);
    try {
      const dispatch = await enqueueAgentRunDispatch({
        ownerUid: user.uid,
        runId: run.id,
        attempt: 1,
      });
      return NextResponse.json({ run: runOutput, dispatch }, { status: 201 });
    } catch (err) {
      return NextResponse.json({
        run: runOutput,
        dispatch: {
          dispatched: false,
          degraded: true,
          error: dispatchErrorMessage(err),
        },
      }, { status: 201 });
    }
  } catch (err) {
    return ledgerError(err);
  }
});

async function resolveCapsule(uid: string, capsuleId?: string) {
  if (capsuleId) return getCapsule(uid, normalizePointer(capsuleId, 'default'));
  const result = await getOrMigrateDefaultCapsule(uid);
  return result.capsule;
}

async function resolveBoardroomContextInjection(
  uid: string,
  capsule: PraxisCapsule,
  contextStackId?: string | null,
  submittedDockPayload?: BoardroomCapsuleDockPayload | null,
): Promise<{ promptBlock: string; capsuleDockPayload: BoardroomCapsuleDockPayload }> {
  const storedStack = await getStoredContextStack(uid, contextStackId ?? undefined).catch(() => null)
    ?? await getStoredContextStack(uid).catch(() => null);
  const capsuleDockPayload = submittedDockPayload
    ? normalizeBoardroomCapsuleDockPayload(submittedDockPayload)
    : null;
  const baseStack = capsuleDockPayload
    ? activeContextStackFromBoardroomDockPayload(capsuleDockPayload, storedStack ?? undefined)
    : sanitizeActiveContextStack(storedStack ?? capsuleToStack(capsule));
  const snapshotStack = capsuleToStack(capsule);
  const activeContextStack = sanitizeActiveContextStack({
    ...baseStack,
    ...snapshotStack,
    stackId: baseStack.stackId,
    capsuleRefs: [
      { capsuleId: capsule.capsuleId, label: capsule.label, role: 'situation', version: capsule.version, primary: true },
      ...baseStack.capsuleRefs.filter((ref) => ref.capsuleId !== capsule.capsuleId && ref.role !== 'situation'
        && (!ref.primary || ['user', 'tool', 'output'].includes(ref.role))),
    ],
  });
  const injectable = await resolveInjectableContext({
    uid,
    capsuleId: capsule.capsuleId,
    activeContextStack,
  });
  if (!validSnapshot(injectable.capsule, uid, capsule.capsuleId, capsule.version)) {
    throw new Error('The compiled context does not match the selected saved capsule.');
  }
  const protectedPrompt = buildProtectedContextPromptBlock(
    injectable.promptBlock,
    injectable.dockCapsules,
    injectable.missingDockCapsuleIds,
  );
  return {
    promptBlock: protectedPrompt.promptBlock,
    capsuleDockPayload: capsuleDockPayload ? normalizeBoardroomCapsuleDockPayload({
      ...capsuleDockPayload,
      slots: capsuleDockPayload.slots.map((slot) => slot.role === 'situation'
        ? { ...slot, capsuleId: capsule.capsuleId, label: capsule.label, version: capsule.version } : slot),
    }) : normalizeBoardroomCapsuleDockPayload({
      schemaVersion: 1,
      stackId: injectable.stack?.stackId ?? contextStackId ?? null,
      slots: injectable.dockCapsules.map((entry) => ({
        role: entry.role,
        capsuleId: entry.capsule.capsuleId,
        label: entry.capsule.label,
        version: entry.capsule.capsuleId === capsule.capsuleId ? capsule.version : entry.capsule.version,
      })),
    }),
  };
}

function validSnapshot(capsule: PraxisCapsule | null, uid: string, capsuleId: string, version: number): capsule is PraxisCapsule {
  return Boolean(capsule && !capsule.archivedAt && capsule.ownerUid === uid && capsule.capsuleId === capsuleId
    && Number.isSafeInteger(version) && version > 0 && capsule.version === version);
}

function contextUnavailable(): Response {
  return NextResponse.json({ error: 'Saved capsule context unavailable. Reattach the capsule and try again.', code: 'capsule_version_unavailable' }, { status: 409 });
}

function dispatchErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('not configured')) {
    return 'Boardroom run was queued; worker dispatch is not configured in this environment.';
  }
  if (/metadata token|Cloud Tasks enqueue|fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(message)) {
    return 'Boardroom run was queued; Cloud Tasks dispatch is temporarily unavailable.';
  }
  return 'Boardroom run was queued; worker dispatch did not start.';
}

function ledgerError(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('Agent run ledger is not configured')) {
    return NextResponse.json({
      error: 'Agent run ledger is not configured',
      detail: 'Set AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL for Cloud SQL Postgres.',
    }, { status: 503 });
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENETUNREACH|connection timeout|connect timeout|timeout expired|Cloud SQL/i.test(message)) {
    return NextResponse.json({
      error: 'Agent run ledger unavailable',
      persisted: false,
      degraded: true,
      detail: 'The durable agent ledger is temporarily unavailable. Boardroom run history is degraded.',
    }, { status: 503 });
  }
  return NextResponse.json({ error: 'Boardroom run ledger error' }, { status: 500 });
}
