import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(), poolCtor: vi.fn(), mirrorRun: vi.fn(), mirrorEvent: vi.fn(), publish: vi.fn(),
}));
vi.mock('pg', () => ({ Pool: mocks.poolCtor }));
vi.mock('@/lib/agent-runtime/firestore-mirror', () => ({
  mirrorAgentRunToFirestore: mocks.mirrorRun,
  mirrorAgentRunEventToFirestore: mocks.mirrorEvent,
  mirrorAgentApprovalToFirestore: vi.fn(),
  mirrorAgentToolCallToFirestore: vi.fn(),
}));
vi.mock('@/lib/events/praxis-events', () => ({ publishPraxisEvent: mocks.publish }));

const NOW = new Date('2026-09-30T12:00:00.000Z');
const claim = { ownerUid: 'owner-1', runId: 'run-1', token: 'delivery-a', leaseSeconds: 120 };
type Row = Record<string, unknown>;
let ledger: QueryLedger;

describe('Postgres agent execution ownership', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('AGENT_RUNTIME_DATABASE_URL', 'postgres://local-query-fixture');
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    ledger = new QueryLedger();
    mocks.query.mockImplementation((sql: string, params?: unknown[]) => ledger.query(sql, params));
    mocks.poolCtor.mockImplementation(function () { return { query: mocks.query }; });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

  it('claims one delivery, rejects a competing delivery, and permits recovery after lease expiry', async () => {
    const runtime = await import('@/lib/agent-runtime/postgres');
    const results = await Promise.all([
      runtime.claimAgentRunExecution(claim),
      runtime.claimAgentRunExecution({ ...claim, token: 'delivery-b' }),
    ]);
    expect(results).toEqual([true, false]);
    expect(ledger.row.execution_token).toBe('delivery-a');

    vi.setSystemTime(new Date(NOW.getTime() + 120_000));
    expect(await runtime.claimAgentRunExecution({ ...claim, token: 'delivery-b' })).toBe(true);
    await runtime.releaseAgentRunExecution(claim);
    expect(ledger.row.execution_token).toBe('delivery-b');
    await runtime.releaseAgentRunExecution({ ...claim, token: 'delivery-b' });
    expect(ledger.row.execution_token).toBeNull();
  });

  it.each(['succeeded', 'failed', 'cancelled', 'expired', 'waiting_approval'])('does not claim an ineligible %s run', async (status) => {
    ledger.row.status = status;
    const { claimAgentRunExecution } = await import('@/lib/agent-runtime/postgres');
    expect(await claimAgentRunExecution(claim)).toBe(false);
    expect(ledger.row.execution_token).toBeNull();
  });

  it('does not claim expired runs or another owner/run identity', async () => {
    const { claimAgentRunExecution } = await import('@/lib/agent-runtime/postgres');
    expect(await claimAgentRunExecution({ ...claim, ownerUid: 'another-owner' })).toBe(false);
    expect(await claimAgentRunExecution({ ...claim, runId: 'another-run' })).toBe(false);
    ledger.row.expires_at = NOW;
    expect(await claimAgentRunExecution(claim)).toBe(false);
  });

  it.each([[1, 30], [500, 300], [NaN, 120]])('bounds lease duration %s to %s seconds', async (leaseSeconds, expectedSeconds) => {
    const { claimAgentRunExecution } = await import('@/lib/agent-runtime/postgres');
    expect(await claimAgentRunExecution({ ...claim, leaseSeconds })).toBe(true);
    expect(ledger.row.execution_lease_until).toEqual(new Date(NOW.getTime() + expectedSeconds * 1000));
  });

  it('renews only the active token and cannot revive an expired lease', async () => {
    const runtime = await import('@/lib/agent-runtime/postgres');
    await runtime.claimAgentRunExecution(claim);
    vi.setSystemTime(new Date(NOW.getTime() + 30_000));
    expect(await runtime.renewAgentRunExecution({ ...claim, token: 'delivery-b' })).toBe(false);
    expect(await runtime.ownsAgentRunExecution({ ...claim, token: 'delivery-b' })).toBe(false);
    expect(await runtime.renewAgentRunExecution(claim)).toBe(true);
    expect(await runtime.ownsAgentRunExecution(claim)).toBe(true);
    vi.setSystemTime(new Date(NOW.getTime() + 150_000));
    expect(await runtime.renewAgentRunExecution(claim)).toBe(false);
    expect(await runtime.ownsAgentRunExecution(claim)).toBe(false);
  });

  it.each(['cancelled', 'expired'])('cannot renew or own execution after %s', async (status) => {
    const runtime = await import('@/lib/agent-runtime/postgres');
    await runtime.claimAgentRunExecution(claim);
    ledger.row.status = status;
    expect(await runtime.renewAgentRunExecution(claim)).toBe(false);
    expect(await runtime.ownsAgentRunExecution(claim)).toBe(false);
  });

  it('cannot renew or own a run whose expiry passed while its lease is still active', async () => {
    const runtime = await import('@/lib/agent-runtime/postgres');
    await runtime.claimAgentRunExecution(claim);
    ledger.row.expires_at = NOW;
    expect(await runtime.renewAgentRunExecution(claim)).toBe(false);
    expect(await runtime.ownsAgentRunExecution(claim)).toBe(false);
  });

  it('does not report a status transition or publish receipts when cancellation wins the compare-and-set', async () => {
    const runtime = await import('@/lib/agent-runtime/postgres');
    ledger.row.status = 'running';
    await runtime.claimAgentRunExecution(claim);
    ledger.afterRunRead = () => { ledger.row.status = 'cancelled'; };
    expect(await runtime.updateAgentRunStatus({ ownerUid: claim.ownerUid, runId: claim.runId,
      toStatus: 'succeeded', executionToken: claim.token })).toBeNull();
    expect(ledger.row.status).toBe('cancelled');
    expect(mocks.mirrorRun).not.toHaveBeenCalled();
    expect(mocks.mirrorEvent).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(ledger.events).toHaveLength(0);
  });

  it.each(['replaced-token', 'expired-lease', 'expired-run'])('returns null without success receipts for %s at the status write', async (failure) => {
    const runtime = await import('@/lib/agent-runtime/postgres');
    ledger.row.status = 'running';
    await runtime.claimAgentRunExecution(claim);
    ledger.afterRunRead = () => {
      if (failure === 'replaced-token') ledger.row.execution_token = 'delivery-b';
      if (failure === 'expired-lease') ledger.row.execution_lease_until = NOW;
      if (failure === 'expired-run') ledger.row.expires_at = NOW;
    };
    expect(await runtime.updateAgentRunStatus({ ownerUid: claim.ownerUid, runId: claim.runId,
      toStatus: 'succeeded', executionToken: claim.token })).toBeNull();
    expect(ledger.row.status).toBe('running');
    expect(mocks.mirrorRun).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(ledger.events).toHaveLength(0);
  });

  it('saves and mirrors success only after an owned compare-and-set returns the updated row', async () => {
    const runtime = await import('@/lib/agent-runtime/postgres');
    ledger.row.status = 'running';
    await runtime.claimAgentRunExecution(claim);
    const result = await runtime.updateAgentRunStatus({ ownerUid: claim.ownerUid, runId: claim.runId,
      toStatus: 'succeeded', executionToken: claim.token, metadata: { outputHref: '/work/memo-1' } });
    expect(result?.status).toBe('succeeded');
    expect(result?.metadata.outputHref).toBe('/work/memo-1');
    expect(mocks.mirrorRun).toHaveBeenCalledOnce();
    expect(mocks.mirrorEvent).toHaveBeenCalledOnce();
    expect(ledger.events).toHaveLength(1);
  });
});

/** A query-boundary fixture: verifies actual SQL predicates and models their row results.
 * It is not a live Postgres concurrency/locking test. */
class QueryLedger {
  row: Row = runRow();
  events: Row[] = [];
  afterRunRead?: () => void;

  async query(source: string, params: unknown[] = []): Promise<{ rows: Row[] }> {
    const sql = source.replace(/\s+/g, ' ').trim();
    if (sql.startsWith('CREATE TABLE')) return { rows: [] };
    if (sql.startsWith('SELECT * FROM agent_runs')) {
      if (!this.identity(params)) return { rows: [] };
      const snapshot = { ...this.row };
      this.afterRunRead?.();
      return { rows: [snapshot] };
    }
    if (sql.startsWith('INSERT INTO agent_run_events')) {
      const event = { id: params[0], run_id: params[1], owner_uid: params[2], capsule_id: params[3],
        event_type: params[4], from_status: params[5], to_status: params[6], message: params[7],
        data: JSON.parse(String(params[8])), trace_id: params[9], created_at: params[10] };
      this.events.push(event);
      return { rows: [event] };
    }
    if (sql.startsWith('UPDATE agent_runs SET status')) {
      expect(sql).toContain('owner_uid = $5 AND id = $6 AND status = $8');
      expect(sql).toContain('execution_token = $9 AND execution_lease_until > CURRENT_TIMESTAMP');
      expect(sql).toContain('expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP');
      if (this.row.owner_uid !== params[4] || this.row.id !== params[5] || this.row.status !== params[7]) return { rows: [] };
      if (params[8] !== null && (!this.liveExecution(params[8]) || !this.notExpired())) return { rows: [] };
      Object.assign(this.row, { status: params[0], updated_at: params[1], started_at: params[2],
        completed_at: params[3], metadata: { ...this.row.metadata as Row, ...JSON.parse(String(params[6])) } });
      return { rows: [{ ...this.row }] };
    }
    if (sql.startsWith('UPDATE agent_runs SET execution_token = NULL')) {
      expect(sql).toContain('owner_uid = $1 AND id = $2 AND execution_token = $3');
      if (this.identity(params) && this.row.execution_token === params[2]) {
        Object.assign(this.row, { execution_token: null, execution_lease_until: null });
      }
      return { rows: [] };
    }
    expect(sql).toContain('owner_uid = $1 AND id = $2');
    expect(sql).toContain("status IN ('queued', 'running')");
    expect(sql).toContain('expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP');
    if (!this.identity(params) || !['queued', 'running'].includes(String(this.row.status)) || !this.notExpired()) return { rows: [] };
    if (sql.startsWith('UPDATE agent_runs SET execution_token = $3')) {
      expect(sql).toContain('execution_token IS NULL OR execution_lease_until IS NULL OR execution_lease_until <= CURRENT_TIMESTAMP');
      if (this.row.execution_token !== null && this.row.execution_lease_until !== null
        && this.future(this.row.execution_lease_until)) return { rows: [] };
      this.row.execution_token = params[2];
    } else {
      expect(sql).toContain('execution_token = $3');
      expect(sql).toContain('execution_lease_until > CURRENT_TIMESTAMP');
      if (!this.liveExecution(params[2])) return { rows: [] };
      if (sql.startsWith('SELECT id FROM agent_runs')) return { rows: [{ id: this.row.id }] };
      expect(sql).toContain('UPDATE agent_runs SET execution_lease_until');
    }
    this.row.execution_lease_until = new Date(Date.now() + Number(params[3]) * 1000);
    return { rows: [{ id: this.row.id }] };
  }

  private identity(params: unknown[]): boolean { return this.row.owner_uid === params[0] && this.row.id === params[1]; }
  private future(value: unknown): boolean { return value !== null && new Date(value as string | Date).getTime() > Date.now(); }
  private notExpired(): boolean { return this.row.expires_at === null || this.future(this.row.expires_at); }
  private liveExecution(token: unknown): boolean { return this.row.execution_token === token && this.future(this.row.execution_lease_until); }
}

function runRow(): Row {
  return {
    id: 'run-1', owner_uid: 'owner-1', capsule_id: 'capsule-1', agent_spec_id: null,
    context_stack_id: null, context_package_id: null, selected_core_ids: {}, status: 'queued',
    trigger_type: 'manual', objective: 'Draft a policy memo.', trace_id: 'trace-1', parent_run_id: null,
    idempotency_key: 'key-1', max_step: 20, max_session_minutes: 30, internal_estimated_cost_cents: null,
    internal_spend_cents: 0, metadata: {}, created_at: NOW, updated_at: NOW, queued_at: NOW,
    started_at: null, completed_at: null, expires_at: new Date(NOW.getTime() + 600_000),
    execution_token: null, execution_lease_until: null,
  };
}
