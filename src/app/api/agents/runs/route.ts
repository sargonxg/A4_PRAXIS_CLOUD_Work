import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { createAgentRun, listAgentRunsForCapsule } from '@/lib/agent-runtime/postgres';
import { normalizePointer, summarizeRunForCapsule } from '@/lib/agent-runtime/state';
import { getCapsule, getOrMigrateDefaultCapsule } from '@/lib/context/capsule-service';
import type { SelectedCoreIds } from '@/lib/agent-runtime/types';

export const dynamic = 'force-dynamic';

const TriggerSchema = z.enum(['manual', 'schedule', 'webhook', 'email_event', 'source_update', 'capsule_change']);

const SelectedCoreIdsSchema = z.object({
  userCoreId: z.string().nullable().optional(),
  teamCoreId: z.string().nullable().optional(),
  situationCoreId: z.string().nullable().optional(),
  pathCoreId: z.string().nullable().optional(),
  sourceCoreIds: z.array(z.string()).optional(),
  documentCoreIds: z.array(z.string()).optional(),
  graphCoreId: z.string().nullable().optional(),
  timeCoreId: z.string().nullable().optional(),
  outputCoreIds: z.array(z.string()).optional(),
  toolCoreIds: z.array(z.string()).optional(),
  objectiveCoreIds: z.array(z.string()).optional(),
  productCoreIds: z.array(z.string()).optional(),
  memoryCoreId: z.string().nullable().optional(),
}).optional();

export const CreateAgentRunRequestSchema = z.object({
  capsuleId: z.string().min(1).max(240).optional(),
  contextStackId: z.string().min(1).max(240).nullable().optional(),
  contextPackageId: z.string().min(1).max(240).nullable().optional(),
  selectedCoreIds: SelectedCoreIdsSchema,
  agentSpecId: z.string().min(1).max(240).nullable().optional(),
  triggerType: TriggerSchema.default('manual'),
  objective: z.string().min(1).max(2000),
  traceId: z.string().min(1).max(240).optional(),
  parentRunId: z.string().min(1).max(240).nullable().optional(),
  idempotencyKey: z.string().min(8).max(240).optional(),
  maxStep: z.number().int().positive().max(100).optional(),
  maxSessionMinutes: z.number().int().positive().max(24 * 60).optional(),
  internalEstimatedCostCents: z.number().int().nonnegative().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const ListQuerySchema = z.object({
  capsuleId: z.string().min(1).max(240),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export const GET = withAuth(async (request, user) => {
  if (user.isDemo) return NextResponse.json({ runs: [], persisted: false });
  const url = new URL(request.url);
  const parsed = ListQuerySchema.safeParse({
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
    return NextResponse.json({ runs: runs.map(summarizeRunForCapsule), persisted: true });
  } catch (err) {
    return ledgerError(err);
  }
});

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Demo mode cannot create private agent runs' }, { status: 403 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = CreateAgentRunRequestSchema.safeParse(raw);
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
    return NextResponse.json({
      runId: run.id,
      status: run.status,
      capsuleId: run.capsuleId,
      createdAt: run.createdAt,
      traceId: run.traceId,
    }, { status: 201 });
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
