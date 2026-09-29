import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchApp: vi.fn(),
  authUser: { uid: 'user-1', isDemo: false },
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, mocks.authUser),
}));

vi.mock('@/lib/app-search/app-search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/app-search/app-search')>();
  return {
    ...actual,
    searchApp: mocks.searchApp,
  };
});

describe('/api/app/search route', () => {
  let GET: typeof import('@/app/api/app/search/route').GET;
  beforeAll(async () => {
    // Load the service graph once in setup, outside each request's timeout.
    ({ GET } = await import('@/app/api/app/search/route'));
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authUser = { uid: 'user-1', isDemo: false };
    mocks.searchApp.mockResolvedValue({
      query: 'capsule',
      groups: { actions: [], capsules: [], memos: [], documents_sources: [], agent_runs: [] },
      diagnostics: { degradedLanes: [] },
    });
  });

  it('passes normalized authenticated search input to the service', async () => {
    const response = await GET(new Request('https://praxis.tacitus.me/api/app/search?q=capsule&types=capsule,memo&limit=100'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.query).toBe('capsule');
    expect(mocks.searchApp).toHaveBeenCalledWith({
      uid: 'user-1',
      isDemo: false,
      query: 'capsule',
      types: ['capsule', 'memo'],
      limit: 25,
    });
  }, 15000);

  it('returns 400 for invalid query length', async () => {
    mocks.searchApp.mockClear();
    const response = await GET(new Request(`https://praxis.tacitus.me/api/app/search?q=${'x'.repeat(201)}`));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid app search');
    expect(mocks.searchApp).not.toHaveBeenCalled();
  }, 15000);

  it('marks demo users so the service can restrict private lanes', async () => {
    mocks.authUser = { uid: 'demo-user-001', isDemo: true };
    await GET(new Request('https://praxis.tacitus.me/api/app/search?q=brief'));

    expect(mocks.searchApp).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'demo-user-001',
      isDemo: true,
    }));
  });
});
