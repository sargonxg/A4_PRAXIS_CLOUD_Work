import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { createAgentRun, listAgentRunsForCapsule } from '@/lib/agent-runtime/postgres';
import { normalizePointer } from '@/lib/agent-runtime/state';
import {
  CreateManualAgentRunRequestSchema,
  ListAgentRunsQuerySchema,
  toAgentRunOutput,
} from '@/lib/agent-runtime/schema';
import { getCapsule, getOrMigrateDefaultCapsule } from '@/lib/context/capsule-service';
import { CapsuleVersionConflictError, getCapsuleAtVersion } from '@/lib/context/capsule-version-resolution';
import type { SelectedCoreIds } from '@/lib/agent-runtime/types';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, user) => {
  if (user.isDemo) return NextResponse.json({ runs: [], persisted: false });
  const url = new URL(request.url);
  const parsed = ListAgentRunsQuerySchema.safeParse({
    capsuleId: url.searchParams.get('capsuleId') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'capsuleId is required', details: parsed.error.flatten() }, { status: 400 });
  }

  let capsule = await getCapsule(user.uid, parsed.data.capsuleId);
  let capsuleResolved = false;
  if (!capsule && normalizePointer(parsed.data.capsuleId, 'default') === 'default') {
    try {
      const result = await getOrMigrateDefaultCapsule(user.uid);
      capsule = result.capsule;
      capsuleResolved = true;
    } catch {
      return NextResponse.json({
        runs: [],
        persisted: false,
        degraded: true,
        capsuleResolved: false,
        detail: 'No active capsule exists yet. Agent run history will appear after the first capsule is created.',
      });
    }
  }
  if (!capsule || capsule.archivedAt) {
    return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
  }

  try {
    const runs = await listAgentRunsForCapsule(user.uid, capsule.capsuleId, parsed.data.limit);
    return NextResponse.json({
      runs: runs.filter((run) => run.ownerUid === user.uid).map(toAgentRunOutput),
      persisted: true,
      ...(capsuleResolved ? { capsuleResolved: true } : {}),
    });
  } catch (err) {
    return ledgerError(err);
  }
});

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Sample mode cannot create private agent runs' }, { status: 403 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = CreateManualAgentRunRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid agent run request', details: parsed.error.flatten() }, { status: 400 });
  }

  const capsule = await resolveCapsule(user.uid, parsed.data.capsuleId);
  if (!capsule || capsule.archivedAt) {
    return NextResponse.json({ error: 'Active capsule not found' }, { status: 404 });
  }

  try {
    if (parsed.data.capsuleId && normalizePointer(parsed.data.capsuleId, 'default') !== capsule.capsuleId) {
      throw new CapsuleVersionConflictError(parsed.data.capsuleId, null);
    }
    const capturedVersion = requestedManualVersion(parsed.data.metadata, capsule.capsuleId, capsule.version);
    const capturedCapsule = await getCapsuleAtVersion(user.uid, capsule.capsuleId, capturedVersion);
    if (!capturedCapsule || capturedCapsule.ownerUid !== user.uid
      || capturedCapsule.capsuleId !== capsule.capsuleId || capturedCapsule.version !== capturedVersion
      || capturedCapsule.archivedAt) {
      throw new CapsuleVersionConflictError(capsule.capsuleId, capturedVersion);
    }
    const run = await createAgentRun({
      ownerUid: user.uid,
      capsuleId: capsule.capsuleId,
      contextStackId: parsed.data.contextStackId ?? capsule.capsuleId,
      contextPackageId: parsed.data.contextPackageId ?? null,
      selectedCoreIds: {
        ...capturedCapsule.coreRefs,
        ...(parsed.data.selectedCoreIds as Partial<SelectedCoreIds> | undefined),
      },
      agentSpecId: parsed.data.agentSpecId ?? null,
      triggerType: parsed.data.triggerType,
      objective: parsed.data.objective,
      traceId: parsed.data.traceId,
      parentRunId: parsed.data.parentRunId ?? null,
      idempotencyKey: parsed.data.idempotencyKey,
      maxStep: parsed.data.maxStep,
      maxSessionMinutes: parsed.data.maxSessionMinutes,
      internalEstimatedCostCents: parsed.data.internalEstimatedCostCents ?? null,
      metadata: {
        ...(parsed.data.metadata ?? {}),
        // Capture the selected version now; worker execution must never choose
        // a newer capsule later or trust caller-supplied snapshot assertions.
        capsuleAgentExecutionContext: { version: 1, capsuleId: capturedCapsule.capsuleId, capsuleVersion: capturedVersion },
        ...(parsed.data.policyAgentId ? { policyAgentId: parsed.data.policyAgentId } : {}),
        ...(parsed.data.outputDestination ? { outputDestination: parsed.data.outputDestination } : {}),
        executionMode: 'queued-only',
      },
    });
    if (run.ownerUid !== user.uid) {
      return NextResponse.json({ error: 'Agent run owner mismatch' }, { status: 500 });
    }
    return NextResponse.json(toAgentRunOutput(run), { status: 201 });
  } catch (err) {
    if (err instanceof CapsuleVersionConflictError) {
      return NextResponse.json({ error: err.code, code: err.code, message: err.message,
        details: { recoverable: true, action: 'reattach_capsule' } }, {
        status: 409, headers: { 'Cache-Control': 'private, no-store' },
      });
    }
    return ledgerError(err);
  }
});

function requestedManualVersion(metadata: Record<string, unknown> | undefined, capsuleId: string, currentVersion: number): number {
  const versions: number[] = [];
  const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
  const conflict = () => new CapsuleVersionConflictError(capsuleId, null);
  const addVersion = (value: unknown) => {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) throw conflict();
    versions.push(value);
  };
  const supplied = metadata?.capsuleAgentExecutionContext;
  if (supplied !== undefined) {
    if (!record(supplied) || supplied.version !== 1 || supplied.capsuleId !== capsuleId) throw conflict();
    addVersion(supplied.capsuleVersion);
  }
  const stack = metadata?.activeContextStack;
  if (record(stack) && Array.isArray(stack.capsuleRefs)) {
    for (const reference of stack.capsuleRefs) {
      // Legacy manual workbench references are unpinned (null/absent).
      // Capture that selection now, while preserving every explicit pin.
      if (record(reference) && reference.capsuleId === capsuleId && reference.version != null) addVersion(reference.version);
    }
  }
  if (!versions.length) addVersion(currentVersion);
  if (versions.some((version) => version !== versions[0])) throw conflict();
  return versions[0];
}

async function resolveCapsule(uid: string, capsuleId?: string) {
  if (capsuleId) return getCapsule(uid, normalizePointer(capsuleId, 'default'));
  const result = await getOrMigrateDefaultCapsule(uid);
  return result.capsule;
}

function ledgerError(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('Agent run ledger is not configured')) {
    return NextResponse.json({
      error: 'Agent run ledger is not configured',
      detail: 'Set AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL for Cloud SQL Postgres.',
    }, { status: 503 });
  }
  if (isCloudSqlConnectivityError(err)) {
    return NextResponse.json({
      error: 'Agent run ledger unavailable',
      persisted: false,
      degraded: true,
      detail: 'The durable agent ledger is temporarily unavailable. Agent run history and queue actions are degraded.',
    }, { status: 503 });
  }
  return NextResponse.json({ error: 'Agent run ledger error' }, { status: 500 });
}

function isCloudSqlConnectivityError(err: unknown): boolean {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code) : '';
  const message = err instanceof Error ? err.message : String(err);
  return [
    code,
    message,
  ].some((value) => /ETIMEDOUT|ECONNREFUSED|ENETUNREACH|connection timeout|connect timeout|timeout expired|Cloud SQL/i.test(value));
}
