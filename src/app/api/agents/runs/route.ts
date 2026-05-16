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

  const capsule = await getCapsule(user.uid, parsed.data.capsuleId);
  if (!capsule || capsule.archivedAt) {
    return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
  }

  try {
    const runs = await listAgentRunsForCapsule(user.uid, capsule.capsuleId, parsed.data.limit);
    return NextResponse.json({ runs: runs.map(toAgentRunOutput), persisted: true });
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
    const run = await createAgentRun({
      ownerUid: user.uid,
      capsuleId: capsule.capsuleId,
      contextStackId: parsed.data.contextStackId ?? capsule.capsuleId,
      contextPackageId: parsed.data.contextPackageId ?? null,
      selectedCoreIds: {
        ...capsule.coreRefs,
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
        executionMode: 'queued-only',
      },
    });
    return NextResponse.json(toAgentRunOutput(run), { status: 201 });
  } catch (err) {
    return ledgerError(err);
  }
});

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
  return NextResponse.json({ error: 'Agent run ledger error' }, { status: 500 });
}
