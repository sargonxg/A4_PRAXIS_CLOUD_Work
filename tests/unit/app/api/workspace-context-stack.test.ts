import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

const mocks = vi.hoisted(() => ({ get: vi.fn(), readPointer: vi.fn(), create: vi.fn(), bump: vi.fn(), set: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => {
    const ref = { collection: () => ref, doc: () => ref, set: mocks.set, get: mocks.readPointer };
    return ref;
  },
}));
vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: mocks.get, createCapsule: mocks.create, bumpCapsuleVersion: mocks.bump,
  getOrMigrateDefaultCapsule: vi.fn(), saveContextStackCompat: vi.fn(), stackToCoreRefs: vi.fn(),
  capsuleToStack: (capsule: { capsuleId: string; coreRefs: { documentCoreIds: string[]; sourceCoreIds: string[]; situationCoreId: string } }) => sanitizeActiveContextStack({
    stackId: capsule.capsuleId, capsuleId: capsule.capsuleId,
    documentIds: capsule.coreRefs.documentCoreIds, sourceIds: capsule.coreRefs.sourceCoreIds,
    situationId: capsule.coreRefs.situationCoreId,
  }),
}));
import { PUT } from '@/app/api/workspace/context-stack/route';

describe('attaching saved capsule context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readPointer.mockResolvedValue({ exists: false });
  });

  it('changes the workspace pointer without erasing saved evidence or bumping the capsule version', async () => {
    const capsule = { capsuleId: 'saved', version: 8, coreRefs: { documentCoreIds: ['document-1'], sourceCoreIds: ['receipt-1'], situationCoreId: 'case-1' } };
    mocks.get.mockResolvedValue(capsule);
    const response = await PUT(new Request('http://localhost/api/workspace/context-stack', {
      method: 'PUT', body: JSON.stringify({ stackId: 'saved', capsuleId: 'saved', capsuleRefs: [{ capsuleId: 'saved', role: 'primary' }] }),
    }), { uid: 'owner' } as never, {} as never);
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
    const response = await PUT(new Request('http://localhost/api/workspace/context-stack', {
      method: 'PUT', body: JSON.stringify({ stackId: 'saved' }),
    }), { uid: 'owner' } as never, {} as never);
    expect(response.status).toBe(409);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it('preserves previous workspace overrides when a subsequent patch updates only capsule refs', async () => {
    mocks.get.mockResolvedValue({ capsuleId: 'saved', version: 8, coreRefs: { documentCoreIds: ['document-1'], sourceCoreIds: ['receipt-1'], situationCoreId: 'case-1' } });
    mocks.readPointer.mockResolvedValue({ exists: true, data: () => ({ stackId: 'saved', capsuleId: 'saved', userModelId: 'my-model', outputGoal: 'brief', documentIds: ['document-1'], sourceIds: ['receipt-1'] }) });
    const response = await PUT(new Request('http://localhost/api/workspace/context-stack', {
      method: 'PUT', body: JSON.stringify({ stackId: 'saved', capsuleRefs: [{ capsuleId: 'saved', role: 'primary' }] }),
    }), { uid: 'owner' } as never, {} as never);
    expect((await response.json()).stack).toMatchObject({ userModelId: 'my-model', outputGoal: 'brief', documentIds: ['document-1'] });
    expect(mocks.bump).not.toHaveBeenCalled();
  });
});
