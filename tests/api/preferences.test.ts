import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>) =>
    async (req: Request) => h(req, { uid: 'test-uid', email: 'e@e', name: 'E', isDemo: false }),
}));

vi.mock('@/lib/firebase/preferences-service', () => ({
  getPreferences: vi.fn(async () => ({
    citationStyle: 'apa', defaultReportLength: 'standard', defaultLanguage: 'en',
    confidenceLabelling: 'icd-203', defaultTimeHorizon: '90d', preferredAdvisor: null, updatedAt: null,
  })),
  savePreferences: vi.fn(async (_uid: string, p: Record<string, unknown>) => ({
    citationStyle: 'apa', defaultReportLength: 'standard', defaultLanguage: 'en',
    confidenceLabelling: 'icd-203', defaultTimeHorizon: '90d', preferredAdvisor: null, updatedAt: null,
    ...p,
  })),
}));

const { GET, PATCH } = await import('@/app/api/preferences/route');

describe('/api/preferences', () => {
  it('GET returns prefs', async () => {
    const res = await GET(new Request('http://localhost/api/preferences'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.citationStyle).toBe('apa');
  });

  it('PATCH rejects an invalid citationStyle', async () => {
    const res = await PATCH(new Request('http://localhost/api/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ citationStyle: 'mla' }),
    }));
    expect(res.status).toBe(400);
  });

  it('PATCH saves a valid patch', async () => {
    const res = await PATCH(new Request('http://localhost/api/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ citationStyle: 'inline-links' }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.citationStyle).toBe('inline-links');
  });
});
