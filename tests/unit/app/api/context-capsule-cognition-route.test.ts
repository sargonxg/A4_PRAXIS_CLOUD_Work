import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ getCognitiveCapsuleInventory: vi.fn(), proposeCognitiveKnowledge: vi.fn(), decideCognitiveKnowledge: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/cognitive-capsule/service', () => service);
type Handler = (request: Request, user: { uid: string; isDemo: boolean }, context: { params: Promise<{ capsuleId: string }> }) => Promise<Response>;
const context = { params: Promise.resolve({ capsuleId: 'owned' }) };
const user = { uid: 'owner', isDemo: false };
const proposal = { kind: 'distinction', label: 'Authorization is not expenditure', scope: ['budget analysis'], body: 'Check payment records before claiming expenditure.', terms: ['authorization', 'expenditure'] };

describe('authenticated cognition route', () => {
  beforeEach(() => vi.clearAllMocks());
  async function post(body: unknown, actor = user) {
    const route = await import('@/app/api/context/capsules/[capsuleId]/cognition/route');
    return (route.POST as unknown as Handler)(new Request('http://localhost/cognition', { method: 'POST', body: JSON.stringify(body) }), actor, context);
  }
  it('creates an owner-scoped proposal without accepting caller review metadata', async () => {
    service.proposeCognitiveKnowledge.mockResolvedValue({ card: { state: 'proposed' } });
    expect((await post(proposal)).status).toBe(201);
    expect(service.proposeCognitiveKnowledge).toHaveBeenCalledWith('owner', 'owned', proposal);
    expect((await post({ ...proposal, reviewState: 'accepted', reviewedBy: 'forged' })).status).toBe(400);
    expect(service.proposeCognitiveKnowledge).toHaveBeenCalledTimes(1);
  });
  it('rejects sample writes and unbounded input', async () => {
    expect((await post(proposal, { ...user, isDemo: true })).status).toBe(403);
    expect((await post({ ...proposal, label: 'x'.repeat(300) })).status).toBe(400);
    expect(service.proposeCognitiveKnowledge).not.toHaveBeenCalled();
  });
  it('returns missing private capsules as 404', async () => {
    service.getCognitiveCapsuleInventory.mockResolvedValue(null);
    const route = await import('@/app/api/context/capsules/[capsuleId]/cognition/route');
    const response = await (route.GET as unknown as Handler)(new Request('http://localhost/cognition'), user, context);
    expect(response.status).toBe(404);
    expect(service.getCognitiveCapsuleInventory).toHaveBeenCalledWith('owner', 'owned');
  });
  it('returns a rebuildable conflict for stale decisions', async () => {
    service.decideCognitiveKnowledge.mockRejectedValue(Object.assign(new Error('Capsule changed. Rebuild proposal.'), { status: 409 }));
    const route = await import('@/app/api/context/capsules/[capsuleId]/cognition/route');
    const response = await (route.PATCH as unknown as Handler)(new Request('http://localhost/cognition', { method: 'PATCH', body: JSON.stringify({ decision: 'accept', reviewCardId: 'proposal', reason: 'Checked scope and source.' }) }), user, context);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'STALE_CAPSULE_PROPOSAL' });
  });
});
