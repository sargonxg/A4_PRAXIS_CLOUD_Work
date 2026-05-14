import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
  classifyPathFlow: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: mocks.withAuth,
}));

vi.mock('@/lib/genkit/flows/classify-path', () => ({
  classifyPathFlow: mocks.classifyPathFlow,
}));

describe('/api/paths/classify', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.withAuth.mockImplementation((handler) => async (req: Request) => handler(req, {
      uid: 'u1',
      email: 'analyst@example.com',
      name: 'Analyst',
      isDemo: false,
    }));
    mocks.classifyPathFlow.mockResolvedValue({
      pathId: 'conflict-path',
      confidence: 0.82,
      rationale: 'Escalation and security terms dominate.',
      alternates: [],
    });
  });

  it('returns a path classification', async () => {
    const { POST } = await import('@/app/api/paths/classify/route');
    const res = await POST(new Request('http://localhost/api/paths/classify', {
      method: 'POST',
      body: JSON.stringify({
        domainId: 'armed-conflict-security',
        name: 'Escalation watch',
        seedText: 'Monitor actors, escalation, and near-term security scenarios.',
      }),
    }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ pathId: 'conflict-path', confidence: 0.82 });
    expect(mocks.classifyPathFlow).toHaveBeenCalledWith(expect.objectContaining({
      domainId: 'armed-conflict-security',
      description: expect.stringContaining('Monitor actors'),
    }));
  });

  it('validates request shape', async () => {
    const { POST } = await import('@/app/api/paths/classify/route');
    const res = await POST(new Request('http://localhost/api/paths/classify', {
      method: 'POST',
      body: JSON.stringify({ sourceUrls: Array.from({ length: 20 }, (_, i) => `https://example.com/${i}`) }),
    }));

    expect(res.status).toBe(400);
  });
});
