import { randomUUID } from 'crypto';
import { Pool, type QueryResultRow } from 'pg';
import {
  type AgentApproval,
  type AgentRun,
  type AgentRunEvent,
  type AgentRunStatus,
  type AgentToolCall,
  type CreateAgentRunInput,
} from '@/lib/agent-runtime/types';
import { publishPraxisEvent, type PraxisEventType } from '@/lib/events/praxis-events';
import {
  mirrorAgentApprovalToFirestore,
  mirrorAgentRunEventToFirestore,
  mirrorAgentRunToFirestore,
  mirrorAgentToolCallToFirestore,
} from '@/lib/agent-runtime/firestore-mirror';
import {
  assertAgentRunTransition,
  makeAgentRunEvent,
  normalizeCreateAgentRunInput,
} from '@/lib/agent-runtime/state';

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getDatabaseUrl(): string | null {
  return process.env.AGENT_RUNTIME_DATABASE_URL
    || process.env.PRAXIS_DATABASE_URL
    || process.env.DATABASE_URL
    || null;
}

function getPool(): Pool {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error('Agent run ledger is not configured: set AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL for Cloud SQL Postgres.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: Number(process.env.AGENT_RUNTIME_PG_POOL_MAX ?? 5),
      ssl: process.env.AGENT_RUNTIME_PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        agent_spec_id TEXT,
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        context_stack_id TEXT,
        context_package_id TEXT,
        selected_core_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        objective TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        parent_run_id TEXT,
        idempotency_key TEXT NOT NULL,
        max_step INTEGER NOT NULL,
        max_session_minutes INTEGER NOT NULL,
        internal_estimated_cost_cents INTEGER,
        internal_spend_cents INTEGER,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        queued_at TIMESTAMPTZ NOT NULL,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        UNIQUE (owner_uid, idempotency_key)
      );
      CREATE INDEX IF NOT EXISTS agent_runs_owner_capsule_created_idx
        ON agent_runs (owner_uid, capsule_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS agent_run_events (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        from_status TEXT,
        to_status TEXT,
        message TEXT,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        trace_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS agent_run_events_run_created_idx
        ON agent_run_events (run_id, created_at ASC);
      CREATE TABLE IF NOT EXISTS agent_tool_calls (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        tool_id TEXT NOT NULL,
        risk TEXT NOT NULL,
        status TEXT NOT NULL,
        input JSONB NOT NULL DEFAULT '{}'::jsonb,
        output JSONB,
        error TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS agent_tool_calls_run_created_idx
        ON agent_tool_calls (run_id, created_at ASC);
      CREATE TABLE IF NOT EXISTS agent_approvals (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
        owner_uid TEXT NOT NULL,
        capsule_id TEXT NOT NULL,
        tool_call_id TEXT,
        status TEXT NOT NULL,
        reason TEXT NOT NULL,
        risk TEXT NOT NULL,
        requested_at TIMESTAMPTZ NOT NULL,
        decided_at TIMESTAMPTZ,
        decided_by_uid TEXT,
        expires_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS agent_approvals_run_requested_idx
        ON agent_approvals (run_id, requested_at ASC);
    `).then(() => undefined);
  }
  return schemaReady;
}

export async function createAgentRun(input: CreateAgentRunInput): Promise<AgentRun> {
  await ensureSchema();
  const normalized = normalizeCreateAgentRunInput(input);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + normalized.maxSessionMinutes * 60_000);
  const runId = randomUUID();
  const result = await getPool().query(
    `
      WITH inserted AS (
        INSERT INTO agent_runs (
          id, agent_spec_id, owner_uid, capsule_id, context_stack_id, context_package_id,
          selected_core_ids, status, trigger_type, objective, trace_id, parent_run_id,
          idempotency_key, max_step, max_session_minutes, internal_estimated_cost_cents,
          internal_spend_cents, metadata, created_at, updated_at, queued_at, expires_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,'queued',$8,$9,$10,$11,$12,$13,$14,$15,0,$16,$17,$17,$17,$18)
        ON CONFLICT (owner_uid, idempotency_key) DO NOTHING
        RETURNING *, true AS inserted
      )
      SELECT * FROM inserted
      UNION ALL
      SELECT agent_runs.*, false AS inserted
      FROM agent_runs
      WHERE owner_uid = $3 AND idempotency_key = $12
        AND NOT EXISTS (SELECT 1 FROM inserted)
      LIMIT 1
    `,
    [
      runId,
      normalized.agentSpecId ?? null,
      normalized.ownerUid,
      normalized.capsuleId,
      normalized.contextStackId,
      normalized.contextPackageId,
      JSON.stringify(normalized.selectedCoreIds),
      normalized.triggerType,
      normalized.objective,
      normalized.traceId,
      normalized.parentRunId,
      normalized.idempotencyKey,
      normalized.maxStep,
      normalized.maxSessionMinutes,
      normalized.internalEstimatedCostCents,
      JSON.stringify(normalized.metadata),
      now,
      expiresAt,
    ],
  );
  const run = rowToAgentRun(result.rows[0]);
  const inserted = Boolean(result.rows[0]?.inserted);
  await mirrorAgentRunToFirestore(run);
  if (inserted) {
    await appendAgentRunEvent(makeAgentRunEvent({
      runId: run.id,
      ownerUid: run.ownerUid,
      capsuleId: run.capsuleId,
      eventType: 'run.queued',
      toStatus: 'queued',
      message: 'Agent run queued for later dispatch.',
      traceId: run.traceId,
    }));
    publishAgentRunEvent('agent_run.created', run, {
      triggerType: run.triggerType,
      agentSpecId: run.agentSpecId,
    });
  }
  return run;
}

export type AgentRunDispatchMetadata = {
  dispatchId: string | null;
  attempt: number | null;
  taskName: string | null;
  queuePath: string | null;
  targetUrl: string | null;
};

export type AgentRunDispatchClaim = {
  run: AgentRun;
  claimed: boolean;
  existing: AgentRunDispatchMetadata | null;
};

export async function claimAgentRunDispatch(input: {
  ownerUid: string;
  runId: string;
  dispatchId: string;
  attempt: number;
}): Promise<AgentRunDispatchClaim> {
  await ensureSchema();
  const now = new Date();
  const claimMetadata = {
    dispatchEnqueueStatus: 'dispatch_claimed',
    dispatchId: input.dispatchId,
    dispatchAttempt: input.attempt,
    dispatchClaimedAt: now.toISOString(),
  };
  const result = await getPool().query(
    `
      UPDATE agent_runs
      SET metadata = agent_runs.metadata || $1::jsonb,
          updated_at = $2
      WHERE owner_uid = $3
        AND id = $4
        AND status IN ('queued', 'running')
        AND (
          COALESCE(metadata->>'dispatchEnqueueStatus', '') NOT IN ('dispatch_claimed', 'dispatch_enqueued')
          OR COALESCE(
            CASE
              WHEN metadata->>'dispatchAttempt' ~ '^[0-9]+$'
              THEN (metadata->>'dispatchAttempt')::int
              ELSE 0
            END,
            0
          ) < $5
        )
      RETURNING *
    `,
    [JSON.stringify(claimMetadata), now, input.ownerUid, input.runId, input.attempt],
  );
  if (result.rows[0]) {
    const run = rowToAgentRun(result.rows[0]);
    await mirrorAgentRunToFirestore(run, { preserveAudit: true });
    return { run, claimed: true, existing: null };
  }

  const run = await getAgentRun(input.ownerUid, input.runId);
  if (!run) {
    throw new Error('Agent run not found for dispatch.');
  }
  if (run.status !== 'queued' && run.status !== 'running') {
    throw new Error(`Agent run dispatch requires queued or running status, received ${run.status}.`);
  }
  const existingStatus = typeof run.metadata.dispatchEnqueueStatus === 'string'
    ? run.metadata.dispatchEnqueueStatus
    : null;
  if (existingStatus === 'dispatch_claimed' || existingStatus === 'dispatch_enqueued') {
    const existing = readAgentRunDispatchMetadata(run);
    if ((existing?.attempt ?? 0) >= input.attempt) {
      return { run, claimed: false, existing };
    }
  }
  return { run, claimed: false, existing: null };
}

export async function markAgentRunDispatchEnqueued(input: {
  ownerUid: string;
  runId: string;
  dispatchId: string;
  attempt: number;
  taskName: string | null;
  queuePath: string;
  targetUrl: string;
}): Promise<AgentRun | null> {
  return patchAgentRunDispatchMetadata({
    ownerUid: input.ownerUid,
    runId: input.runId,
    metadata: {
      dispatchEnqueueStatus: 'dispatch_enqueued',
      dispatchId: input.dispatchId,
      dispatchAttempt: input.attempt,
      dispatchTaskName: input.taskName,
      dispatchQueuePath: input.queuePath,
      dispatchTargetUrl: input.targetUrl,
      dispatchLastAttemptAt: new Date().toISOString(),
    },
  });
}

export async function markAgentRunDispatchFailed(input: {
  ownerUid: string;
  runId: string;
  dispatchId: string;
  attempt: number;
  error: string;
}): Promise<AgentRun | null> {
  return patchAgentRunDispatchMetadata({
    ownerUid: input.ownerUid,
    runId: input.runId,
    metadata: {
      dispatchEnqueueStatus: 'dispatch_failed',
      dispatchId: input.dispatchId,
      dispatchAttempt: input.attempt,
      dispatchError: input.error.slice(0, 1000),
      dispatchLastAttemptAt: new Date().toISOString(),
    },
  });
}

async function patchAgentRunDispatchMetadata(input: {
  ownerUid: string;
  runId: string;
  metadata: Record<string, unknown>;
}): Promise<AgentRun | null> {
  await ensureSchema();
  const result = await getPool().query(
    `
      UPDATE agent_runs
      SET metadata = agent_runs.metadata || $1::jsonb,
          updated_at = $2
      WHERE owner_uid = $3 AND id = $4
      RETURNING *
    `,
    [JSON.stringify(input.metadata), new Date(), input.ownerUid, input.runId],
  );
  const run = result.rows[0] ? rowToAgentRun(result.rows[0]) : null;
  if (run) {
    await mirrorAgentRunToFirestore(run, { preserveAudit: true });
  }
  return run;
}

function readAgentRunDispatchMetadata(run: AgentRun): AgentRunDispatchMetadata {
  const metadata = run.metadata;
  const attemptValue = typeof metadata.dispatchAttempt === 'number'
    ? metadata.dispatchAttempt
    : typeof metadata.dispatchAttempt === 'string'
      ? Number(metadata.dispatchAttempt)
      : null;
  return {
    dispatchId: typeof metadata.dispatchId === 'string' ? metadata.dispatchId : null,
    attempt: attemptValue !== null && Number.isFinite(attemptValue) ? attemptValue : null,
    taskName: typeof metadata.dispatchTaskName === 'string' ? metadata.dispatchTaskName : null,
    queuePath: typeof metadata.dispatchQueuePath === 'string' ? metadata.dispatchQueuePath : null,
    targetUrl: typeof metadata.dispatchTargetUrl === 'string' ? metadata.dispatchTargetUrl : null,
  };
}

export async function getAgentRun(ownerUid: string, runId: string): Promise<AgentRun | null> {
  await ensureSchema();
  const result = await getPool().query(
    'SELECT * FROM agent_runs WHERE owner_uid = $1 AND id = $2 LIMIT 1',
    [ownerUid, runId],
  );
  return result.rows[0] ? rowToAgentRun(result.rows[0]) : null;
}

export async function listAgentRunsForCapsule(ownerUid: string, capsuleId: string, limit = 25): Promise<AgentRun[]> {
  await ensureSchema();
  const result = await getPool().query(
    `
      SELECT * FROM agent_runs
      WHERE owner_uid = $1 AND capsule_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `,
    [ownerUid, capsuleId, Math.max(1, Math.min(100, Math.floor(limit)))],
  );
  return result.rows.map(rowToAgentRun);
}

export async function listRecentAgentRuns(ownerUid: string, limit = 25): Promise<AgentRun[]> {
  await ensureSchema();
  const result = await getPool().query(
    `
      SELECT * FROM agent_runs
      WHERE owner_uid = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [ownerUid, Math.max(1, Math.min(100, Math.floor(limit)))],
  );
  return result.rows.map(rowToAgentRun);
}

export async function listBoardroomAgentRuns(ownerUid: string, limit = 25): Promise<AgentRun[]> {
  await ensureSchema();
  const result = await getPool().query(
    `
      SELECT * FROM agent_runs
      WHERE owner_uid = $1
        AND (
          metadata->>'policyAgentId' = 'boardroom-discussion'
          OR metadata->>'source' = 'boardroom-workspace'
          OR metadata->>'executionMode' = 'boardroom-discussion'
        )
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [ownerUid, Math.max(1, Math.min(100, Math.floor(limit)))],
  );
  return result.rows.map(rowToAgentRun);
}

export async function listAgentRunEvents(input: {
  ownerUid: string;
  runId: string;
  after?: string | null;
  limit?: number;
}): Promise<AgentRunEvent[]> {
  await ensureSchema();
  const run = await getAgentRun(input.ownerUid, input.runId);
  if (!run) return [];
  const limit = Math.max(1, Math.min(200, Math.floor(input.limit ?? 100)));
  const after = input.after ? new Date(input.after) : null;
  const result = await getPool().query(
    `
      SELECT * FROM agent_run_events
      WHERE run_id = $1
        AND owner_uid = $2
        AND ($3::timestamptz IS NULL OR created_at > $3::timestamptz)
      ORDER BY created_at ASC
      LIMIT $4
    `,
    [run.id, input.ownerUid, after, limit],
  );
  return result.rows.map(rowToAgentRunEvent);
}

export async function appendAgentRunEvent(input: AgentRunEvent): Promise<AgentRunEvent> {
  await ensureSchema();
  const result = await getPool().query(
    `
      INSERT INTO agent_run_events (
        id, run_id, owner_uid, capsule_id, event_type, from_status, to_status,
        message, data, trace_id, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `,
    [
      input.id,
      input.runId,
      input.ownerUid,
      input.capsuleId,
      input.eventType,
      input.fromStatus,
      input.toStatus,
      input.message,
      JSON.stringify(input.data),
      input.traceId,
      input.createdAt,
    ],
  );
  const event = rowToAgentRunEvent(result.rows[0]);
  await mirrorAgentRunEventToFirestore(event);
  return event;
}

export async function appendAgentToolCall(input: AgentToolCall): Promise<AgentToolCall> {
  await ensureSchema();
  const result = await getPool().query(
    `
      INSERT INTO agent_tool_calls (
        id, run_id, owner_uid, capsule_id, tool_id, risk, status, input, output,
        error, started_at, completed_at, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
    `,
    [
      input.id,
      input.runId,
      input.ownerUid,
      input.capsuleId,
      input.toolId,
      input.risk,
      input.status,
      JSON.stringify(input.input),
      input.output ? JSON.stringify(input.output) : null,
      input.error,
      input.startedAt,
      input.completedAt,
      input.createdAt,
      input.updatedAt,
    ],
  );
  const toolCall = rowToAgentToolCall(result.rows[0]);
  await mirrorAgentToolCallToFirestore(toolCall);
  return toolCall;
}

export async function listAgentToolCalls(input: {
  ownerUid: string;
  runId: string;
}): Promise<AgentToolCall[]> {
  await ensureSchema();
  const run = await getAgentRun(input.ownerUid, input.runId);
  if (!run) return [];
  const result = await getPool().query(
    `
      SELECT * FROM agent_tool_calls
      WHERE run_id = $1 AND owner_uid = $2
      ORDER BY created_at ASC
    `,
    [input.runId, input.ownerUid],
  );
  return result.rows.map(rowToAgentToolCall);
}

export async function appendAgentApproval(input: AgentApproval): Promise<AgentApproval> {
  await ensureSchema();
  const result = await getPool().query(
    `
      INSERT INTO agent_approvals (
        id, run_id, owner_uid, capsule_id, tool_call_id, status, reason, risk,
        requested_at, decided_at, decided_by_uid, expires_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `,
    [
      input.id,
      input.runId,
      input.ownerUid,
      input.capsuleId,
      input.toolCallId,
      input.status,
      input.reason,
      input.risk,
      input.requestedAt,
      input.decidedAt,
      input.decidedByUid,
      input.expiresAt,
    ],
  );
  const approval = rowToAgentApproval(result.rows[0]);
  await mirrorAgentApprovalToFirestore(approval);
  return approval;
}

export async function listAgentApprovals(input: {
  ownerUid: string;
  runId: string;
}): Promise<AgentApproval[]> {
  await ensureSchema();
  const run = await getAgentRun(input.ownerUid, input.runId);
  if (!run) return [];
  const result = await getPool().query(
    `
      SELECT * FROM agent_approvals
      WHERE run_id = $1 AND owner_uid = $2
      ORDER BY requested_at ASC
    `,
    [input.runId, input.ownerUid],
  );
  return result.rows.map(rowToAgentApproval);
}

export async function decideAgentApproval(input: {
  ownerUid: string;
  runId: string;
  approvalId: string;
  decision: 'approved' | 'rejected';
  decidedByUid: string;
}): Promise<AgentApproval | null> {
  await ensureSchema();
  const run = await getAgentRun(input.ownerUid, input.runId);
  if (!run) return null;
  const result = await getPool().query(
    `
      UPDATE agent_approvals
      SET status = $1, decided_at = $2, decided_by_uid = $3
      WHERE owner_uid = $4 AND run_id = $5 AND id = $6 AND status = 'pending'
      RETURNING *
    `,
    [input.decision, new Date(), input.decidedByUid, input.ownerUid, input.runId, input.approvalId],
  );
  const approval = result.rows[0] ? rowToAgentApproval(result.rows[0]) : null;
  if (approval) {
    await mirrorAgentApprovalToFirestore(approval);
    await appendAgentRunEvent(makeAgentRunEvent({
      runId: run.id,
      ownerUid: run.ownerUid,
      capsuleId: run.capsuleId,
      eventType: `approval_${input.decision}`,
      message: input.decision === 'approved'
        ? 'Agent approval granted by the run owner.'
        : 'Agent approval rejected by the run owner.',
      data: {
        approvalId: approval.id,
        toolCallId: approval.toolCallId,
        risk: approval.risk,
      },
      traceId: run.traceId,
    }));
  }
  return approval;
}

export async function updateAgentRunStatus(input: {
  ownerUid: string;
  runId: string;
  toStatus: AgentRunStatus;
  message?: string | null;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<AgentRun | null> {
  await ensureSchema();
  const current = await getAgentRun(input.ownerUid, input.runId);
  if (!current) return null;
  assertAgentRunTransition(current.status, input.toStatus);
  const now = new Date();
  const completedAt = ['succeeded', 'failed', 'cancelled', 'expired'].includes(input.toStatus) ? now : current.completedAt;
  const startedAt = input.toStatus === 'running' && !current.startedAt ? now : current.startedAt;
  const metadataPatch = input.metadata ?? {};
  const result = await getPool().query(
    `
      UPDATE agent_runs
      SET status = $1,
          updated_at = $2,
          started_at = $3,
          completed_at = $4,
          metadata = agent_runs.metadata || $7::jsonb
      WHERE owner_uid = $5 AND id = $6
      RETURNING *
    `,
    [input.toStatus, now, startedAt, completedAt, input.ownerUid, input.runId, JSON.stringify(metadataPatch)],
  );
  const run = result.rows[0] ? rowToAgentRun(result.rows[0]) : null;
  if (run) {
    await mirrorAgentRunToFirestore(run, { preserveAudit: true });
    await appendAgentRunEvent(makeAgentRunEvent({
      runId: run.id,
      ownerUid: run.ownerUid,
      capsuleId: run.capsuleId,
      eventType: 'status_transition',
      fromStatus: current.status,
      toStatus: run.status,
      message: input.message ?? null,
      data: input.data ?? {},
      traceId: run.traceId,
    }));
    const eventType = statusToPraxisEvent(run.status);
    if (eventType) {
      publishAgentRunEvent(eventType, run, {
        fromStatus: current.status,
        toStatus: run.status,
        message: input.message ?? null,
        ...(input.data ?? {}),
      });
    }
  }
  return run;
}

export async function updateAgentRunMetadata(input: {
  ownerUid: string;
  runId: string;
  metadata: Record<string, unknown>;
  message?: string | null;
}): Promise<AgentRun | null> {
  await ensureSchema();
  const current = await getAgentRun(input.ownerUid, input.runId);
  if (!current) return null;
  const now = new Date();
  const nextMetadata = {
    ...current.metadata,
    ...input.metadata,
  };
  const result = await getPool().query(
    `
      UPDATE agent_runs
      SET metadata = $1, updated_at = $2
      WHERE owner_uid = $3 AND id = $4
      RETURNING *
    `,
    [JSON.stringify(nextMetadata), now, input.ownerUid, input.runId],
  );
  const run = result.rows[0] ? rowToAgentRun(result.rows[0]) : null;
  if (run && input.message) {
    await mirrorAgentRunToFirestore(run, { preserveAudit: true });
    await appendAgentRunEvent(makeAgentRunEvent({
      runId: run.id,
      ownerUid: run.ownerUid,
      capsuleId: run.capsuleId,
      eventType: 'metadata_updated',
      message: input.message,
      data: input.metadata,
      traceId: run.traceId,
    }));
  } else if (run) {
    await mirrorAgentRunToFirestore(run, { preserveAudit: true });
  }
  return run;
}

function publishAgentRunEvent(
  eventType: PraxisEventType,
  run: AgentRun,
  data: Record<string, unknown>,
): void {
  void publishPraxisEvent({
    eventType,
    ownerUid: run.ownerUid,
    capsuleId: run.capsuleId,
    runId: run.id,
    traceId: run.traceId,
    source: 'agent',
    data,
  });
}

function statusToPraxisEvent(status: AgentRunStatus): PraxisEventType | null {
  if (status === 'running') return 'agent_run.running';
  if (status === 'succeeded') return 'agent_run.completed';
  if (status === 'failed') return 'agent_run.failed';
  return null;
}

function rowToAgentRun(row: QueryResultRow): AgentRun {
  return {
    id: String(row.id),
    agentSpecId: row.agent_spec_id ?? null,
    ownerUid: String(row.owner_uid),
    capsuleId: String(row.capsule_id),
    contextStackId: row.context_stack_id ?? null,
    contextPackageId: row.context_package_id ?? null,
    selectedCoreIds: row.selected_core_ids,
    status: row.status,
    triggerType: row.trigger_type,
    objective: String(row.objective),
    traceId: String(row.trace_id),
    parentRunId: row.parent_run_id ?? null,
    idempotencyKey: String(row.idempotency_key),
    maxStep: Number(row.max_step),
    maxSessionMinutes: Number(row.max_session_minutes),
    internalEstimatedCostCents: row.internal_estimated_cost_cents === null ? null : Number(row.internal_estimated_cost_cents),
    internalSpendCents: row.internal_spend_cents === null ? null : Number(row.internal_spend_cents),
    metadata: row.metadata ?? {},
    createdAt: dateIso(row.created_at),
    updatedAt: dateIso(row.updated_at),
    queuedAt: dateIso(row.queued_at),
    startedAt: row.started_at ? dateIso(row.started_at) : null,
    completedAt: row.completed_at ? dateIso(row.completed_at) : null,
    expiresAt: row.expires_at ? dateIso(row.expires_at) : null,
  };
}

function rowToAgentRunEvent(row: QueryResultRow): AgentRunEvent {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    ownerUid: String(row.owner_uid),
    capsuleId: String(row.capsule_id),
    eventType: String(row.event_type),
    fromStatus: row.from_status ?? null,
    toStatus: row.to_status ?? null,
    message: row.message ?? null,
    data: row.data ?? {},
    traceId: String(row.trace_id),
    createdAt: dateIso(row.created_at),
  };
}

function rowToAgentToolCall(row: QueryResultRow): AgentToolCall {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    ownerUid: String(row.owner_uid),
    capsuleId: String(row.capsule_id),
    toolId: String(row.tool_id),
    risk: row.risk,
    status: row.status,
    input: row.input ?? {},
    output: row.output ?? null,
    error: row.error ?? null,
    startedAt: row.started_at ? dateIso(row.started_at) : null,
    completedAt: row.completed_at ? dateIso(row.completed_at) : null,
    createdAt: dateIso(row.created_at),
    updatedAt: dateIso(row.updated_at),
  };
}

function rowToAgentApproval(row: QueryResultRow): AgentApproval {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    ownerUid: String(row.owner_uid),
    capsuleId: String(row.capsule_id),
    toolCallId: row.tool_call_id ?? null,
    status: row.status,
    reason: String(row.reason),
    risk: row.risk,
    requestedAt: dateIso(row.requested_at),
    decidedAt: row.decided_at ? dateIso(row.decided_at) : null,
    decidedByUid: row.decided_by_uid ?? null,
    expiresAt: row.expires_at ? dateIso(row.expires_at) : null,
  };
}

function dateIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}
