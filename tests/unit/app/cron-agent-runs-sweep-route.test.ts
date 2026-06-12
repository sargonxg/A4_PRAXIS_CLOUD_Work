import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sweepRuns: vi.fn(),
  sweepApprovals: vi.fn(),
}));

vi.mock('@/lib/agent-runtime/postgres', () => ({
  sweepExpiredAgentRuns: mocks.sweepRuns,
  sweepExpiredAgentApprovals: mocks.sweepApprovals,
}));

describe('agent runs sweep cron route', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.sweepRuns.mockReset();
    mocks.sweepApprovals.mockReset();
    process.env.CRON_SECRET = 'cron-secret';
  });

  it('rejects requests without the cron secret', async () => {
    const { GET } = await import('@/app/api/cron/agent-runs-sweep/route');

    const response = await GET(new Request('http://localhost/api/cron/agent-runs-sweep'));

    expect(response.status).toBe(401);
    expect(mocks.sweepRuns).not.toHaveBeenCalled();
    expect(mocks.sweepApprovals).not.toHaveBeenCalled();
  });

  it('runs both sweeps when authorized and returns counts', async () => {
    mocks.sweepRuns.mockResolvedValue({ swept: 2, approvalsSwept: 1, remaining: true, errors: 1 });
    mocks.sweepApprovals.mockResolvedValue({ swept: 3, remaining: false, errors: 0 });
    const { GET } = await import('@/app/api/cron/agent-runs-sweep/route');

    const response = await GET(new Request('http://localhost/api/cron/agent-runs-sweep', {
      headers: { 'x-cron-secret': 'cron-secret' },
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.sweepRuns).toHaveBeenCalledTimes(1);
    expect(mocks.sweepApprovals).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({
      runsSwept: 2,
      approvalsSwept: 4,
      remaining: true,
      errors: 1,
    });
  });
});
