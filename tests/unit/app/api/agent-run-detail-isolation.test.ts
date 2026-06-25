import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAgentRun: vi.fn(),
  listAgentToolCalls: vi.fn(),
  listAgentApprovals: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }, context: { params: Promise<{ runId: string }> }) => Promise<Response>) => (
    request: Request,
    context: { params: Promise<{ runId: string }> },
  ) => handler(request, { uid: 'user-a', isDemo: false }, context),
}));

vi.mock('@/lib/agent-runtime/postgres', () => ({
  getAgentRun: mocks.getAgentRun,
  listAgentToolCalls: mocks.listAgentToolCalls,
  listAgentApprovals: mocks.listAgentApprovals,
}));

describe('/api/agents/runs/[runId] isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not return a run whose stored owner differs from the authenticated user', async () => {
    mocks.getAgentRun.mockResolvedValue({
      id: 'run-b',
      ownerUid: 'user-b',
      capsuleId: 'cap-b',
      status: 'succeeded',
      objective: 'Other user run',
      metadata: {},
      createdAt: '2026-05-24T10:00:00.000Z',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
    const { GET } = await import('@/app/api/agents/runs/[runId]/route');

    const response = await GET(new Request('https://praxis.tacitus.me/api/agents/runs/run-b'), {
      params: Promise.resolve({ runId: 'run-b' }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Agent run not found' });
    expect(mocks.getAgentRun).toHaveBeenCalledWith('user-a', 'run-b');
    expect(mocks.listAgentToolCalls).not.toHaveBeenCalled();
    expect(mocks.listAgentApprovals).not.toHaveBeenCalled();
  });
});
