import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectFirestore } from '../../../helpers/project-firestore';
import dossier from '../../../fixtures/example-advisory-dossier.json';

const state = vi.hoisted(() => ({ cookie: undefined as string | undefined, db: null as unknown }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => state.cookie ? { value: state.cookie } : undefined }) }));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => state.db, adminDb: new Proxy({}, { get: (_, key) => (state.db as Record<string, unknown>)[String(key)] }),
  verifyIdToken: async (token: string) => {
    if (!['owner', 'outsider'].includes(token)) throw new Error('Invalid token');
    return { uid: token, email: `${token}@example.invalid`, name: 'Synthetic fixture user' };
  },
}));
vi.mock('@/lib/observability/logger', () => ({ logApiCall: vi.fn() }));
import { signCookie } from '@/lib/auth/cookie-signer';
import { GET, POST } from '@/app/api/projects/route';
import { GET as read, PATCH } from '@/app/api/projects/[projectId]/route';

const session = (token: string) => { state.cookie = signCookie(JSON.stringify({ token })); };
const createRequest = (input: unknown) => new Request('http://localhost/api/projects', { method: 'POST', body: JSON.stringify(input) });
describe('project APIs retain existing session enforcement and scoped server storage', () => {
  beforeEach(() => {
    const fixture = projectFirestore(); state.db = fixture.db; state.cookie = undefined;
    fixture.records.set('users/owner', { uid: 'owner' }); fixture.records.set('users/outsider', { uid: 'outsider' });
  });
  it('requires a signed verified session and rejects sample writes before any project creation', async () => {
    expect((await POST(createRequest({ scope: dossier.scope, operationId: 'create-001' }))).status).toBe(401);
    state.cookie = 'invalid.signature';
    expect((await GET(new Request('http://localhost/api/projects'))).status).toBe(401);
    state.cookie = signCookie(JSON.stringify({ demo: true }));
    expect((await POST(createRequest({ scope: dossier.scope, operationId: 'create-001' }))).status).toBe(403);
  });
  it('persists with server-derived identity and gives outsiders identical missing-object responses', async () => {
    session('owner');
    const response = await POST(createRequest({ scope: dossier.scope, operationId: 'create-001' }));
    expect(response.status).toBe(200);
    const { project } = await response.json();
    expect(project.ownerUid).toBe('owner');
    const context = { params: Promise.resolve({ projectId: project.projectId }) };
    expect((await read(new Request('http://localhost/api/projects'), context)).status).toBe(200);
    session('outsider');
    const denied = await read(new Request('http://localhost/api/projects'), context);
    const missing = await read(new Request('http://localhost/api/projects'), { params: Promise.resolve({ projectId: 'missing' }) });
    expect(denied.status).toBe(404); expect(await denied.json()).toEqual(await missing.json());
    expect(await (await GET(new Request('http://localhost/api/projects'))).json()).toEqual({ projects: [] });
    expect((await PATCH(new Request('http://localhost/api/projects', { method: 'PATCH', body: JSON.stringify({ action: 'scope', scope: dossier.scope, expectedRevision: 1, operationId: 'scope-001' }) }), context)).status).toBe(404);
  });
  it('rejects malformed, oversized and privileged payloads with actionable errors', async () => {
    session('owner');
    expect((await POST(createRequest({ scope: dossier.scope, operationId: 'create-001', permissions: ['admin'] }))).status).toBe(400);
    expect((await POST(new Request('http://localhost/api/projects', { method: 'POST', body: 'not-json' }))).status).toBe(400);
    expect((await POST(new Request('http://localhost/api/projects', { method: 'POST', body: 'x'.repeat(30_001) }))).status).toBe(413);
  });
});
