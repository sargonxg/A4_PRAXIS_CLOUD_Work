import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>) =>
    async (req: Request) => h(req, { uid: 'u1', email: 'e@e', name: 'E', isDemo: false }),
}));

vi.mock('@/lib/ai/providers', () => ({
  getModel: () => ({ /* fake model ref */ }),
}));

vi.mock('ai', async () => {
  return {
    Output: {
      object: (x: unknown) => x,
    },
    generateText: vi.fn(async () => ({
      experimental_output: {
        intent: 'profile.mutation',
        patch: { path: 'perspective.regions', op: 'add', value: 'Sahel' },
        humanSummary: 'Add Sahel to regions of focus',
      },
    })),
  };
});

describe('POST /api/assistant/intent', () => {
  it('returns classified intent + patch', async () => {
    const { POST } = await import('@/app/api/assistant/intent/route');
    const res = await POST(new Request('http://localhost/api/assistant/intent', {
      method: 'POST',
      body: JSON.stringify({ text: 'add Sahel to my regions' }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.intent).toBe('profile.mutation');
    expect(json.patch.op).toBe('add');
    expect(json.patch.path).toBe('perspective.regions');
  });

  it('400s on empty body', async () => {
    const { POST } = await import('@/app/api/assistant/intent/route');
    const res = await POST(new Request('http://localhost/api/assistant/intent', {
      method: 'POST',
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });
});
