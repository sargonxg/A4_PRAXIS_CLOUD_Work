import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({
  CapsuleWriteError: class extends Error {
    constructor(public status: 403 | 409, message: string) { super(message); }
  },
  createCapsule: vi.fn(),
  forkCapsule: vi.fn(),
  getCapsule: vi.fn(),
  listCapsules: vi.fn(),
  publishCapsule: vi.fn(),
  updateDraftCapsule: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }, context?: unknown) => Promise<Response>) => (
    request: Request,
    context?: unknown,
  ) => handler(request, { uid: 'u1', isDemo: false }, context),
}));

vi.mock('@/lib/capsules/storage', () => storage);

describe('/api/capsules routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists and creates capsules through authenticated root routes', async () => {
    storage.listCapsules.mockResolvedValueOnce([{ id: 'cap-1' }]);
    storage.createCapsule.mockResolvedValueOnce({ id: 'cap-new', status: 'draft' });
    const route = await import('@/app/api/capsules/route');

    const listResponse = await route.GET(new Request('https://praxis.tacitus.me/api/capsules?scope=public&limit=12'));
    expect(await listResponse.json()).toEqual({ capsules: [{ id: 'cap-1' }], persisted: true });
    expect(storage.listCapsules).toHaveBeenCalledWith('u1', { scope: 'public', limit: 12 });

    const createResponse = await route.POST(new Request('https://praxis.tacitus.me/api/capsules', {
      method: 'POST',
      body: JSON.stringify({ id: 'cap-new', capsule: { persona: { systemFrame: 'Frame.' } } }),
    }));
    expect(createResponse.status).toBe(201);
    expect(await createResponse.json()).toEqual({ capsule: { id: 'cap-new', status: 'draft' } });
    expect(storage.createCapsule).toHaveBeenCalledWith('u1', {
      id: 'cap-new',
      capsule: { persona: { systemFrame: 'Frame.' } },
    });
  });

  it.each([
    { status: 403 as const, message: 'This capsule identifier is unavailable. Create a new capsule.' },
    { status: 409 as const, message: 'Capsule is published or immutable; fork it before editing.' },
  ])('returns a recoverable $status response for a rejected capsule save', async ({ status, message }) => {
    storage.createCapsule.mockRejectedValueOnce(new storage.CapsuleWriteError(status, message));
    const route = await import('@/app/api/capsules/route');
    const response = await route.POST(new Request('https://praxis.tacitus.me/api/capsules', {
      method: 'POST', body: JSON.stringify({ id: 'existing-capsule' }),
    }));

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: message });
  });

  it('gets and updates draft capsules by id', async () => {
    storage.getCapsule.mockResolvedValueOnce({ id: 'cap-1', status: 'draft' });
    storage.updateDraftCapsule.mockResolvedValueOnce({ id: 'cap-1', status: 'draft', version: '0.2.0' });
    const route = await import('@/app/api/capsules/[capsuleId]/route');
    const context = { params: Promise.resolve({ capsuleId: 'cap-1' }) };

    const getResponse = await route.GET(new Request('https://praxis.tacitus.me/api/capsules/cap-1'), context);
    expect(await getResponse.json()).toEqual({ capsule: { id: 'cap-1', status: 'draft' } });
    expect(storage.getCapsule).toHaveBeenCalledWith('u1', 'cap-1');

    const patchResponse = await route.PATCH(new Request('https://praxis.tacitus.me/api/capsules/cap-1', {
      method: 'PATCH',
      body: JSON.stringify({ capsule: { persona: { systemFrame: 'Updated.' } } }),
    }), context);
    expect(await patchResponse.json()).toEqual({ capsule: { id: 'cap-1', status: 'draft', version: '0.2.0' } });
    expect(storage.updateDraftCapsule).toHaveBeenCalledWith('u1', 'cap-1', {
      capsule: { persona: { systemFrame: 'Updated.' } },
    });
  });

  it('publishes and forks capsules through dedicated actions', async () => {
    storage.publishCapsule.mockResolvedValueOnce({ id: 'cap-1', status: 'published' });
    storage.forkCapsule.mockResolvedValueOnce({ id: 'cap-1-fork', status: 'draft' });
    const publishRoute = await import('@/app/api/capsules/[capsuleId]/publish/route');
    const forkRoute = await import('@/app/api/capsules/[capsuleId]/fork/route');
    const context = { params: Promise.resolve({ capsuleId: 'cap-1' }) };

    const publishResponse = await publishRoute.POST(new Request('https://praxis.tacitus.me/api/capsules/cap-1/publish', {
      method: 'POST',
    }), context);
    expect(publishResponse.status).toBe(200);
    expect(await publishResponse.json()).toEqual({ capsule: { id: 'cap-1', status: 'published' } });
    expect(storage.publishCapsule).toHaveBeenCalledWith('u1', 'cap-1');

    const forkResponse = await forkRoute.POST(new Request('https://praxis.tacitus.me/api/capsules/cap-1/fork', {
      method: 'POST',
    }), context);
    expect(forkResponse.status).toBe(201);
    expect(await forkResponse.json()).toEqual({ capsule: { id: 'cap-1-fork', status: 'draft' } });
    expect(storage.forkCapsule).toHaveBeenCalledWith('u1', 'cap-1');
  });
});
