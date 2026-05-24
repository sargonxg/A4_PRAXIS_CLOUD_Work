import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAgentRun: vi.fn(),
  enqueueAgentRunDispatch: vi.fn(),
  getCapsule: vi.fn(),
  getOrMigrateDefaultCapsule: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, { uid: 'user-1', isDemo: false }),
}));

vi.mock('@/lib/agent-runtime/postgres', () => ({
  createAgentRun: mocks.createAgentRun,
}));

vi.mock('@/lib/agent-runtime/cloud-tasks', () => ({
  enqueueAgentRunDispatch: mocks.enqueueAgentRunDispatch,
}));

vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: mocks.getCapsule,
  getOrMigrateDefaultCapsule: mocks.getOrMigrateDefaultCapsule,
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
});
