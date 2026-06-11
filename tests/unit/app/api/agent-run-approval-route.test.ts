import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentRun } from '@/lib/agent-runtime/types';

const mocks = vi.hoisted(() => ({
  decideAgentApproval: vi.fn(),
  getAgentRun: vi.fn(),
  updateAgentRunStatus: vi.fn(),
  enqueueAgentRunDispatch: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (
    handler: (
      request: Request,
      user: { uid: string; isDemo: boolean },
      context: { params: Promise<{ runId: string; approvalId: string }> },
    ) => Promise<Response>,
  ) => (
    request: Request,
    context: { params: Promise<{ runId: string; approvalId: string }> },
  ) => handler(request, { uid: 'user-1', isDemo: false }, context),
}));

vi.mock('@/lib/agent-runtime/postgres', () => ({
  decideAgentApproval: mocks.decideAgentApproval,
  getAgentRun: mocks.getAgentRun,
  updateAgentRunStatus: mocks.updateAgentRunStatus,
}));

vi.mock('@/lib/agent-runtime/cloud-tasks', () => ({
  enqueueAgentRunDispatch: mocks.enqueueAgentRunDispatch,
}));

describe('/api/agents/runs/[runId]/approvals/[approvalId] route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.decideAgentApproval.mockResolvedValue({
      id: 'approval-1',
      runId: 'run-1',
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      toolCallId: 'tool-1',
      status: 'approved',
      risk: 'medium',
      reason: 'Review required.',
      requestedAt: '2026-06-11T22:00:00.000Z',
      decidedAt: '2026-06-11T22:01:00.000Z',
      decidedByUid: 'user-1',
      expiresAt: null,
    });
    mocks.getAgentRun.mockResolvedValue(makeRun('waiting_approval', { dispatchAttempt: 1 }));
    mocks.updateAgentRunStatus.mockResolvedValue(makeRun('running', { dispatchAttempt: 1 }));
    mocks.enqueueAgentRunDispatch.mockResolvedValue({
      mode: 'cloud-tasks',
      queuePath: 'projects/p/locations/us-central1/queues/agent-runs',
      taskName: 'tasks/resume-2',
      targetUrl: 'https://praxis.tacitus.me/api/agents/runs/run-1/execute',
      payload: { runId: 'run-1', dispatchId: 'dispatch-2', attempt: 2 },
    });
  });

  it('uses a newer dispatch attempt when approval resumes a waiting run', async () => {
    const { POST } = await import('@/app/api/agents/runs/[runId]/approvals/[approvalId]/route');

    const response = await POST(new Request('https://praxis.local/api/agents/runs/run-1/approvals/approval-1', {
      method: 'POST',
      body: JSON.stringify({ decision: 'approved', reason: 'Canary resume.' }),
    }), {
      params: Promise.resolve({ runId: 'run-1', approvalId: 'approval-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.resumed).toBe(true);
    expect(mocks.updateAgentRunStatus).toHaveBeenCalledWith(expect.objectContaining({
      ownerUid: 'user-1',
      runId: 'run-1',
      toStatus: 'running',
      data: expect.objectContaining({ approvalId: 'approval-1', resumeAttempt: 2 }),
    }));
    expect(mocks.enqueueAgentRunDispatch).toHaveBeenCalledWith({
      ownerUid: 'user-1',
      runId: 'run-1',
      attempt: 2,
    });
  });
});

function makeRun(status: AgentRun['status'], metadata: Record<string, unknown>): AgentRun {
  return {
    id: 'run-1',
    agentSpecId: null,
    ownerUid: 'user-1',
    capsuleId: 'cap-1',
    contextStackId: null,
    contextPackageId: null,
    selectedCoreIds: {
      userCoreId: null,
      teamCoreId: null,
      situationCoreId: null,
      pathCoreId: null,
      sourceCoreIds: [],
      documentCoreIds: [],
      graphCoreId: null,
      timeCoreId: null,
      outputCoreIds: [],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: null,
    },
    status,
    triggerType: 'manual',
    objective: 'Draft the canary memo.',
    traceId: 'trace-1',
    parentRunId: null,
    idempotencyKey: 'idem-1',
    maxStep: 8,
    maxSessionMinutes: 30,
    internalEstimatedCostCents: null,
    internalSpendCents: null,
    metadata: {
      policyAgentId: 'research-memo',
      outputDestination: 'memo_studio',
      ...metadata,
    },
    createdAt: '2026-06-11T22:00:00.000Z',
    updatedAt: '2026-06-11T22:01:00.000Z',
    queuedAt: '2026-06-11T22:00:00.000Z',
    startedAt: '2026-06-11T22:00:05.000Z',
    completedAt: null,
    expiresAt: null,
  };
}
