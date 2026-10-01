import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeCreateAgentRunInput } from '@/lib/agent-runtime/state';
import type { AgentRun, CreateAgentRunInput } from '@/lib/agent-runtime/types';

const mocks = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn(), claim: vi.fn(),
  enqueued: vi.fn(), dispatchFailed: vi.fn(), event: vi.fn(), publish: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/agent-runtime/postgres', () => ({ getAgentRun: mocks.get, createAgentRun: mocks.create,
  updateAgentRunMetadata: mocks.update, claimAgentRunDispatch: mocks.claim,
  markAgentRunDispatchEnqueued: mocks.enqueued, markAgentRunDispatchFailed: mocks.dispatchFailed, appendAgentRunEvent: mocks.event }));
vi.mock('@/lib/events/praxis-events', () => ({ publishPraxisEvent: mocks.publish }));
// Run the real dispatcher against a mocked ledger and fetch; no cloud/network calls.
import { POST } from '@/app/api/agents/runs/[runId]/retry/route';

const owner = { uid: 'owner', isDemo: false };
type Handler = (request: Request, user: typeof owner, context: { params: Promise<{ runId: string }> }) => Promise<Response>;
const post = (user = owner, body?: unknown) => (POST as unknown as Handler)(new Request('https://praxis.test/api/agents/runs/parent/retry', {
  method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }),
}), user, { params: Promise.resolve({ runId: 'parent' }) });
let runs: Map<string, AgentRun>;
const transients: Record<string, unknown> = {
  dispatchEnqueueStatus: 'dispatch_enqueued', dispatchAttempt: 1, dispatchId: 'parent-dispatch',
  dispatchTaskName: 'tasks/parent', dispatchQueuePath: 'queues/parent', dispatchTargetUrl: 'https://worker.test/api/agents/runs/parent/execute',
  dispatchClaimedAt: '2026-01-01T00:00:00.000Z', executionState: 'finished', executionMode: 'multi-agent-supervisor',
  executionToken: 'old-lease', executionLeaseUntil: '2026-01-01T00:05:00.000Z',
  approvalId: 'old-approval', approvals: [{ status: 'approved' }], pendingApprovalId: 'old-pending',
  generationCheckpoints: { 'memo-draft': { text: 'Old draft' } }, memoId: 'old-memo', outputHref: '/app?memoId=old-memo',
  outputIds: ['old-output'], outputCapsuleId: 'old-output-capsule', boardroomOutput: { status: 'complete' },
  revisionOutcome: { execution: 'generated' }, failureSummary: { sanitizedError: 'Old failure' }, failedPhase: 'revision',
  error: 'Old error', latestMirroredEvent: { eventType: 'old-event' }, threadReturnPostedAt: '2026-01-01T00:20:00.000Z',
  capsuleReadReceipt: { capsuleVersion: 2 },
};
const constraints: Record<string, unknown> = {
  policyAgentId: 'sourceability-reviewer', outputDestination: 'memo_studio',
  capsuleAgentExecutionContext: { version: 1, capsuleId: 'cap-1', capsuleVersion: 2 },
  selectedTools: ['context-resolve', 'capsule-evidence-pack', 'policy-memo', 'sourceability-reviewer', 'document-retrieve'],
  selectedToolIds: ['context-resolve', 'capsule-evidence-pack', 'policy-memo', 'sourceability-reviewer', 'document-retrieve'],
  agentOperatingContract: { approvalThreshold: 'medium', forbiddenActions: ['publish'], stopConditions: ['Review before publishing'] },
  approvalThreshold: 'medium', approvalRequiredToolIds: ['multi-agent-review'],
  executionCapabilities: { network: false, publish: false }, executionPolicy: { bounded: true },
  networkPermissions: { allowExternalSources: false }, askExecutionPreference: { allowExternalSources: false },
  modelPolicy: { provider: 'vertex', model: 'approved-model' }, maxCostCredits: 12, sourceReceiptIds: ['source-1'],
  askThreadRef: { threadId: 'original-thread', capsuleId: 'cap-1', originTurnId: 'original-turn' },
};

describe('owner-initiated bounded agent retry', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('CLOUD_TASKS_ACCESS_TOKEN', 'unit-test-only-token');
    vi.stubEnv('CLOUD_TASKS_API_BASE_URL', 'https://cloud-tasks.test/v2');
    vi.stubEnv('AGENT_RUN_WORKER_BASE_URL', 'https://worker.test');
    vi.stubGlobal('fetch', mocks.fetch);
    runs = new Map([['parent', makeRun('failed')]]);
    mocks.get.mockImplementation(async (_uid: string, id: string) => runs.get(id) ?? null);
    mocks.create.mockImplementation(async (input: CreateAgentRunInput) => {
      const normalized = normalizeCreateAgentRunInput(input);
      const now = new Date();
      const child: AgentRun = { ...makeRun('queued'), ...normalized, id: 'child', traceId: 'child-trace',
        metadata: structuredClone(normalized.metadata), internalSpendCents: 0,
        createdAt: now.toISOString(), queuedAt: now.toISOString(), updatedAt: now.toISOString(), startedAt: null, completedAt: null,
        expiresAt: new Date(now.getTime() + normalized.maxSessionMinutes * 60_000).toISOString() };
      runs.set(child.id, child); return child;
    });
    // Match the existing SQL claim semantics: an inherited dispatch blocks attempt 1.
    mocks.claim.mockImplementation(async (input: { runId: string; dispatchId: string; attempt: number }) => {
      const run = runs.get(input.runId)!;
      if (['dispatch_claimed', 'dispatch_enqueued'].includes(String(run.metadata.dispatchEnqueueStatus))
        && Number(run.metadata.dispatchAttempt ?? 0) >= input.attempt) {
        return { run, claimed: false, existing: { dispatchId: run.metadata.dispatchId, attempt: run.metadata.dispatchAttempt,
          taskName: run.metadata.dispatchTaskName, queuePath: run.metadata.dispatchQueuePath, targetUrl: run.metadata.dispatchTargetUrl } };
      }
      run.metadata = { ...run.metadata, dispatchEnqueueStatus: 'dispatch_claimed', dispatchId: input.dispatchId, dispatchAttempt: input.attempt };
      return { run, claimed: true, existing: null };
    });
    mocks.enqueued.mockImplementation(async (input: { runId: string; dispatchId: string; attempt: number; taskName: string }) => {
      const run = runs.get(input.runId)!;
      run.metadata = { ...run.metadata, dispatchEnqueueStatus: 'dispatch_enqueued', dispatchId: input.dispatchId,
        dispatchAttempt: input.attempt, dispatchTaskName: input.taskName }; return run;
    });
    mocks.update.mockImplementation(async (input: { runId: string; metadata: Record<string, unknown> }) => {
      const run = runs.get(input.runId)!; run.metadata = { ...run.metadata, ...input.metadata }; return run;
    });
    mocks.fetch.mockImplementation(async (_url: string, options: RequestInit) =>
      new Response(JSON.stringify({ name: JSON.parse(options.body as string).task.name }), { status: 200 }));
    mocks.publish.mockResolvedValue(undefined); mocks.event.mockResolvedValue(undefined);
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('creates one fresh child Cloud Task when the failed parent was already dispatch_enqueued', async () => {
    const original = structuredClone(runs.get('parent')!);
    const response = await post(owner, { maxStep: 100, capsuleVersion: 99, approvalThreshold: 'high' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ retriedRunId: 'child', sourceRunId: 'parent',
      dispatch: { payload: { runId: 'child', traceId: 'child-trace', attempt: 1, askThreadRef: constraints.askThreadRef } } });
    expect(body.dispatch.payload.dispatchId).not.toBe('parent-dispatch');
    expect(body.dispatch.taskName).not.toBe('tasks/parent');
    expect(mocks.fetch).toHaveBeenCalledOnce();
    const task = JSON.parse(mocks.fetch.mock.calls[0][1].body as string).task;
    expect(mocks.fetch.mock.calls[0][0]).toMatch(/^https:\/\/cloud-tasks\.test\/v2\/.+\/tasks$/);
    expect(task.httpRequest.url).toBe('https://worker.test/api/agents/runs/child/execute');
    expect(JSON.parse(Buffer.from(task.httpRequest.body, 'base64').toString('utf8'))).toMatchObject({ runId: 'child', attempt: 1 });
    expect(mocks.claim).toHaveBeenCalledWith(expect.objectContaining({ ownerUid: 'owner', runId: 'child', attempt: 1 }));
    expect(mocks.enqueued).toHaveBeenCalledOnce(); expect(runs.get('parent')).toEqual(original);
  });

  it('preserves the original pin, tools, intent and constraints while stripping execution artifacts', async () => {
    expect((await post()).status).toBe(200);
    const input = mocks.create.mock.calls[0][0] as CreateAgentRunInput;
    expect(input).toMatchObject({ parentRunId: 'parent', capsuleId: 'cap-1', contextStackId: 'stack-1',
      contextPackageId: 'package-1', maxStep: 4, maxSessionMinutes: 20, internalEstimatedCostCents: 3 });
    expect(input.metadata).toMatchObject({ retryOfRunId: 'parent', workflowKind: 'multi_agent_review' });
    for (const [key, value] of Object.entries(constraints)) expect(input.metadata?.[key]).toEqual(value);
    for (const key of [...Object.keys(transients), 'workflowPlan']) expect(input.metadata).not.toHaveProperty(key);
    const child = runs.get('child')!;
    expect(child.status).toBe('queued'); expect(child.startedAt).toBeNull(); expect(child.completedAt).toBeNull();
    expect(child.internalSpendCents).toBe(0);
    expect(Date.parse(child.expiresAt!) - Date.parse(child.createdAt)).toBe(20 * 60_000);
  });

  it('offers an expired owner a new bounded child with a fresh dispatch', async () => {
    runs.set('parent', makeRun('expired'));
    expect((await post()).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledOnce(); expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(runs.get('parent')?.status).toBe('expired');
  });

  it('treats a canonically elapsed waiting deadline as expired without mutating the parent', async () => {
    const parent = makeRun('waiting_approval'); parent.expiresAt = '2026-01-01T00:20:00.000Z';
    runs.set('parent', parent); const original = structuredClone(parent);
    expect((await post()).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledOnce(); expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(runs.get('parent')).toEqual(original);
  });

  it.each([null, 'invalid', '0', '5', '2026-01-01', '2026-02-30T00:20:00.000Z'])
  ('rejects a waiting row with unvalidated deadline %s', async expiresAt => {
    const parent = makeRun('waiting_approval'); parent.expiresAt = expiresAt;
    runs.set('parent', parent);
    expect((await post()).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.claim).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each(['failed', 'cancelled', 'expired'] as const)('creates a child for terminal %s despite stale dispatch_failed metadata', async status => {
    runs.set('parent', makeRun(status, { dispatchEnqueueStatus: 'dispatch_failed' }));
    expect((await post()).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledOnce(); expect(mocks.fetch).toHaveBeenCalledOnce();
  });

  it.each(['queued', 'running'] as const)('recovers a failed dispatch on the same still-live %s run', async status => {
    runs.set('parent', makeRun(status, { dispatchEnqueueStatus: 'dispatch_failed' }));
    const response = await post(); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ retriedRunId: 'parent', sourceRunId: 'parent', dispatch: { payload: { runId: 'parent' } } });
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.fetch).toHaveBeenCalledOnce();
  });

  it.each(['queued', 'running', 'waiting_approval', 'succeeded'] as const)('rejects ordinary %s without queue writes', async status => {
    runs.set('parent', makeRun(status)); expect((await post()).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.claim).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('does not revive a succeeded run with stale dispatch_failed metadata', async () => {
    runs.set('parent', makeRun('succeeded', { dispatchEnqueueStatus: 'dispatch_failed' }));
    expect((await post()).status).toBe(409); expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('rejects a foreign owner before child creation or queue access', async () => {
    runs.get('parent')!.ownerUid = 'foreign'; expect((await post()).status).toBe(404);
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.claim).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('rejects missing records and sample users without writes', async () => {
    runs.clear(); expect((await post()).status).toBe(404);
    expect((await post({ ...owner, isDemo: true })).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });
});

it('keeps cancel policy centralized with user-safe ledger errors', () => {
  const source = readFileSync(join(process.cwd(), 'src/app/api/agents/runs/[runId]/cancel/route.ts'), 'utf8');
  expect(source).toContain('canCancelAgentRunStatus(run.status)'); expect(source).toContain('userSafeAgentRunError(message)');
});

function makeRun(status: AgentRun['status'], metadata: Record<string, unknown> = {}): AgentRun {
  const active = ['queued', 'running', 'waiting_approval'].includes(status);
  return { id: 'parent', ownerUid: 'owner', agentSpecId: null, capsuleId: 'cap-1', contextStackId: 'stack-1',
    contextPackageId: 'package-1', selectedCoreIds: normalizeCreateAgentRunInput({ ownerUid: 'owner',
      capsuleId: 'cap-1', triggerType: 'manual', objective: 'Synthetic check', selectedCoreIds: { documentCoreIds: ['doc-1'] } }).selectedCoreIds,
    status, triggerType: 'manual', objective: 'Use attached saved context only; do not browse.', traceId: 'parent-trace',
    parentRunId: null, idempotencyKey: 'original-idempotency', maxStep: 4, maxSessionMinutes: 20,
    internalEstimatedCostCents: 3, internalSpendCents: 1, createdAt: '2026-01-01T00:00:00.000Z', queuedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:20:00.000Z', startedAt: '2026-01-01T00:00:01.000Z', completedAt: active ? null : '2026-01-01T00:20:00.000Z',
    expiresAt: active ? new Date(Date.now() + 60_000).toISOString() : '2026-01-01T00:20:00.000Z',
    metadata: { ...structuredClone(constraints), ...structuredClone(transients),
      workflowPlan: { workflowKind: 'multi_agent_review', steps: [{ id: 'draft', status: 'complete' }] }, ...metadata } };
}
