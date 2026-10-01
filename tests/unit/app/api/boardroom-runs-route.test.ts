import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAgentRun: vi.fn(),
  listBoardroomAgentRuns: vi.fn(),
  enqueueAgentRunDispatch: vi.fn(),
  getCapsule: vi.fn(),
  getCapsuleAtVersion: vi.fn(),
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

vi.mock('@/lib/context/capsule-service', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/context/capsule-service')>(),
  getCapsule: mocks.getCapsule,
  getOrMigrateDefaultCapsule: mocks.getOrMigrateDefaultCapsule,
  getStoredContextStack: mocks.getStoredContextStack,
}));

vi.mock('@/lib/context/capsule-version-resolution', () => ({
  getCapsuleAtVersion: mocks.getCapsuleAtVersion,
}));

vi.mock('@/lib/context/context-injection', () => ({
  resolveInjectableContext: mocks.resolveInjectableContext,
  buildProtectedContextPromptBlock: (promptBlock: string) => ({
    promptBlock,
    dockTrimmed: false,
    contextTrimmed: false,
  }),
}));

describe('/api/boardroom/runs route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const capsule = {
      capsuleId: 'cap-1',
      ownerUid: 'user-1',
      label: 'Operating posture',
      version: 1,
      archivedAt: null,
      coreRefs: {
        userCoreId: 'user-core',
        situationCoreId: 'situation-core',
        sourceCoreIds: ['source-core'],
        documentCoreIds: [],
        outputCoreIds: [],
        toolCoreIds: [],
      },
    };
    mocks.getCapsule.mockResolvedValue(capsule);
    mocks.getCapsuleAtVersion.mockImplementation(async (_owner, _id, version) => ({ ...capsule, version }));
    mocks.getOrMigrateDefaultCapsule.mockResolvedValue({ capsule });
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
      capsule,
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
        capsuleAgentExecutionContext: { version: 1, capsuleId: 'cap-1', capsuleVersion: 1 },
        policyAgentId: 'boardroom-discussion',
        outputDestination: 'library',
        sourceReceiptIds: ['receipt-doc-1'],
        contextInjectionPromptBlock: expect.stringContaining('[capsule_dock]'),
        dockCapsuleIds: expect.arrayContaining(['cap-1', 'cap-user']),
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

  it('stores and executes the same submitted capsule dock payload without falling back to another stack', async () => {
    mocks.getStoredContextStack.mockResolvedValue({
      stackId: 'default',
      capsuleId: 'wrong-situation',
      capsuleRefs: [{ capsuleId: 'wrong-situation', role: 'situation', label: 'Wrong situation', primary: true, order: 0, version: 1 }],
    });
    mocks.resolveInjectableContext.mockResolvedValue({
      capsule: { ...await mocks.getCapsule('user-1', 'cap-1'), version: 2 },
      promptBlock: '<praxis-context-capsule>\n[capsule_dock]\nuser_capsule: cap-user\nsituation_capsule: cap-1\n</praxis-context-capsule>',
      dockCapsules: [
        { role: 'user', capsule: { capsuleId: 'cap-user' } },
        { role: 'situation', capsule: { capsuleId: 'cap-1' } },
      ],
    });
    const submittedDockPayload = {
      schemaVersion: 1,
      stackId: 'default',
      slots: [
        { role: 'user', capsuleId: 'cap-user', label: 'Analyst profile', version: 3 },
        { role: 'situation', capsuleId: 'cap-1', label: 'Operating posture', version: 2 },
        { role: 'tool', capsuleId: null, label: null, version: null },
        { role: 'output', capsuleId: 'cap-output', label: 'Board pack', version: 1 },
      ],
    };
    const { POST } = await import('@/app/api/boardroom/runs/route');

    const response = await POST(new Request('https://praxis.local/api/boardroom/runs', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Should the board approve the operating posture?',
        capsuleId: 'cap-1',
        contextStackId: 'default',
        capsuleDockPayload: submittedDockPayload,
        participantIds: ['legal', 'security'],
      }),
    }));

    expect(response.status).toBe(201);
    expect(mocks.resolveInjectableContext).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'user-1',
      capsuleId: 'cap-1',
      activeContextStack: expect.objectContaining({
        stackId: 'default',
        capsuleRefs: expect.arrayContaining([
          expect.objectContaining({ capsuleId: 'cap-user', role: 'user', label: 'Analyst profile', version: 3 }),
          expect.objectContaining({ capsuleId: 'cap-1', role: 'situation', label: 'Operating posture', version: 2 }),
          expect.objectContaining({ capsuleId: 'cap-output', role: 'output', label: 'Board pack', version: 1 }),
        ]),
      }),
    }));
    expect(mocks.createAgentRun).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        capsuleDockPayload: submittedDockPayload,
        boardroomSpec: expect.objectContaining({
          capsuleDockPayload: submittedDockPayload,
        }),
        contextInjectionPromptBlock: expect.stringContaining('[capsule_dock]'),
      }),
    }));
    const storedMetadata = mocks.createAgentRun.mock.calls.at(-1)?.[0]?.metadata;
    expect(storedMetadata.contextInjectionPromptBlock).toContain('user_capsule: cap-user');
    expect(storedMetadata.contextInjectionPromptBlock).toContain('situation_capsule: cap-1');
    expect(storedMetadata.contextInjectionPromptBlock).not.toContain('wrong-situation');
  });

  it('captures explicit situation v2 while current is v3, including historical evidence and prompt inputs', async () => {
    const current = { ...await mocks.getCapsule('user-1', 'cap-1'), version: 3 };
    const historical = {
      ...current,
      version: 2,
      coreRefs: { ...current.coreRefs, situationCoreId: 'situation-v2', sourceCoreIds: ['source-v2'], documentCoreIds: ['doc-v2'] },
    };
    mocks.getCapsule.mockResolvedValue(current);
    mocks.getCapsuleAtVersion.mockResolvedValue(historical);
    mocks.resolveInjectableContext.mockResolvedValue({
      capsule: historical,
      promptBlock: 'Saved version 2 context',
      dockCapsules: [{ role: 'situation', capsule: historical }],
      missingDockCapsuleIds: [],
    });
    mocks.getStoredContextStack.mockResolvedValue({
      stackId: 'default', capsuleId: 'cap-1', sourceIds: ['source-v3'], documentIds: ['doc-v3'],
      capsuleRefs: [{ capsuleId: 'cap-1', role: 'situation', primary: true, version: 3 }],
    });
    const response = await postRun({ capsuleDockPayload: { slots: [{ role: 'situation', capsuleId: 'cap-1', version: 2 }] } });

    expect(response.status).toBe(201);
    expect(mocks.getCapsuleAtVersion).toHaveBeenCalledWith('user-1', 'cap-1', 2);
    expect(mocks.resolveInjectableContext).toHaveBeenCalledWith(expect.objectContaining({
      capsuleId: 'cap-1',
      activeContextStack: expect.objectContaining({
        sourceIds: ['source-v2'], documentIds: ['doc-v2'], situationId: 'situation-v2',
        capsuleRefs: expect.arrayContaining([expect.objectContaining({ capsuleId: 'cap-1', version: 2, primary: true })]),
      }),
    }));
    expect(mocks.createAgentRun).toHaveBeenCalledWith(expect.objectContaining({
      contextPackageId: 'capsule:cap-1:v2',
      selectedCoreIds: expect.objectContaining({ situationCoreId: 'situation-v2', sourceCoreIds: ['source-v2'], documentCoreIds: ['doc-v2'] }),
      metadata: expect.objectContaining({
        capsuleAgentExecutionContext: { version: 1, capsuleId: 'cap-1', capsuleVersion: 2 },
        contextInjectionPromptBlock: 'Saved version 2 context',
      }),
    }));
  });

  it.each([0, -1, 1.5, '2', Number.MAX_SAFE_INTEGER + 1])('rejects malformed explicit version %s before queueing', async (version) => {
    const response = await postRun({ capsuleDockPayload: { slots: [{ role: 'situation', capsuleId: 'cap-1', version }] } });
    expect(response.status).toBe(400);
    expect(mocks.getCapsuleAtVersion).not.toHaveBeenCalled();
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.enqueueAgentRunDispatch).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', null],
    ['foreign owner', { ownerUid: 'other-owner', version: 2 }],
    ['wrong id', { capsuleId: 'other-cap', version: 2 }],
    ['stale resolver result', { version: 3 }],
    ['archived', { version: 2, archivedAt: '2026-09-30T00:00:00Z' }],
  ])('rejects %s historical context without creating or dispatching a run', async (_reason, patch) => {
    const capsule = await mocks.getCapsule('user-1', 'cap-1');
    mocks.getCapsuleAtVersion.mockResolvedValue(patch ? { ...capsule, ...patch } : null);
    const response = await postRun({ capsuleDockPayload: { slots: [{ role: 'situation', capsuleId: 'cap-1', version: 2 }] } });
    expect(response.status).toBe(409);
    expect(mocks.resolveInjectableContext).not.toHaveBeenCalled();
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.enqueueAgentRunDispatch).not.toHaveBeenCalled();
  });

  it('does not silently queue thin context when prompt compilation fails', async () => {
    mocks.resolveInjectableContext.mockRejectedValue(new Error('Requested dock version is unavailable'));
    const response = await postRun();
    expect(response.status).toBe(409);
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.enqueueAgentRunDispatch).not.toHaveBeenCalled();
  });

  it('rejects a prompt resolver that widens the captured historical version', async () => {
    const capsule = await mocks.getCapsule('user-1', 'cap-1');
    mocks.getCapsuleAtVersion.mockResolvedValue({ ...capsule, version: 2 });
    mocks.resolveInjectableContext.mockResolvedValue({ capsule: { ...capsule, version: 3 }, promptBlock: 'Newer context', dockCapsules: [] });
    const response = await postRun({ capsuleDockPayload: { slots: [{ role: 'situation', capsuleId: 'cap-1', version: 2 }] } });
    expect(response.status).toBe(409);
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.enqueueAgentRunDispatch).not.toHaveBeenCalled();
  });

  it('keeps an additional user-only dock while pinning the manually selected governing capsule', async () => {
    mocks.getStoredContextStack.mockResolvedValue(null);
    const response = await postRun({ capsuleDockPayload: { slots: [{ role: 'user', capsuleId: 'cap-user', version: 3 }] } });
    expect(response.status).toBe(201);
    expect(mocks.resolveInjectableContext).toHaveBeenCalledWith(expect.objectContaining({
      activeContextStack: expect.objectContaining({ capsuleRefs: expect.arrayContaining([
        expect.objectContaining({ capsuleId: 'cap-1', version: 1, primary: true }),
        expect.objectContaining({ capsuleId: 'cap-user', version: 3, role: 'user', primary: false }),
      ]) }),
    }));
  });

  it('uses the explicit situation selection without requiring a separate capsule id', async () => {
    const capsule = { ...await mocks.getCapsule('user-1', 'cap-1'), version: 2 };
    mocks.getCapsuleAtVersion.mockResolvedValue(capsule);
    mocks.resolveInjectableContext.mockResolvedValue({ capsule, promptBlock: 'Saved version 2', dockCapsules: [{ role: 'situation', capsule }] });
    const response = await postRun({ capsuleId: undefined, capsuleDockPayload: { slots: [{ role: 'situation', capsuleId: 'cap-1', version: 2 }] } });
    expect(response.status).toBe(201);
    expect(mocks.getCapsuleAtVersion).toHaveBeenCalledWith('user-1', 'cap-1', 2);
    expect(mocks.getOrMigrateDefaultCapsule).not.toHaveBeenCalled();
  });

  it.each([
    { version: 0 }, { version: undefined }, { ownerUid: 'other-owner' }, { archivedAt: '2026-09-30T00:00:00Z' },
  ])('rejects invalid current selection %j before queueing', async (patch) => {
    mocks.getCapsule.mockResolvedValue({ ...await mocks.getCapsule('user-1', 'cap-1'), ...patch });
    const response = await postRun();
    expect([404, 409]).toContain(response.status);
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.enqueueAgentRunDispatch).not.toHaveBeenCalled();
  });

  it('rejects a mismatched primary situation instead of choosing either capsule', async () => {
    const response = await postRun({ capsuleDockPayload: { slots: [{ role: 'situation', capsuleId: 'different-cap', version: 2 }] } });
    expect(response.status).toBe(400);
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.enqueueAgentRunDispatch).not.toHaveBeenCalled();
  });

  it.each([
    { slots: [{ role: 'situation', capsuleId: 'cap-1', version: 2 }, { role: 'situation', capsuleId: 'cap-1', version: 3 }] },
    { slots: [{ role: 'situation', capsuleId: null, version: 2 }] },
  ])('rejects ambiguous or orphaned dock pins before normalization', async ({ slots }) => {
    const response = await postRun({ capsuleDockPayload: { slots } });
    expect(response.status).toBe(400);
    expect(mocks.getCapsuleAtVersion).not.toHaveBeenCalled();
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.enqueueAgentRunDispatch).not.toHaveBeenCalled();
  });

  it('captures the current saved version when no explicit pin exists and ignores client execution metadata', async () => {
    const current = { ...await mocks.getCapsule('user-1', 'cap-1'), version: 3 };
    mocks.getCapsule.mockResolvedValue(current);
    mocks.getCapsuleAtVersion.mockResolvedValue(current);
    mocks.resolveInjectableContext.mockResolvedValue({ capsule: current, promptBlock: 'Saved version 3', dockCapsules: [{ role: 'situation', capsule: current }], missingDockCapsuleIds: [] });
    const response = await postRun({ metadata: { capsuleAgentExecutionContext: { version: 1, capsuleId: 'foreign', capsuleVersion: 999 } } });
    expect(response.status).toBe(201);
    expect(mocks.getCapsuleAtVersion).toHaveBeenCalledWith('user-1', 'cap-1', 3);
    expect(mocks.createAgentRun).toHaveBeenCalledWith(expect.objectContaining({
      contextPackageId: 'capsule:cap-1:v3',
      metadata: expect.objectContaining({ capsuleAgentExecutionContext: { version: 1, capsuleId: 'cap-1', capsuleVersion: 3 } }),
    }));
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

async function postRun(overrides: Record<string, unknown> = {}) {
  const { POST } = await import('@/app/api/boardroom/runs/route');
  return POST(new Request('https://praxis.local/api/boardroom/runs', {
    method: 'POST',
    body: JSON.stringify({ question: 'Should the board approve the operating posture?', capsuleId: 'cap-1', participantIds: ['legal', 'security'], ...overrides }),
  }));
}

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
