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
});
