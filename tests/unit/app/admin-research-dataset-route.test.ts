import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ read: vi.fn(), access: vi.fn(), user: { uid: 'operator', isDemo: false } }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: (r: Request, u: unknown) => Promise<Response>) => (request: Request) => handler(request, mocks.user) }));
vi.mock('@/lib/auth/admin-gate', () => ({ getAdminPrincipalAccess: mocks.access }));
vi.mock('@/lib/data-feeds/cloudflare-research', async (original) => ({ ...await original<typeof import('@/lib/data-feeds/cloudflare-research')>(), readCloudflareResearch: mocks.read }));
import { GET } from '@/app/api/admin/research-dataset/route';
import { ResearchDatasetError } from '@/lib/data-feeds/cloudflare-research';

beforeEach(() => { vi.clearAllMocks(); mocks.user.isDemo = false; mocks.access.mockReturnValue({ admin: false }); });
describe('admin dataset reader', () => {
  it('does not contact private research for ordinary or sample accounts', async () => {
    for (const demo of [false, true]) {
      mocks.user.isDemo = demo;
      const response = await GET(new Request('https://praxis.test/api/admin/research-dataset'));
      expect(response.status).toBe(403);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
    }
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('returns data only for an authorized admin with no shared caching', async () => {
    mocks.access.mockReturnValue({ admin: true }); mocks.read.mockResolvedValue({ status: 'ready' });
    const response = await GET(new Request('https://praxis.test/api/admin/research-dataset?resource=status'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.read.mock.calls[0][0].get('resource')).toBe('status');
  });
  it('distinguishes missing configuration from unexpected failures without leaking diagnostics', async () => {
    mocks.access.mockReturnValue({ admin: true });
    mocks.read.mockRejectedValue(new ResearchDatasetError('RESEARCH_UNCONFIGURED', 503, 'The private research connection is not configured.'));
    const response = await GET(new Request('https://praxis.test/api/admin/research-dataset'));
    expect(await response.json()).toMatchObject({ code: 'RESEARCH_UNCONFIGURED' });
    mocks.read.mockRejectedValue(new Error('private-secret'));
    const failed = await GET(new Request('https://praxis.test/api/admin/research-dataset'));
    expect(failed.status).toBe(503); expect(await failed.text()).not.toContain('private-secret');
  });
});
