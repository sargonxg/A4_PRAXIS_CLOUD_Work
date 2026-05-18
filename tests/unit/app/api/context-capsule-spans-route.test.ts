import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCapsule = vi.fn();
const bumpCapsuleVersion = vi.fn();
const setSpan = vi.fn();
let docId = 'span-1';

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }, context: unknown) => Promise<Response>) => (
    request: Request,
    context: unknown,
  ) => handler(request, { uid: 'user-1', isDemo: request.headers.get('x-demo') === '1' }, context),
}));

vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: (uid: string, capsuleId: string) => getCapsule(uid, capsuleId),
  bumpCapsuleVersion: (uid: string, capsuleId: string, patch: unknown) => bumpCapsuleVersion(uid, capsuleId, patch),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({
            collection: () => ({
              doc: () => ({ id: docId, set: setSpan }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

const { POST } = await import('@/app/api/context/capsules/[capsuleId]/spans/route');

function request(payload: unknown) {
  return new Request('http://localhost/api/context/capsules/cap-1/spans', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function context(capsuleId = 'cap-1') {
  return { params: Promise.resolve({ capsuleId }) };
}

describe('/api/context/capsules/[capsuleId]/spans', () => {
  beforeEach(() => {
    docId = 'span-1';
    getCapsule.mockReset();
    bumpCapsuleVersion.mockReset();
    setSpan.mockReset();
    getCapsule.mockResolvedValue({
      capsuleId: 'cap-1',
      version: 7,
      community: { tags: ['existing'] },
    });
    bumpCapsuleVersion.mockResolvedValue({ capsuleId: 'cap-1', version: 8 });
  });

  it('rejects invalid span targets', async () => {
    const res = await POST(request({ text: 'A claim with enough text.', targetCore: 'bad-target' }), context());

    expect(res.status).toBe(400);
    expect(setSpan).not.toHaveBeenCalled();
  });

  it('rejects short selected text', async () => {
    const res = await POST(request({ text: 'no', targetCore: 'sourceability' }), context());

    expect(res.status).toBe(400);
    expect(setSpan).not.toHaveBeenCalled();
  });

  it('creates a span and preserves the existing API contract', async () => {
    const res = await POST(request({
      text: ' This claim needs a support check. ',
      targetCore: 'sourceability',
      sourceType: 'assistant-message',
      messageId: 'assistant-2',
      note: 'Sourceability: mark claim/evidence needing support check.',
    }), context());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(setSpan).toHaveBeenCalledWith(expect.objectContaining({
      id: 'span-1',
      capsuleId: 'cap-1',
      capsuleVersion: 7,
      text: 'This claim needs a support check.',
      targetCore: 'sourceability',
      sourceType: 'assistant-message',
      messageId: 'assistant-2',
      note: 'Sourceability: mark claim/evidence needing support check.',
      createdBy: 'user-1',
    }));
    expect(bumpCapsuleVersion).toHaveBeenCalledWith('user-1', 'cap-1', {
      community: { tags: ['existing', 'span:sourceability'] },
    });
    expect(body.span.targetCore).toBe('sourceability');
  });
});
