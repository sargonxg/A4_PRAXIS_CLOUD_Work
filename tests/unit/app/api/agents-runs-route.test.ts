import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listAgentRunsForCapsule: vi.fn(),
  createAgentRun: vi.fn(),
  getCapsule: vi.fn(),
  getOrMigrateDefaultCapsule: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, { uid: 'user-1', isDemo: false }),
}));

vi.mock('@/lib/agent-runtime/postgres', () => ({
  listAgentRunsForCapsule: mocks.listAgentRunsForCapsule,
  createAgentRun: mocks.createAgentRun,
}));

vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: mocks.getCapsule,
  getOrMigrateDefaultCapsule: mocks.getOrMigrateDefaultCapsule,
}));

describe('/api/agents/runs route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCapsule.mockResolvedValue({
      capsuleId: 'cap-1',
      archivedAt: null,
      coreRefs: {
        userCoreId: 'user-core',
        situationCoreId: 'situation-core',
      },
    });
  });

  it('returns a sanitized degraded ledger response for Cloud SQL private-IP connection timeouts', async () => {
    const timeout = Object.assign(new Error('connect ETIMEDOUT 10.12.0.3:5432 for praxisbytacitus:us-east4:praxisbytacitus-instance'), {
      code: 'ETIMEDOUT',
    });
    mocks.listAgentRunsForCapsule.mockRejectedValue(timeout);
    const { GET } = await import('@/app/api/agents/runs/route');

    const response = await GET(new Request('https://praxis.tacitus.me/api/agents/runs?capsuleId=cap-1'));
    const body = await response.json();
    const json = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      error: 'Agent run ledger unavailable',
      persisted: false,
      degraded: true,
    });
    expect(json).not.toContain('10.12.0.3');
    expect(json).not.toContain('praxisbytacitus-instance');
    expect(json).not.toContain('ETIMEDOUT');
  });

  it('passes selected context-chain cores and receipt metadata into run creation', async () => {
    mocks.createAgentRun.mockResolvedValue({
      id: 'run-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-19T12:00:00.000Z',
      updatedAt: '2026-05-19T12:00:00.000Z',
      objective: 'Draft the memo from this active context chain.',
      metadata: {
        policyAgentId: 'research-memo',
        outputDestination: 'memo_studio',
      },
    });
    const { POST } = await import('@/app/api/agents/runs/route');

    const response = await POST(new Request('https://praxis.tacitus.me/api/agents/runs', {
      method: 'POST',
      body: JSON.stringify({
        capsuleId: 'cap-1',
        contextStackId: 'default',
        contextPackageId: 'capsule:cap-1:v1',
        policyAgentId: 'research-memo',
        outputDestination: 'memo_studio',
        objective: 'Draft the memo from this active context chain.',
        selectedCoreIds: {
          userCoreId: 'starter-user-generic-analyst',
          situationCoreId: 'situation-cap',
          sourceCoreIds: ['reference-cap'],
          toolCoreIds: ['sourceability-check'],
          outputCoreIds: ['options memo'],
        },
        metadata: {
          appliedCapsules: [
            { id: 'starter-user-generic-analyst', label: 'Generic analyst', role: 'user' },
            { id: 'situation-cap', label: 'Situation', role: 'situation' },
            { id: 'reference-cap', label: 'References', role: 'reference' },
            { id: 'sourceability-check', label: 'Sourceability', role: 'tool' },
            { id: 'output-cap', label: 'Options memo', role: 'output' },
          ],
          activeContextStack: {
            stackId: 'default',
            capsuleId: 'cap-1',
            userModelId: 'starter-user-generic-analyst',
            situationId: 'situation-cap',
            sourceIds: ['reference-cap'],
            documentIds: [],
            outputGoal: 'Options memo',
            evidenceGaps: [],
            canvasLayout: {},
            schemaVersion: 1,
            updatedAt: '2026-05-19T12:00:00.000Z',
          },
          selectedTools: ['sourceability-check'],
          outputDestination: 'memo_studio',
          sourcePosture: 'Operational',
        },
      }),
    }));

    expect(response.status).toBe(201);
    expect(mocks.createAgentRun).toHaveBeenCalledWith(expect.objectContaining({
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      contextStackId: 'default',
      contextPackageId: 'capsule:cap-1:v1',
      selectedCoreIds: expect.objectContaining({
        userCoreId: 'starter-user-generic-analyst',
        situationCoreId: 'situation-cap',
        sourceCoreIds: ['reference-cap'],
        toolCoreIds: ['sourceability-check'],
        outputCoreIds: ['options memo'],
      }),
      metadata: expect.objectContaining({
        activeContextStack: expect.objectContaining({
          situationId: 'situation-cap',
          sourceIds: ['reference-cap'],
          outputGoal: 'Options memo',
        }),
        selectedTools: ['sourceability-check'],
        sourcePosture: 'Operational',
        executionMode: 'queued-only',
      }),
    }));
  });
});
