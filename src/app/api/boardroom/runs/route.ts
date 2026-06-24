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
import { getCapsule, getOrMigrateDefaultCapsule, getStoredContextStack } from '@/lib/context/capsule-service';
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

  const capsule = await resolveCapsule(user.uid, parsed.data.capsuleId);
  if (!capsule || capsule.archivedAt) {
    return NextResponse.json({ error: 'Active capsule not found' }, { status: 404 });
  }

  // Compile the capsule dock (User / Situation / Tool / Output) into the same
  // governed prompt layer Ask PRAXIS uses, so the board deliberates on the
  // full docked context, not just the primary capsule pointer.
  const contextInjection = await resolveBoardroomContextInjection(
    user.uid,
    capsule.capsuleId,
    parsed.data.contextStackId,
    parsed.data.capsuleDockPayload,
  );

  try {
    const run = await createAgentRun(buildBoardroomAgentRunInput({
      ownerUid: user.uid,
      capsuleId: capsule.capsuleId,
      contextStackId: parsed.data.contextStackId ?? capsule.capsuleId,
      contextPackageId: `capsule:${capsule.capsuleId}:v${typeof capsule.version === 'number' ? capsule.version : 1}`,
      selectedCoreIds: capsule.coreRefs as Partial<SelectedCoreIds>,
      request: { ...parsed.data, capsuleId: capsule.capsuleId },
      contextInjectionPromptBlock: contextInjection?.promptBlock ?? null,
      capsuleDockPayload: contextInjection?.capsuleDockPayload ?? parsed.data.capsuleDockPayload ?? null,
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
  capsuleId: string,
  contextStackId?: string | null,
  submittedDockPayload?: BoardroomCapsuleDockPayload | null,
): Promise<{ promptBlock: string; capsuleDockPayload: BoardroomCapsuleDockPayload } | null> {
  try {
    const storedStack = await getStoredContextStack(uid, contextStackId ?? undefined).catch(() => null)
      ?? await getStoredContextStack(uid).catch(() => null);
    const capsuleDockPayload = submittedDockPayload
      ? normalizeBoardroomCapsuleDockPayload(submittedDockPayload)
      : null;
    const activeContextStack = capsuleDockPayload
      ? activeContextStackFromBoardroomDockPayload(capsuleDockPayload, storedStack ?? undefined)
      : storedStack ?? undefined;
    const injectable = await resolveInjectableContext({
      uid,
      capsuleId,
      activeContextStack,
    });
    const protectedPrompt = buildProtectedContextPromptBlock(
      injectable.promptBlock,
      injectable.dockCapsules,
      injectable.missingDockCapsuleIds,
    );
    return {
      promptBlock: protectedPrompt.promptBlock,
      capsuleDockPayload: capsuleDockPayload ?? normalizeBoardroomCapsuleDockPayload({
        schemaVersion: 1,
        stackId: injectable.stack?.stackId ?? contextStackId ?? null,
        slots: injectable.dockCapsules.map((entry) => ({
          role: entry.role,
          capsuleId: entry.capsule.capsuleId,
          label: entry.capsule.label,
          version: entry.capsule.version,
        })),
      }),
    };
  } catch {
    return null;
  }
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
