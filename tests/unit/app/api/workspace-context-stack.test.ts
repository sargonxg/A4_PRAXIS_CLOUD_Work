import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultActiveContextStack, sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

const mocks = vi.hoisted(() => ({ get: vi.fn(), readPointer: vi.fn(), create: vi.fn(), bump: vi.fn(), set: vi.fn(), migrate: vi.fn(), compat: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => {
    const ref = { collection: () => ref, doc: () => ref, set: mocks.set, get: mocks.readPointer };
    return ref;
  },
}));
vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: mocks.get, createCapsule: mocks.create, bumpCapsuleVersion: mocks.bump,
  getOrMigrateDefaultCapsule: mocks.migrate, saveContextStackCompat: mocks.compat, stackToCoreRefs: vi.fn(),
  capsuleToStack: (capsule: { capsuleId: string; coreRefs: { documentCoreIds: string[]; sourceCoreIds: string[]; situationCoreId: string } }) => sanitizeActiveContextStack({
    stackId: capsule.capsuleId, capsuleId: capsule.capsuleId,
    documentIds: capsule.coreRefs.documentCoreIds, sourceIds: capsule.coreRefs.sourceCoreIds,
    situationId: capsule.coreRefs.situationCoreId,
  }),
}));
import { GET, PUT } from '@/app/api/workspace/context-stack/route';
// withAuth is mocked above so these tests exercise the owner-scoped handler.
const invokePut = PUT as unknown as (request: Request, user: { uid: string }) => Promise<Response>;
const invokeGet = GET as unknown as (request: Request, user: { uid: string }) => Promise<Response>;
const defaultCapsule = { capsuleId: 'default', version: 4, coreRefs: { documentCoreIds: ['legacy-document'], sourceCoreIds: ['legacy-source'], situationCoreId: 'legacy-case' } };

describe('attaching saved capsule context', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.readPointer.mockResolvedValue({ exists: false });
    mocks.migrate.mockResolvedValue({ capsule: defaultCapsule, migrated: true, persisted: true });
  });

  it('respects a previously persisted explicit clear instead of reattaching the default capsule', async () => {
    mocks.readPointer.mockResolvedValue({ exists: true, data: () => defaultActiveContextStack() });
    const response = await invokeGet(new Request('http://localhost/api/workspace/context-stack'), { uid: 'owner' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      stack: { stackId: 'default', capsuleId: null, capsuleRefs: [], documentIds: [], situationId: null },
      capsule: null, migrated: false, persisted: true,
    });
    expect(mocks.migrate).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('persists Clear as an empty pointer that survives reload without modifying any canonical capsule', async () => {
    let pointer: unknown = { stackId: 'saved', capsuleId: 'saved', capsuleRefs: [{ capsuleId: 'saved', role: 'primary' }] };
    mocks.readPointer.mockImplementation(async () => ({ exists: true, data: () => pointer }));
    mocks.set.mockImplementation(async (next) => { pointer = next; });
    mocks.compat.mockImplementation(async (_uid, patch) => {
      pointer = patch;
      return { stack: patch, capsule: defaultCapsule, persisted: true };
    });
    const cleared = defaultActiveContextStack();
    const put = await invokePut(new Request('http://localhost/api/workspace/context-stack', {
      method: 'PUT', body: JSON.stringify(cleared),
    }), { uid: 'owner' });
    expect(put.status).toBe(200);
    expect(await put.json()).toMatchObject({ stack: { capsuleId: null, capsuleRefs: [] }, capsule: null, persisted: true });
    const reloaded = await invokeGet(new Request('http://localhost/api/workspace/context-stack'), { uid: 'owner' });
    expect(await reloaded.json()).toMatchObject({ stack: { capsuleId: null, capsuleRefs: [], documentIds: [] }, capsule: null, persisted: true });
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ stackId: 'default', capsuleId: null, capsuleRefs: [] }), { merge: true });
    expect(mocks.compat).not.toHaveBeenCalled();
    expect(mocks.migrate).not.toHaveBeenCalled();
    expect(mocks.bump).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    { stackId: 'default', situationId: 'legacy-case', documentIds: ['legacy-document'] },
    { stackId: 'default', capsuleId: null, capsuleRefs: [], sourceIds: ['legacy-source'] },
    { stackId: 'default', capsuleId: null, capsuleRefs: [], contextBlocks: { sources: [{ id: 'legacy-document', role: 'document' }] } },
  ])('keeps a legacy nonempty default stack on its migration path: %j', async (legacy) => {
    mocks.readPointer.mockResolvedValue({ exists: true, data: () => legacy });
    const response = await invokeGet(new Request('http://localhost/api/workspace/context-stack'), { uid: 'owner' });
    expect(await response.json()).toMatchObject({
      stack: { capsuleId: 'default', documentIds: ['legacy-document'] }, capsule: { capsuleId: 'default' }, migrated: true,
    });
    expect(mocks.migrate).toHaveBeenCalledWith('owner');
  });

  it('retains legacy default context edits rather than treating missing pointer fields as Clear', async () => {
    const patch = { stackId: 'default', documentIds: ['new-document'] };
    mocks.compat.mockResolvedValue({ stack: sanitizeActiveContextStack(patch), capsule: defaultCapsule, persisted: true });
    const response = await invokePut(new Request('http://localhost/api/workspace/context-stack', {
      method: 'PUT', body: JSON.stringify(patch),
    }), { uid: 'owner' });
    expect(response.status).toBe(200);
    expect(mocks.compat).toHaveBeenCalledWith('owner', patch);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it('loads an explicitly requested named capsule even when active context is cleared', async () => {
    mocks.readPointer.mockResolvedValue({ exists: true, data: () => defaultActiveContextStack() });
    mocks.get.mockResolvedValue({ ...defaultCapsule, capsuleId: 'saved' });
    const response = await invokeGet(new Request('http://localhost/api/workspace/context-stack?stackId=saved'), { uid: 'owner' });
    expect(await response.json()).toMatchObject({ stack: { capsuleId: 'saved', documentIds: ['legacy-document'] }, capsule: { capsuleId: 'saved' } });
    expect(mocks.get).toHaveBeenCalledWith('owner', 'saved');
    expect(mocks.readPointer).not.toHaveBeenCalled();
    expect(mocks.migrate).not.toHaveBeenCalled();
  });

  it('still restores a named active pointer and its workspace overrides', async () => {
    mocks.readPointer.mockResolvedValue({ exists: true, data: () => ({ stackId: 'saved', capsuleId: 'saved', outputGoal: 'memo', documentIds: ['legacy-document'] }) });
    mocks.get.mockResolvedValue({ ...defaultCapsule, capsuleId: 'saved' });
    const response = await invokeGet(new Request('http://localhost/api/workspace/context-stack'), { uid: 'owner' });
    expect(await response.json()).toMatchObject({ stack: { capsuleId: 'saved', documentIds: ['legacy-document'], outputGoal: 'memo' }, migrated: false, persisted: true });
    expect(mocks.get).toHaveBeenCalledWith('owner', 'saved');
    expect(mocks.migrate).not.toHaveBeenCalled();
  });

  it('changes the workspace pointer without erasing saved evidence or bumping the capsule version', async () => {
    const capsule = { capsuleId: 'saved', version: 8, coreRefs: { documentCoreIds: ['document-1'], sourceCoreIds: ['receipt-1'], situationCoreId: 'case-1' } };
    mocks.get.mockResolvedValue(capsule);
    const response = await invokePut(new Request('http://localhost/api/workspace/context-stack', {
      method: 'PUT', body: JSON.stringify({ stackId: 'saved', capsuleId: 'saved', capsuleRefs: [{ capsuleId: 'saved', role: 'primary' }] }),
    }), { uid: 'owner' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.capsule.version).toBe(8);
    expect(body.stack).toMatchObject({ documentIds: ['document-1'], sourceIds: ['receipt-1'], situationId: 'case-1' });
    expect(mocks.get).toHaveBeenCalledWith('owner', 'saved');
    expect(mocks.bump).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ documentIds: ['document-1'] }), { merge: true });
  });

  it('does not reactivate an archived capsule', async () => {
    mocks.get.mockResolvedValue({ capsuleId: 'saved', archivedAt: '2026-09-29' });
    const response = await invokePut(new Request('http://localhost/api/workspace/context-stack', {
      method: 'PUT', body: JSON.stringify({ stackId: 'saved' }),
    }), { uid: 'owner' });
    expect(response.status).toBe(409);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it('preserves previous workspace overrides when a subsequent patch updates only capsule refs', async () => {
    mocks.get.mockResolvedValue({ capsuleId: 'saved', version: 8, coreRefs: { documentCoreIds: ['document-1'], sourceCoreIds: ['receipt-1'], situationCoreId: 'case-1' } });
    mocks.readPointer.mockResolvedValue({ exists: true, data: () => ({ stackId: 'saved', capsuleId: 'saved', userModelId: 'my-model', outputGoal: 'brief', documentIds: ['document-1'], sourceIds: ['receipt-1'] }) });
    const response = await invokePut(new Request('http://localhost/api/workspace/context-stack', {
      method: 'PUT', body: JSON.stringify({ stackId: 'saved', capsuleRefs: [{ capsuleId: 'saved', role: 'primary' }] }),
    }), { uid: 'owner' });
    expect((await response.json()).stack).toMatchObject({ userModelId: 'my-model', outputGoal: 'brief', documentIds: ['document-1'] });
    expect(mocks.bump).not.toHaveBeenCalled();
  });
});
