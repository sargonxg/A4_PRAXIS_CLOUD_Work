import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listAgentRunsForCapsule: vi.fn(),
  createAgentRun: vi.fn(),
  getCapsule: vi.fn(),
  getOrMigrateDefaultCapsule: vi.fn(),
  getCapsuleAtVersion: vi.fn(),
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

vi.mock('@/lib/context/capsule-version-resolution', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/context/capsule-version-resolution')>(),
  getCapsuleAtVersion: mocks.getCapsuleAtVersion,
}));

describe('/api/agents/runs route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCapsule.mockResolvedValue({
      capsuleId: 'cap-1',
      ownerUid: 'user-1',
      version: 3,
      archivedAt: null,
      coreRefs: {
        userCoreId: 'user-core',
        situationCoreId: 'situation-core',
      },
    });
    mocks.getCapsuleAtVersion.mockImplementation(async (uid: string, capsuleId: string, version: number) => ({
      ownerUid: uid, capsuleId, version, archivedAt: null,
      coreRefs: { userCoreId: 'pinned-user-core', situationCoreId: 'pinned-situation-core' },
    }));
    mocks.createAgentRun.mockResolvedValue({
      id: 'run-1', ownerUid: 'user-1', status: 'queued', capsuleId: 'cap-1',
      createdAt: '2026-09-30T23:00:00.000Z', updatedAt: '2026-09-30T23:00:00.000Z',
      objective: 'Review this saved capsule.', metadata: {},
    });
  });

  it('captures the manual selection at enqueue without relying on caller snapshot metadata', async () => {
    const { POST } = await import('@/app/api/agents/runs/route');
    const response = await POST(new Request('https://praxis.tacitus.me/api/agents/runs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsuleId: 'cap-1', objective: 'Review this saved capsule.' }),
    }));
    expect(response.status).toBe(201);
    expect(mocks.getCapsuleAtVersion).toHaveBeenCalledWith('user-1', 'cap-1', 3);
    expect(mocks.createAgentRun).toHaveBeenCalledWith(expect.objectContaining({
      selectedCoreIds: expect.objectContaining({ userCoreId: 'pinned-user-core' }),
      metadata: expect.objectContaining({ capsuleAgentExecutionContext: { version: 1, capsuleId: 'cap-1', capsuleVersion: 3 } }),
    }));
  });

  it('preserves an explicit version 2 attachment when the current capsule is version 3', async () => {
    const { POST } = await import('@/app/api/agents/runs/route');
    const response = await POST(new Request('https://praxis.tacitus.me/api/agents/runs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsuleId: 'cap-1', objective: 'Review only the attached version.', metadata: {
        activeContextStack: { capsuleRefs: [{ capsuleId: 'cap-1', version: 2 }] },
      } }),
    }));
    expect(response.status).toBe(201);
    expect(mocks.getCapsuleAtVersion).toHaveBeenCalledWith('user-1', 'cap-1', 2);
    expect(mocks.createAgentRun).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ capsuleAgentExecutionContext: { version: 1, capsuleId: 'cap-1', capsuleVersion: 2 } }),
    }));
  });

  it.each([null, undefined])('captures an originally unpinned manual workbench selection (%j)', async (version) => {
    const { POST } = await import('@/app/api/agents/runs/route');
    const response = await POST(new Request('https://praxis.tacitus.me/api/agents/runs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsuleId: 'cap-1', objective: 'Review this saved capsule.', metadata: {
        activeContextStack: { capsuleRefs: [{ capsuleId: 'cap-1', version }] },
      } }),
    }));
    expect(response.status).toBe(201);
    expect(mocks.getCapsuleAtVersion).toHaveBeenCalledWith('user-1', 'cap-1', 3);
  });

  it('does not redirect a corrupt capsule record to another owned capsule', async () => {
    mocks.getCapsule.mockResolvedValue({ ownerUid: 'user-1', capsuleId: 'cap-2', version: 3, coreRefs: {}, archivedAt: null });
    const { POST } = await import('@/app/api/agents/runs/route');
    const response = await POST(new Request('https://praxis.tacitus.me/api/agents/runs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsuleId: 'cap-1', objective: 'Review this saved capsule.' }),
    }));
    expect(response.status).toBe(409);
    expect(mocks.getCapsuleAtVersion).not.toHaveBeenCalled();
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
  });

  it.each([
    { capsuleAgentExecutionContext: { version: 1, capsuleId: 'foreign-cap', capsuleVersion: 2 } },
    { activeContextStack: { capsuleRefs: [{ capsuleId: 'cap-1', version: '2' }] } },
    { activeContextStack: { capsuleRefs: [{ capsuleId: 'cap-1', version: 2 }, { capsuleId: 'cap-1', version: 3 }] } },
  ])('refuses malformed or conflicting explicit pins before queue persistence (%j)', async (metadata) => {
    const { POST } = await import('@/app/api/agents/runs/route');
    const response = await POST(new Request('https://praxis.tacitus.me/api/agents/runs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsuleId: 'cap-1', objective: 'Review this saved capsule.', metadata }),
    }));
    expect(response.status).toBe(409);
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
    expect(mocks.getCapsuleAtVersion).not.toHaveBeenCalled();
  });

  it.each([null, { ownerUid: 'foreign-owner', capsuleId: 'cap-1', version: 3 },
    { ownerUid: 'user-1', capsuleId: 'cap-other', version: 3 },
    { ownerUid: 'user-1', capsuleId: 'cap-1', version: 2 },
    { ownerUid: 'user-1', capsuleId: 'cap-1', version: 3, archivedAt: '2026-09-30' },
  ])('does not enqueue when the requested snapshot is unavailable or unowned (%j)', async (snapshot) => {
    mocks.getCapsuleAtVersion.mockResolvedValue(snapshot);
    const { POST } = await import('@/app/api/agents/runs/route');
    const response = await POST(new Request('https://praxis.tacitus.me/api/agents/runs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsuleId: 'cap-1', objective: 'Review this saved capsule.' }),
    }));
    expect(response.status).toBe(409);
    expect(mocks.createAgentRun).not.toHaveBeenCalled();
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

  it('auto-resolves default capsule run history instead of returning noisy 404s for new accounts', async () => {
    mocks.getCapsule.mockResolvedValue(null);
    mocks.getOrMigrateDefaultCapsule.mockResolvedValue({
      capsule: {
        capsuleId: 'default',
        archivedAt: null,
        coreRefs: {},
      },
      migrated: false,
      persisted: true,
    });
    mocks.listAgentRunsForCapsule.mockResolvedValue([]);
    const { GET } = await import('@/app/api/agents/runs/route');

    const response = await GET(new Request('https://praxis.tacitus.me/api/agents/runs?capsuleId=default'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ runs: [], persisted: true, capsuleResolved: true });
    expect(mocks.getOrMigrateDefaultCapsule).toHaveBeenCalledWith('user-1');
    expect(mocks.listAgentRunsForCapsule).toHaveBeenCalledWith('user-1', 'default', 25);
  });

  it('returns empty degraded run history when default capsule compatibility creation is unavailable', async () => {
    mocks.getCapsule.mockResolvedValue(null);
    mocks.getOrMigrateDefaultCapsule.mockRejectedValue(new Error('Firestore unavailable'));
    const { GET } = await import('@/app/api/agents/runs/route');

    const response = await GET(new Request('https://praxis.tacitus.me/api/agents/runs?capsuleId=default'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      runs: [],
      persisted: false,
      degraded: true,
      capsuleResolved: false,
      detail: 'No active capsule exists yet. Agent run history will appear after the first capsule is created.',
    });
    expect(mocks.listAgentRunsForCapsule).not.toHaveBeenCalled();
  });

  it('passes selected context-chain cores and receipt metadata into run creation', async () => {
    mocks.createAgentRun.mockResolvedValue({
      id: 'run-1',
      ownerUid: 'user-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-19T12:00:00.000Z',
      updatedAt: '2026-05-19T12:00:00.000Z',
      objective: 'Draft the memo from this active context chain.',
      metadata: {
        policyAgentId: 'research-memo',
        outputDestination: 'memo_studio',
        factoryLane: 'repository',
        ontologyStack: ['policy-core', 'source-to-claim'],
        graphMode: 'embedded_proposal',
        cogneeMode: 'disabled',
        sourceReceiptIds: ['src-1'],
        embeddedGraphArtifactId: 'graph-artifact-1',
        ecosystemContributors: ['dialectica', 'kairos', 'agon'],
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
          factoryLane: 'repository',
          ontologyStack: ['policy-core', 'source-to-claim'],
          graphMode: 'embedded_proposal',
          cogneeMode: 'disabled',
          sourceReceiptIds: ['src-1'],
          embeddedGraphArtifactId: 'graph-artifact-1',
          ecosystemContributors: ['dialectica', 'kairos', 'agon'],
        },
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.factoryMetadata).toMatchObject({
      factoryLane: 'repository',
      graphMode: 'embedded_proposal',
      cogneeMode: 'disabled',
      sourceReceiptIds: ['src-1'],
      ecosystemContributors: ['dialectica', 'kairos', 'agon'],
    });
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
        factoryLane: 'repository',
        graphMode: 'embedded_proposal',
        cogneeMode: 'disabled',
        ecosystemContributors: ['dialectica', 'kairos', 'agon'],
        executionMode: 'queued-only',
      }),
    }));
  });
});
