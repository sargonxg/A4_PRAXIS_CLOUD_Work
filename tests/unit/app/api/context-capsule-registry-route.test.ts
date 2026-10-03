import { beforeEach, describe, expect, it, vi } from 'vitest';

const registry = vi.hoisted(() => ({ list: vi.fn(), publish: vi.fn(), install: vi.fn(), update: vi.fn(), deprecate: vi.fn(), fork: vi.fn(), pull: vi.fn(), impact: vi.fn(), owners: [] as string[] }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/cognitive-capsule/hosted-registry', () => ({
  HostedCapsuleRegistry: class { constructor(uid: string) { registry.owners.push(uid); } list = registry.list; publish = registry.publish; install = registry.install; update = registry.update; deprecate = registry.deprecate; fork = registry.fork; pull = registry.pull; impact = registry.impact; },
  HostedRegistryError: class extends Error { constructor(readonly code: string, message: string, readonly status = 400) { super(message); } },
}));
type Handler = (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>;
const user = { uid: 'owner', isDemo: false };
const publish = { operation: 'publish', capsuleId: 'saved', envelopeVersion: 7, name: 'expert/finance' };

describe('authenticated private registry routes', () => {
  beforeEach(() => { vi.clearAllMocks(); registry.owners.length = 0; });
  async function post(body: unknown, actor = user) {
    const route = await import('@/app/api/context/capsule-registry/route');
    return (route.POST as unknown as Handler)(new Request('http://localhost/registry', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }), actor);
  }
  it('publishes server-derived saved pins only in the authenticated owner scope', async () => {
    registry.publish.mockResolvedValue({ digest: `sha256:${'1'.repeat(64)}` });
    expect((await post(publish)).status).toBe(200);
    expect(registry.owners).toEqual(['owner']);
    expect(registry.publish).toHaveBeenCalledWith(publish);
    expect((await post({ ...publish, artifactBase64: 'forged' })).status).toBe(400);
    expect(registry.publish).toHaveBeenCalledTimes(1);
  });
  it('denies sample reads/writes, malformed bodies and byte-budget overflow before service calls', async () => {
    expect((await post(publish, { ...user, isDemo: true })).status).toBe(403);
    expect((await post('{')).status).toBe(400);
    expect((await post('x'.repeat(16_385))).status).toBe(413);
    const route = await import('@/app/api/context/capsule-registry/route');
    expect((await (route.GET as unknown as Handler)(new Request('http://localhost/registry'), { ...user, isDemo: true })).status).toBe(403);
    expect(registry.owners).toEqual([]);
  });
  it('bounds listing, propagates CAS digest and returns dependency impact completeness', async () => {
    const route = await import('@/app/api/context/capsule-registry/route');
    registry.list.mockResolvedValue({ entries: [], installations: [], scope: 'owner-private' });
    expect((await (route.GET as unknown as Handler)(new Request('http://localhost/registry?limit=101'), user)).status).toBe(400);
    expect((await (route.GET as unknown as Handler)(new Request('http://localhost/registry?limit=10'), user)).status).toBe(200);
    expect(registry.list).toHaveBeenCalledWith({ limit: 10, cursor: undefined });
    const expectedDigest = `sha256:${'2'.repeat(64)}`;
    registry.update.mockResolvedValue({ promotion: 'not-promoted' });
    expect((await post({ operation: 'update', name: 'expert/finance', version: '1.2.0', expectedDigest })).status).toBe(200);
    expect(registry.update).toHaveBeenCalledWith('expert/finance', '1.2.0', expectedDigest);
    registry.impact.mockResolvedValue({ complete: false, activeRunImpact: 'not-indexed' });
    const impact = await import('@/app/api/context/capsule-registry/impact/route');
    const response = await (impact.GET as unknown as Handler)(new Request('http://localhost/impact?name=expert%2Ffinance&version=1.1.0'), user);
    expect(await response.json()).toMatchObject({ complete: false, activeRunImpact: 'not-indexed' });
  });
  it('returns raw immutable bytes with private cache policy and exact digest headers', async () => {
    const digest = `sha256:${'3'.repeat(64)}`; const bytes = new Uint8Array([80, 75, 1, 2]);
    registry.pull.mockResolvedValue({ bytes, entry: { digest } });
    const route = await import('@/app/api/context/capsule-registry/artifact/route');
    const response = await (route.GET as unknown as Handler)(new Request('http://localhost/artifact?name=expert%2Ffinance&version=1.1.0'), user);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-capsule-digest')).toBe(digest);
    expect(response.headers.get('content-digest')).toBe(`sha-256=:${Buffer.from(digest.slice(7), 'hex').toString('base64')}:`);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(registry.pull).toHaveBeenCalledWith('expert/finance', '1.1.0');
  });
});
