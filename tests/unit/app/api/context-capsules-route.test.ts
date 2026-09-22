import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  activateCapsule: vi.fn(),
  combineCapsules: vi.fn(),
  createCapsule: vi.fn(),
  createCapsuleFromCorePackage: vi.fn(),
  createEmptyCapsuleInventorySummary: vi.fn(() => ({
    storedCapsules: 0,
    activeCapsules: 0,
    archivedCapsules: 0,
    starterCapsules: 0,
    userCreatedCapsules: 0,
    publicCapsules: 0,
    privateCapsules: 0,
    sourceReferences: 0,
    documentReferences: 0,
    toolReferences: 0,
    outputReferences: 0,
    byType: [],
    byDomain: [],
    byPolicyTeam: [],
    integrityWarnings: [],
  })),
  forkCapsule: vi.fn(),
  listCapsuleInventory: vi.fn(),
  seedStarterCapsules: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: unknown) => handler,
}));

vi.mock('@/lib/api/standard-error', () => ({
  handleRouteError: (err: unknown) => Response.json({ error: err instanceof Error ? err.message : 'route failed' }, { status: 500 }),
}));

vi.mock('@/lib/context/capsule-service', () => service);

vi.mock('@/lib/context/core-package', () => ({
  parseCorePackage: vi.fn(),
}));

type MockedAuthRouteHandler = (
  request: Request,
  user: { uid: string; isDemo: boolean },
) => Promise<Response>;

describe('GET /api/context/capsules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns capsules with a server-derived inventory summary for authenticated users', async () => {
    service.listCapsuleInventory.mockResolvedValueOnce({
      capsules: [{ capsuleId: 'cap-active', label: 'Active capsule', archivedAt: null }],
      summary: {
        storedCapsules: 2,
        activeCapsules: 1,
        archivedCapsules: 1,
        starterCapsules: 0,
        userCreatedCapsules: 1,
        publicCapsules: 0,
        privateCapsules: 1,
        sourceReferences: 1,
        documentReferences: 0,
        toolReferences: 1,
        outputReferences: 0,
        byType: [{ id: 'situation', label: 'Situation', count: 1 }],
        byDomain: [],
        byPolicyTeam: [],
        integrityWarnings: [],
      },
    });
    const { GET } = await import('@/app/api/context/capsules/route');
    const get = GET as unknown as MockedAuthRouteHandler;

    const response = await get(
      new Request('http://localhost/api/context/capsules?includeArchived=true'),
      { uid: 'u1', isDemo: false },
    );
    const payload = await response.json();

    expect(service.listCapsuleInventory).toHaveBeenCalledWith('u1', {
      situationId: undefined,
      includeArchived: true,
    });
    expect(payload.persisted).toBe(true);
    expect(payload.capsules).toHaveLength(1);
    expect(payload.summary).toMatchObject({
      storedCapsules: 2,
      activeCapsules: 1,
      archivedCapsules: 1,
    });
  });

  it('returns a zeroed summary for demo users', async () => {
    const { GET } = await import('@/app/api/context/capsules/route');
    const get = GET as unknown as MockedAuthRouteHandler;

    const response = await get(
      new Request('http://localhost/api/context/capsules'),
      { uid: 'demo', isDemo: true },
    );
    const payload = await response.json();

    expect(service.listCapsuleInventory).not.toHaveBeenCalled();
    expect(service.createEmptyCapsuleInventorySummary).toHaveBeenCalled();
    expect(payload).toMatchObject({
      capsules: [],
      persisted: false,
      summary: {
        storedCapsules: 0,
        activeCapsules: 0,
        archivedCapsules: 0,
      },
    });
  });
});

describe('POST /api/context/capsules selected starter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes a validated selection to the owner-scoped service', async () => {
    const { POST } = await import('@/app/api/context/capsules/route');
    const { CAPSULE_STARTER_DEFINITIONS } = await import('@/lib/product/context-capsules');
    const starterId = CAPSULE_STARTER_DEFINITIONS[0].starterId;
    service.seedStarterCapsules.mockResolvedValueOnce({ created: 1, existing: 0, capsules: [] });
    const response = await (POST as unknown as MockedAuthRouteHandler)(new Request('http://localhost/api/context/capsules', {
      method: 'POST', body: JSON.stringify({ action: 'seed-starters', starterId }),
    }), { uid: 'u1', isDemo: false });
    expect(response.status).toBe(201);
    expect(service.seedStarterCapsules).toHaveBeenCalledWith('u1', undefined, { starterId });
  });

  it.each(['unknown', '', 123])('rejects invalid selections without falling through to create: %s', async (starterId) => {
    const { POST } = await import('@/app/api/context/capsules/route');
    const response = await (POST as unknown as MockedAuthRouteHandler)(new Request('http://localhost/api/context/capsules', {
      method: 'POST', body: JSON.stringify({ action: 'seed-starters', starterId }),
    }), { uid: 'u1', isDemo: false });
    expect(response.status).toBe(400);
    expect(service.seedStarterCapsules).not.toHaveBeenCalled();
    expect(service.createCapsule).not.toHaveBeenCalled();
  });
});
