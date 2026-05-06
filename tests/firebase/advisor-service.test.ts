import { describe, it, expect, vi, beforeEach } from 'vitest';

const docs = new Map<string, Record<string, unknown>>();

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    doc: (p: string) => ({
      get: async () => ({ exists: docs.has(p), data: () => docs.get(p) }),
      set: async (d: Record<string, unknown>) => { docs.set(p, d); },
    }),
    collection: (p: string) => ({
      get: async () => ({
        docs: [...docs.entries()]
          .filter(([k]) => k.startsWith(`${p}/`))
          .map(([k, v]) => ({ id: k.split('/').pop(), data: () => v })),
      }),
    }),
  },
}));

describe('advisor-service', () => {
  beforeEach(() => {
    docs.clear();
  });

  it('round-trips an advisor via saveAdvisor + getAdvisor', async () => {
    const { getAdvisor, saveAdvisor, bustAdvisorCache } = await import('@/lib/firebase/advisor-service');
    bustAdvisorCache();
    await saveAdvisor({
      id: 'adeyemi',
      name: 'Ngozi Adeyemi',
      title: 'Senior Political Affairs Advisor',
      bio: 'Twenty years field experience political transitions across sub-Saharan Africa.',
      headshotUrl: null,
      persona: 'x'.repeat(120),
      modelTier: 'gemini-3-pro',
      sourceCategories: ['multilateral-political-reports'],
      allowedTools: ['webSearch'],
      greeting: 'hi',
      memoryPolicy: { lastTurns: 8, rollingSummary: true },
      version: 1,
      updatedAt: null,
    });
    bustAdvisorCache();
    const got = await getAdvisor('adeyemi');
    expect(got?.name).toBe('Ngozi Adeyemi');
    expect(got?.version).toBeGreaterThanOrEqual(1);
  });

  it('listAdvisors returns parsed configs', async () => {
    const { listAdvisors, saveAdvisor, bustAdvisorCache } = await import('@/lib/firebase/advisor-service');
    bustAdvisorCache();
    await saveAdvisor({
      id: 'reyes',
      name: 'Reyes',
      title: 'Security Advisor',
      bio: 'Twenty-five years peacekeeping experience across missions.',
      headshotUrl: null,
      persona: 'y'.repeat(120),
      modelTier: 'gemini-3-pro',
      sourceCategories: ['un-mission-reports'],
      allowedTools: ['webSearch'],
      greeting: 'hi',
      memoryPolicy: { lastTurns: 4, rollingSummary: false },
      version: 1,
      updatedAt: null,
    });
    const all = await listAdvisors();
    expect(all.some((a) => a.id === 'reyes')).toBe(true);
  });
});
