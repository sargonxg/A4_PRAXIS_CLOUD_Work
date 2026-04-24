import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase/admin', () => {
  const profileData = {
    identity: { org: 'UN', team: 'T', role: 'un_official', seniority: 'senior' },
    perspective: {
      mandate: 'x',
      lenses: ['diplomatic'],
      regions: ['r'],
      audience: 'myself',
      primaryDomain: 'generic',
      secondaryDomains: [],
    },
    workingStyle: { sourceCategories: [], language: 'en', redLines: [], analyticalStyle: 'rapid_brief' },
    meta: { version: 1, completedAt: 'x', lastEditedAt: 'x', skipCount: 0, createdAt: 'x', deletedAt: null },
  };

  const situationDocs = [{ id: 's1', data: () => ({ name: 'Nordalia', type: 'war', region: 'West Africa' }) }];
  const versionDocs = [{ data: () => ({ ...profileData, _snapshotAt: 'ts' }) }];

  return {
    adminDb: {
      doc: () => ({
        get: async () => ({ exists: true, data: () => profileData }),
      }),
      collection: (path: string) => {
        if (path.endsWith('profile_versions')) {
          return {
            orderBy: () => ({ get: async () => ({ docs: versionDocs }) }),
          };
        }
        return { get: async () => ({ docs: situationDocs }) };
      },
    },
  };
});

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>) =>
    async (req: Request) => h(req, { uid: 'u1', email: 'e@e', name: 'E', isDemo: false }),
}));

vi.mock('@/lib/firebase/preferences-service', () => ({
  getPreferences: vi.fn(async () => ({
    citationStyle: 'un-footnote',
    defaultReportLength: 'standard',
    defaultLanguage: 'en',
    confidenceLabelling: 'icd-203',
    defaultTimeHorizon: '90d',
    preferredAdvisor: null,
    updatedAt: null,
  })),
}));

describe('GET /api/profile/export', () => {
  it('returns bundle JSON with profile + preferences + situations + versions', async () => {
    const { GET } = await import('@/app/api/profile/export/route');
    const res = await GET(new Request('http://localhost/api/profile/export'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    const json = await res.json();
    expect(json.profile).toBeDefined();
    expect(json.preferences).toBeDefined();
    expect(json.situations_metadata).toHaveLength(1);
    expect(json.profile_versions).toHaveLength(1);
    expect(json.uid).toBe('u1');
    expect(json.exportedAt).toBeDefined();
  });
});
