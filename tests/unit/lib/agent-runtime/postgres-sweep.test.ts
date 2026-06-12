import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  poolCtor: vi.fn(),
  mirrorRun: vi.fn(),
  mirrorEvent: vi.fn(),
  mirrorApproval: vi.fn(),
  publish: vi.fn(),
}));

vi.mock('pg', () => ({
  Pool: mocks.poolCtor,
}));

vi.mock('@/lib/agent-runtime/firestore-mirror', () => ({
  mirrorAgentRunToFirestore: mocks.mirrorRun,
  mirrorAgentRunEventToFirestore: mocks.mirrorEvent,
  mirrorAgentApprovalToFirestore: mocks.mirrorApproval,
  mirrorAgentToolCallToFirestore: vi.fn(),
}));

vi.mock('@/lib/events/praxis-events', () => ({
  publishPraxisEvent: mocks.publish,
}));

const NOW = new Date('2026-06-12T12:00:00.000Z');

describe('agent runtime Postgres expiry sweeps', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.query.mockReset();
    mocks.poolCtor.mockReset();
    mocks.mirrorRun.mockReset();
    mocks.mirrorEvent.mockReset();
    mocks.mirrorApproval.mockReset();
    mocks.publish.mockReset();
    mocks.poolCtor.mockImplementation(function (this: unknown) {
      return { query: mocks.query };
    });
    process.env.AGENT_RUNTIME_DATABASE_URL = 'postgres://praxis-test';
  });

  it('expires queued runs through the status-update path and appends a transition event', async () => {
    const run = runRow({ id: 'run-expired', status: 'queued' });
    mockQueries({
      expiredRuns: [run],
      currentRuns: { 'run-expired': run },
      updatedRuns: { 'run-expired': runRow({ id: 'run-expired', status: 'expired', completed_at: NOW }) },
    });

    const { sweepExpiredAgentRuns } = await import('@/lib/agent-runtime/postgres');
    const result = await sweepExpiredAgentRuns(NOW);

    expect(result).toMatchObject({ swept: 1, remaining: false, errors: 0 });
    const updateRunCall = findQueryCall('UPDATE agent_runs');
    expect(updateRunCall?.[1]).toContain('expired');
    const statusEvent = insertedEvents().find((event) => event.eventType === 'status_transition');
    expect(statusEvent).toMatchObject({
      runId: 'run-expired',
      fromStatus: 'queued',
      toStatus: 'expired',
    });
  });

  it('leaves non-expired runs untouched', async () => {
    mockQueries({ expiredRuns: [] });

    const { sweepExpiredAgentRuns } = await import('@/lib/agent-runtime/postgres');
    const result = await sweepExpiredAgentRuns(NOW);

    expect(result).toMatchObject({ swept: 0, remaining: false, errors: 0 });
    expect(findQueryCall('UPDATE agent_runs')).toBeUndefined();
  });

  it('expires pending approvals when a waiting-approval run expires', async () => {
    const run = runRow({ id: 'run-waiting', status: 'waiting_approval' });
    const approval = approvalRow({ id: 'approval-1', run_id: 'run-waiting' });
    mockQueries({
      expiredRuns: [run],
      currentRuns: { 'run-waiting': run },
      updatedRuns: { 'run-waiting': runRow({ id: 'run-waiting', status: 'expired', completed_at: NOW }) },
      pendingApprovalsByRun: { 'run-waiting': [approval] },
      updatedApprovals: { 'approval-1': approvalRow({ id: 'approval-1', run_id: 'run-waiting', status: 'expired', decided_at: NOW }) },
    });

    const { sweepExpiredAgentRuns } = await import('@/lib/agent-runtime/postgres');
    const result = await sweepExpiredAgentRuns(NOW);

    expect(result).toMatchObject({ swept: 1, approvalsSwept: 1, errors: 0 });
    const approvalUpdate = findQueryCall('UPDATE agent_approvals');
    expect(approvalUpdate?.[1]).toContain('expired');
    expect(insertedEvents().map((event) => event.eventType)).toContain('approval_expired');
  });

  it('logs per-item run errors, skips the failed item, and continues', async () => {
    const first = runRow({ id: 'run-error', status: 'queued' });
    const second = runRow({ id: 'run-ok', status: 'queued' });
    mockQueries({
      expiredRuns: [first, second],
      currentRuns: { 'run-error': first, 'run-ok': second },
      updatedRuns: { 'run-ok': runRow({ id: 'run-ok', status: 'expired', completed_at: NOW }) },
      updateErrors: { 'run-error': new Error('database write failed') },
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { sweepExpiredAgentRuns } = await import('@/lib/agent-runtime/postgres');
    const result = await sweepExpiredAgentRuns(NOW);

    expect(result).toMatchObject({ swept: 1, errors: 1 });
    expect(insertedEvents().some((event) => event.runId === 'run-ok' && event.toStatus === 'expired')).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('caps each run sweep at 200 processed runs and reports remaining work', async () => {
    const expiredRuns = Array.from({ length: 205 }, (_, index) => runRow({ id: `run-${index}`, status: 'queued' }));
    mockQueries({
      expiredRuns,
      currentRuns: Object.fromEntries(expiredRuns.map((run) => [run.id, run])),
      updatedRuns: Object.fromEntries(expiredRuns.map((run) => [run.id, { ...run, status: 'expired', completed_at: NOW }])),
    });

    const { sweepExpiredAgentRuns } = await import('@/lib/agent-runtime/postgres');
    const result = await sweepExpiredAgentRuns(NOW);

    expect(result).toMatchObject({ swept: 200, remaining: true, errors: 0 });
    const runUpdates = mocks.query.mock.calls.filter(([sql]) => String(sql).includes('UPDATE agent_runs'));
    expect(runUpdates).toHaveLength(200);
  });

  it('expires approvals past their own expires_at and records approval_expired events', async () => {
    const approval = approvalRow({ id: 'approval-expired', run_id: 'run-approval' });
    mockQueries({
      expiredApprovals: [{ ...approval, run_trace_id: 'trace-run-approval' }],
      updatedApprovals: {
        'approval-expired': approvalRow({ id: 'approval-expired', run_id: 'run-approval', status: 'expired', decided_at: NOW }),
      },
    });

    const { sweepExpiredAgentApprovals } = await import('@/lib/agent-runtime/postgres');
    const result = await sweepExpiredAgentApprovals(NOW);

    expect(result).toMatchObject({ swept: 1, remaining: false, errors: 0 });
    expect(findQueryCall('UPDATE agent_approvals')?.[1]).toContain('expired');
    expect(insertedEvents()).toContainEqual(expect.objectContaining({
      eventType: 'approval_expired',
      runId: 'run-approval',
    }));
  });

  it('caps each approval sweep at 200 processed approvals', async () => {
    const expiredApprovals = Array.from({ length: 205 }, (_, index) => ({
      ...approvalRow({ id: `approval-${index}`, run_id: `run-${index}` }),
      run_trace_id: `trace-${index}`,
    }));
    mockQueries({
      expiredApprovals,
      updatedApprovals: Object.fromEntries(expiredApprovals.map((approval) => [
        approval.id,
        { ...approval, status: 'expired', decided_at: NOW },
      ])),
    });

    const { sweepExpiredAgentApprovals } = await import('@/lib/agent-runtime/postgres');
    const result = await sweepExpiredAgentApprovals(NOW);

    expect(result).toMatchObject({ swept: 200, remaining: true, errors: 0 });
    const approvalUpdates = mocks.query.mock.calls.filter(([sql]) => String(sql).includes('UPDATE agent_approvals'));
    expect(approvalUpdates).toHaveLength(200);
  });
});

function mockQueries(input: {
  expiredRuns?: Array<Record<string, unknown>>;
  currentRuns?: Record<string, Record<string, unknown>>;
  updatedRuns?: Record<string, Record<string, unknown>>;
  updateErrors?: Record<string, Error>;
  pendingApprovalsByRun?: Record<string, Array<Record<string, unknown>>>;
  expiredApprovals?: Array<Record<string, unknown>>;
  updatedApprovals?: Record<string, Record<string, unknown>>;
}) {
  mocks.query.mockImplementation(async (sqlInput: unknown, paramsInput?: unknown[]) => {
    const sql = String(sqlInput);
    const params = paramsInput ?? [];
    if (sql.includes('CREATE TABLE IF NOT EXISTS agent_runs')) return { rows: [] };
    if (sql.includes('FROM agent_runs') && sql.includes("status IN ('queued', 'running', 'waiting_approval')")) {
      return { rows: input.expiredRuns ?? [] };
    }
    if (sql.includes('SELECT * FROM agent_runs WHERE owner_uid = $1 AND id = $2')) {
      return { rows: input.currentRuns?.[String(params[1])] ? [input.currentRuns[String(params[1])]] : [] };
    }
    if (sql.includes('UPDATE agent_runs')) {
      const runId = String(params[5]);
      const error = input.updateErrors?.[runId];
      if (error) throw error;
      return { rows: input.updatedRuns?.[runId] ? [input.updatedRuns[runId]] : [] };
    }
    if (sql.includes('FROM agent_approvals') && sql.includes('run_id = $1')) {
      return { rows: input.pendingApprovalsByRun?.[String(params[0])] ?? [] };
    }
    if (sql.includes('FROM agent_approvals') && sql.includes('JOIN agent_runs')) {
      return { rows: input.expiredApprovals ?? [] };
    }
    if (sql.includes('UPDATE agent_approvals')) {
      const approvalId = String(params[4]);
      return { rows: input.updatedApprovals?.[approvalId] ? [input.updatedApprovals[approvalId]] : [] };
    }
    if (sql.includes('INSERT INTO agent_run_events')) {
      return { rows: [eventRowFromParams(params)] };
    }
    return { rows: [] };
  });
}

function findQueryCall(fragment: string): [unknown, unknown[]] | undefined {
  return mocks.query.mock.calls.find(([sql]) => String(sql).includes(fragment)) as [unknown, unknown[]] | undefined;
}

function insertedEvents() {
  return mocks.query.mock.calls
    .filter(([sql]) => String(sql).includes('INSERT INTO agent_run_events'))
    .map(([, params]) => eventRowFromParams(params as unknown[]));
}

function runRow(overrides: Partial<Record<string, unknown>> = {}) {
  const id = String(overrides.id ?? 'run-1');
  const status = String(overrides.status ?? 'queued');
  return {
    id,
    agent_spec_id: null,
    owner_uid: 'user-1',
    capsule_id: 'capsule-1',
    context_stack_id: null,
    context_package_id: null,
    selected_core_ids: {},
    status,
    trigger_type: 'manual',
    objective: 'Run the policy agent.',
    trace_id: `trace-${id}`,
    parent_run_id: null,
    idempotency_key: `key-${id}`,
    max_step: 20,
    max_session_minutes: 30,
    internal_estimated_cost_cents: null,
    internal_spend_cents: 0,
    metadata: {},
    created_at: '2026-06-12T10:00:00.000Z',
    updated_at: '2026-06-12T10:00:00.000Z',
    queued_at: '2026-06-12T10:00:00.000Z',
    started_at: status === 'queued' ? null : '2026-06-12T10:01:00.000Z',
    completed_at: null,
    expires_at: '2026-06-12T11:00:00.000Z',
    ...overrides,
  };
}

function approvalRow(overrides: Partial<Record<string, unknown>> = {}) {
  const id = String(overrides.id ?? 'approval-1');
  return {
    id,
    run_id: 'run-1',
    owner_uid: 'user-1',
    capsule_id: 'capsule-1',
    tool_call_id: 'tool-call-1',
    status: 'pending',
    reason: 'Needs approval.',
    risk: 'medium',
    requested_at: '2026-06-12T10:05:00.000Z',
    decided_at: null,
    decided_by_uid: null,
    expires_at: '2026-06-12T11:00:00.000Z',
    ...overrides,
  };
}

function eventRowFromParams(params: unknown[]) {
  return {
    id: String(params[0]),
    runId: String(params[1]),
    run_id: String(params[1]),
    ownerUid: String(params[2]),
    owner_uid: String(params[2]),
    capsuleId: String(params[3]),
    capsule_id: String(params[3]),
    eventType: String(params[4]),
    event_type: String(params[4]),
    fromStatus: params[5] === null ? null : String(params[5]),
    from_status: params[5],
    toStatus: params[6] === null ? null : String(params[6]),
    to_status: params[6],
    message: params[7] === null ? null : String(params[7]),
    data: typeof params[8] === 'string' ? JSON.parse(params[8]) as Record<string, unknown> : {},
    traceId: String(params[9]),
    trace_id: String(params[9]),
    createdAt: String(params[10]),
    created_at: params[10],
  };
}
