import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
  getCapsule: vi.fn(),
  getOrMigrateDefaultCapsule: vi.fn(),
  listCapsules: vi.fn(),
  getAnalystProfile: vi.fn(),
  getSituationAdmin: vi.fn(),
  resolvePath: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: mocks.withAuth,
}));

vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: mocks.getCapsule,
  getOrMigrateDefaultCapsule: mocks.getOrMigrateDefaultCapsule,
  listCapsules: mocks.listCapsules,
}));

vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  getAnalystProfile: mocks.getAnalystProfile,
}));

vi.mock('@/lib/firebase/situations', () => ({
  getSituationAdmin: mocks.getSituationAdmin,
}));

vi.mock('@/lib/path/resolve', () => ({
  resolvePath: mocks.resolvePath,
}));

describe('/api/context/readiness', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.withAuth.mockImplementation((handler) => async (req: Request) => handler(req, {
      uid: 'u1',
      email: 'analyst@example.com',
      name: 'Analyst',
      isDemo: false,
    }));
    mocks.getCapsule.mockResolvedValue(capsule());
    mocks.getOrMigrateDefaultCapsule.mockResolvedValue({ capsule: capsule() });
    mocks.listCapsules.mockResolvedValue([capsule()]);
    mocks.getAnalystProfile.mockResolvedValue({ perspective: { lenses: ['security'] } });
    mocks.getSituationAdmin.mockResolvedValue({
      id: 'sit-1',
      name: 'Nordalia',
      description: 'Security escalation and source posture.',
      actors: ['A', 'B', 'C'],
      region: 'North',
      sourceUrls: ['https://example.com/a'],
      customSources: [],
      graphEntities: 8,
      documentCount: 2,
      latestEventDate: new Date().toISOString(),
      keyDates: [{ date: '2026-05-01', label: 'Ceasefire breach', significance: 'high' }],
      domain: 'armed-conflict-security',
      pathId: 'conflict-path',
    });
    mocks.resolvePath.mockResolvedValue({
      id: 'conflict-path',
      name: 'Conflict & Security',
      lensTop3: ['power', 'security', 'escalation'],
      sourceMix: [{ feed: 'ucdp', weight: 0.5 }],
      contextRecipe: ['user', 'situation', 'path', 'source', 'graph', 'time', 'output'],
    });
  });

  it('returns readiness plus radar axes for a capsule', async () => {
    const { GET } = await import('@/app/api/context/readiness/route');
    const res = await GET(new Request('http://localhost/api/context/readiness?capsuleId=cap-1') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      capsule: { capsuleId: 'cap-1', version: 2 },
      path: { id: 'conflict-path' },
      situation: { id: 'sit-1' },
    });
    expect(body.axes.user).toBeGreaterThan(0);
    expect(body.axes.source).toBeGreaterThan(0);
    expect(body.target.path).toBe(1);
    expect(body.overall).toMatch(/ready|thin|broken/);
  });

  it('returns 404 when the capsule does not exist', async () => {
    mocks.getCapsule.mockResolvedValue(null);

    const { GET } = await import('@/app/api/context/readiness/route');
    const res = await GET(new Request('http://localhost/api/context/readiness?capsuleId=missing') as never);

    expect(res.status).toBe(404);
  });
});

function capsule() {
  return {
    capsuleId: 'cap-1',
    ownerUid: 'u1',
    scope: 'situation',
    parentCapsuleId: null,
    forkedFromVersion: null,
    coreRefs: {
      userCoreId: 'user-core',
      teamCoreId: null,
      situationCoreId: 'sit-1',
      pathCoreId: 'conflict-path',
      sourceCoreIds: ['src-1', 'src-2'],
      documentCoreIds: ['doc-1'],
      graphCoreId: 'graph-1',
      timeCoreId: 'time-1',
      outputCoreIds: ['out-1'],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: null,
    },
    retrievalPolicy: { layers: ['sources'], limit: 12, checkFreshness: true, freshnessWindowDays: 90 },
    health: { score: 88, signals: [], missingCores: [], warnings: [] },
    activeForSituationIds: ['sit-1'],
    lockedCoreKinds: [],
    provenance: { source: 'created', createdBy: 'u1', parentCapsuleId: null, forkedFromVersion: null },
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-13T00:00:00.000Z',
    schemaVersion: 1,
    version: 2,
    label: 'Ready capsule',
  };
}
