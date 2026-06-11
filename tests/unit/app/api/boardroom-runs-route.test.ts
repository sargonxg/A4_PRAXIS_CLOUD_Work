import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAgentRun: vi.fn(),
  listBoardroomAgentRuns: vi.fn(),
  enqueueAgentRunDispatch: vi.fn(),
  getCapsule: vi.fn(),
  getOrMigrateDefaultCapsule: vi.fn(),
  getStoredContextStack: vi.fn(),
  resolveInjectableContext: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, { uid: 'user-1', isDemo: false }),
}));

vi.mock('@/lib/agent-runtime/postgres', () => ({
  createAgentRun: mocks.createAgentRun,
  listBoardroomAgentRuns: mocks.listBoardroomAgentRuns,
}));

vi.mock('@/lib/agent-runtime/cloud-tasks', () => ({
  enqueueAgentRunDispatch: mocks.enqueueAgentRunDispatch,
}));

vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: mocks.getCapsule,
  getOrMigrateDefaultCapsule: mocks.getOrMigrateDefaultCapsule,
  getStoredContextStack: mocks.getStoredContextStack,
}));

vi.mock('@/lib/context/context-injection', () => ({
  resolveInjectableContext: mocks.resolveInjectableContext,
}));

describe('/api/boardroom/runs route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCapsule.mockResolvedValue({
      capsuleId: 'cap-1',
      archivedAt: null,
      coreRefs: {
        userCoreId: 'user-core',
        situationCoreId: 'situation-core',
        sourceCoreIds: ['source-core'],
        documentCoreIds: [],
      },
    });
    mocks.createAgentRun.mockResolvedValue({
      id: 'run-boardroom-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-24T12:00:00.000Z',
      updatedAt: '2026-05-24T12:00:00.000Z',
      objective: 'Should the board approve the operating posture?',
      metadata: {
        policyAgentId: 'boardroom-discussion',
        outputDestination: 'library',
        selectedToolIds: ['context-resolve', 'boardroom-deliberation', 'board-executive-pack'],
        boardroomSpec: {
          question: 'Should the board approve the operating posture?',
          participantIds: ['synthesis-chair', 'legal', 'security'],
          selectedDocumentIds: ['doc-1'],
        },
      },
    });
    mocks.enqueueAgentRunDispatch.mockResolvedValue({
      mode: 'cloud-tasks',
      queuePath: 'projects/p/locations/l/queues/agent-runs',
      taskName: 'tasks/boardroom',
      targetUrl: 'https://praxis.tacitus.me/api/agents/runs/run-boardroom-1/execute',
      payload: { runId: 'run-boardroom-1', dispatchId: 'dispatch-1' },
    });
    mocks.getStoredContextStack.mockResolvedValue({ stackId: 'default', capsuleRefs: [] });
    mocks.resolveInjectableContext.mockResolvedValue({
      promptBlock: '<praxis-context-capsule>\n[capsule_dock]\nsituation_capsule: cap-1 (v1, health 80)\n</praxis-context-capsule>',
      dockCapsules: [
        { role: 'situation', capsule: { capsuleId: 'cap-1' } },
        { role: 'user', capsule: { capsuleId: 'cap-user' } },
      ],
    });
  });

  it('rejects invalid boardroom specs before creating AgentRuns', async () => {
    const { POST } = await import('@/app/api/boardroom/runs/route');

    const response = await POST(new Request('https://praxis.local/api/boardroom/runs', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Too few participants?',
        capsuleId: 'cap-1',
        participantIds: ['legal'],
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid boardroom run request');
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.enqueueAgentRunDispatch).not.toHaveBeenCalled();
  });

  it('creates a boardroom AgentRun and triggers Cloud Tasks dispatch', async () => {
    const { POST } = await import('@/app/api/boardroom/runs/route');

    const response = await POST(new Request('https://praxis.local/api/boardroom/runs', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Should the board approve the operating posture?',
        capsuleId: 'cap-1',
        directContext: 'Board wants a decision by Friday.',
        selectedDocumentIds: ['doc-1'],
        selectedSources: [{
          documentId: 'doc-1',
          sourceCoreId: 'source-core-doc-1',
          sourceReceiptId: 'receipt-doc-1',
          label: 'Uploaded posture note',
          kind: 'uploaded-document',
          fileType: 'txt',
        }],
        participantIds: ['legal', 'security'],
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.run).toMatchObject({
      runId: 'run-boardroom-1',
      policyAgentId: 'boardroom-discussion',
      outputDestination: 'library',
    });
    expect(body.dispatch).toMatchObject({ mode: 'cloud-tasks' });
    expect(mocks.createAgentRun).toHaveBeenCalledWith(expect.objectContaining({
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      objective: 'Should the board approve the operating posture?',
      selectedCoreIds: expect.objectContaining({
        situationCoreId: 'situation-core',
        sourceCoreIds: ['source-core', 'source-core-doc-1'],
        documentCoreIds: ['doc-1'],
      }),
      metadata: expect.objectContaining({
        policyAgentId: 'boardroom-discussion',
        outputDestination: 'library',
        sourceReceiptIds: ['receipt-doc-1'],
        contextInjectionPromptBlock: expect.stringContaining('[capsule_dock]'),
        dockCapsuleIds: ['cap-1', 'cap-user'],
        selectedSources: [expect.objectContaining({
          documentId: 'doc-1',
          sourceReceiptId: 'receipt-doc-1',
          label: 'Uploaded posture note',
        })],
        boardroomSpec: expect.objectContaining({
          participantIds: ['synthesis-chair', 'legal', 'security'],
          directContext: 'Board wants a decision by Friday.',
          selectedSources: [expect.objectContaining({
            documentId: 'doc-1',
            sourceReceiptId: 'receipt-doc-1',
            label: 'Uploaded posture note',
          })],
        }),
      }),
    }));
    expect(mocks.enqueueAgentRunDispatch).toHaveBeenCalledWith({
      ownerUid: 'user-1',
      runId: 'run-boardroom-1',
      attempt: 1,
    });
  });

  it('returns queued run metadata when dispatch is not configured locally', async () => {
    mocks.enqueueAgentRunDispatch.mockRejectedValue(new Error('Agent run dispatch is not configured: set AGENT_RUN_WORKER_BASE_URL or APP_URL for the worker route.'));
    const { POST } = await import('@/app/api/boardroom/runs/route');

    const response = await POST(new Request('https://praxis.local/api/boardroom/runs', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Should we continue?',
        capsuleId: 'cap-1',
        participantIds: ['legal', 'security'],
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.run.runId).toBe('run-boardroom-1');
    expect(body.dispatch).toMatchObject({ dispatched: false, degraded: true });
  });

  it('lists only this user boardroom runs for history', async () => {
    mocks.listBoardroomAgentRuns.mockResolvedValue([
      makeHistoryRun('run-boardroom-2', 'boardroom-discussion'),
    ]);
    const { GET } = await import('@/app/api/boardroom/history/route');

    const response = await GET(new Request('https://praxis.local/api/boardroom/history?limit=10'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.listBoardroomAgentRuns).toHaveBeenCalledWith('user-1', 10);
    expect(body.persisted).toBe(true);
    expect(body.runs).toHaveLength(1);
    expect(body.runs[0]).toMatchObject({
      runId: 'run-boardroom-2',
      title: 'Should the board approve run-boardroom-2?',
      capsuleId: 'cap-1',
      status: 'succeeded',
      outputHref: '/app/boardroom?runId=run-boardroom-2',
    });
  });
});

function makeHistoryRun(id: string, policyAgentId: string) {
  return {
    id,
    agentSpecId: null,
    ownerUid: 'user-1',
    capsuleId: 'cap-1',
    contextStackId: 'default',
    contextPackageId: null,
    selectedCoreIds: {
      userCoreId: 'user-core',
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
    status: 'succeeded',
    triggerType: 'manual',
    objective: `Should the board approve ${id}?`,
    traceId: `trace-${id}`,
    parentRunId: null,
    idempotencyKey: `history:${id}`,
    maxStep: 24,
    maxSessionMinutes: 45,
    internalEstimatedCostCents: null,
    internalSpendCents: 0,
    metadata: {
      policyAgentId,
      policyAgentLabel: 'Boardroom Discussion',
      source: policyAgentId === 'boardroom-discussion' ? 'boardroom-workspace' : 'ask',
      outputDestination: 'library',
      outputHref: `/app/boardroom?runId=${id}`,
      memoId: `memo-${id}`,
      outputCapsuleId: `output-${id}`,
    },
    createdAt: '2026-05-31T12:00:00.000Z',
    updatedAt: '2026-05-31T12:05:00.000Z',
    queuedAt: '2026-05-31T12:00:00.000Z',
    startedAt: '2026-05-31T12:01:00.000Z',
    completedAt: '2026-05-31T12:05:00.000Z',
    expiresAt: null,
  };
}
