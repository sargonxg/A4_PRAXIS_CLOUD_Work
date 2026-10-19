import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultActiveContextStack } from '@/lib/context/active-context-stack';
import { sanitizeCapsule } from '@/lib/context/capsule-service';
import { NativeAttachmentError, parseNativeAttachmentLocks, type NativeAttachmentLock } from '@/lib/tacitus-native/contract';
import { resolveInjectableContext } from '@/lib/context/context-injection';

const state = vi.hoisted(() => ({ data: new Map<string, Record<string, unknown>>(), available: true, writes: 0 }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/firebase/admin', () => {
  const ref = (path: string): { path: string; collection: (name: string) => unknown; doc: (id: string) => unknown; get: () => Promise<unknown>; set: (value: Record<string, unknown>, options?: { merge?: boolean }) => Promise<void> } => ({
    path, collection: (name) => ref(`${path}/${name}`), doc: (id) => ref(`${path}/${id}`),
    get: async () => ({ exists: state.data.has(path), data: () => structuredClone(state.data.get(path)), id: path.split('/').pop() }),
    set: async (value, options) => {
      state.writes++; state.data.set(path, JSON.parse(JSON.stringify({ ...(options?.merge ? state.data.get(path) : {}), ...value })));
    },
  });
  const db = { collection: (name: string) => ref(name), batch: () => {
    const writes: Array<() => Promise<void>> = [];
    return { set: (target: ReturnType<typeof ref>, value: Record<string, unknown>, options?: { merge?: boolean }) => writes.push(() => target.set(value, options)),
      commit: async () => { for (const write of writes) await write(); } };
  } };
  return { getAdminDbOrThrow: () => db };
});
// Only authority is simulated in these persistence tests. The production seam
// refuses native selectors until a separately reviewed server store is bound.
vi.mock('@/lib/tacitus-native/server', () => ({ verifyNativeStackLocks: async (uid: string, value: unknown) => {
  const locks = parseNativeAttachmentLocks(value);
  if (uid !== 'owner' || (!state.available && locks.length)) throw new NativeAttachmentError('native_authority_unavailable', 503);
  return locks;
} }));
import { GET, PUT } from '@/app/api/workspace/context-stack/route';
const get = (stackId?: string) => (GET as unknown as (r: Request, u: { uid: string }) => Promise<Response>)(new Request(`http://localhost/api/workspace/context-stack${stackId ? '?stackId=' + stackId : ''}`), { uid: 'owner' });
const put = (body: unknown) => (PUT as unknown as (r: Request, u: { uid: string }) => Promise<Response>)(new Request('http://localhost/api/workspace/context-stack', { method: 'PUT', body: JSON.stringify(body) }), { uid: 'owner' });
const lock: NativeAttachmentLock = { artifactId: 'native-1', role: 'reference', archiveDigest: '1'.repeat(64), manifestId: 'synthetic', packageVersion: 1,
  manifestProfile: 'context', adapterCapability: 'uploaded-knowledge/1', artifactRevision: 'r1', parentCapsuleId: 'default', parentRevision: 'p1' };

beforeEach(() => {
  state.data.clear(); state.available = true; state.writes = 0;
  for (const id of ['default', 'named']) state.data.set(`users/owner/capsules/${id}`, { ...sanitizeCapsule({ capsuleId: id, ownerUid: 'owner', version: 1 }) });
});
describe('native selections in existing owner-scoped stack persistence', () => {
  it('retains locks through named PUT, active GET and a named reload independently of active selection', async () => {
    const response = await put({ stackId: 'named', capsuleId: 'named', capsuleRefs: [{ capsuleId: 'named', version: 1 }], nativeAttachments: [lock] });
    expect(response.status).toBe(200);
    expect((await (await get()).json()).stack.nativeAttachments).toEqual([lock]);
    await put(defaultActiveContextStack());
    expect((await (await get()).json()).stack.nativeAttachments).toEqual([]);
    expect((await (await get('named')).json()).stack.nativeAttachments).toEqual([lock]);
    expect(state.data.get('users/owner/capsules/named')).not.toHaveProperty('nativeAttachments');
  });
  it('preserves default selection across named switch and restores it after returning to default', async () => {
    expect((await put({ stackId: 'default', capsuleId: 'default', capsuleRefs: [{ capsuleId: 'default', version: 1 }], nativeAttachments: [lock] })).status).toBe(200);
    expect((await put({ stackId: 'named', capsuleId: 'named', capsuleRefs: [{ capsuleId: 'named', version: 1 }] })).status).toBe(200);
    expect(state.data.get('users/owner/contextStacks/default')).toMatchObject({ stackId: 'named', nativeAttachments: [], savedDefaultNativeAttachments: [lock] });
    expect((await put({ stackId: 'default', capsuleId: 'default', capsuleRefs: [{ capsuleId: 'default', version: 1 }] })).status).toBe(200);
    expect((await (await get()).json()).stack.nativeAttachments).toEqual([lock]);
  });
  it('detaches active native context on Clear without reviving it on reload or mutating saved capsules', async () => {
    await put({ stackId: 'default', capsuleId: 'default', capsuleRefs: [{ capsuleId: 'default', version: 1 }], nativeAttachments: [lock] });
    const canonical = structuredClone(state.data.get('users/owner/capsules/default'));
    await put(defaultActiveContextStack());
    expect((await (await get()).json()).stack).toMatchObject({ capsuleId: null, capsuleRefs: [], nativeAttachments: [] });
    expect(state.data.get('users/owner/capsules/default')).toEqual(canonical);
  });
  it.each([
    { stackId: 'default', documentIds: ['new-document'] },
    { stackId: 'named', capsuleId: 'named', capsuleRefs: [{ capsuleId: 'named', version: 1 }] },
  ])('refuses unavailable inherited native authority before stack persistence: %j', async (body) => {
    state.data.set('users/owner/contextStacks/default', { stackId: 'default', capsuleId: 'default', nativeAttachments: [lock], savedDefaultNativeAttachments: [lock] });
    state.data.set('users/owner/contextStacks/named', { nativeAttachments: [lock] });
    state.available = false;
    const response = await put(body);
    expect(response.status).toBe(503); expect(state.writes).toBe(0);
  });
  it.each([
    { activeContextStack: { stackId: 'default', documentIds: ['new-document'] } },
    { capsuleId: 'default' }, {},
  ])('refuses inherited native compilation before writes or provider: %j', async (input) => {
    state.data.set('users/owner/contextStacks/default', { stackId: 'default', capsuleId: 'default', nativeAttachments: [lock], savedDefaultNativeAttachments: [lock] });
    const provider = vi.fn();
    await expect(resolveInjectableContext({ uid: 'owner', ...input }).then(provider)).rejects.toThrow('native_authority_unavailable');
    expect(provider).not.toHaveBeenCalled(); expect(state.writes).toBe(0);
  });
  it('preserves native locks during a legacy default compatibility edit when authority succeeds', async () => {
    state.data.set('users/owner/contextStacks/default', { stackId: 'default', capsuleId: 'default', nativeAttachments: [lock], savedDefaultNativeAttachments: [lock] });
    const result = await put({ stackId: 'default', documentIds: ['new-document'] });
    expect(result.status).toBe(200);
    expect((await result.json()).stack.nativeAttachments).toEqual([lock]);
    expect((await (await get()).json()).stack.nativeAttachments).toEqual([lock]);
  });
  it('rejects malformed native locks without persisting a truncated/defaulted selection', async () => {
    const response = await put({ stackId: 'default', nativeAttachments: [{ ...lock, packageVersion: '1.0.0' }] });
    expect(response.status).toBe(400); expect(state.writes).toBe(0);
  });
});
