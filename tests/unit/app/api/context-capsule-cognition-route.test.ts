import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';

const service = vi.hoisted(() => ({ getCognitiveCapsuleInventory: vi.fn(), proposeCognitiveKnowledge: vi.fn(), decideCognitiveKnowledge: vi.fn() }));
const history = vi.hoisted(() => ({ getCapsule: vi.fn(), getDb: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/cognitive-capsule/service', async (importOriginal) => ({ ...await importOriginal<Record<string, unknown>>(), ...service }));
vi.mock('@/lib/context/capsule-service', async (importOriginal) => ({ ...await importOriginal<Record<string, unknown>>(), getCapsule: history.getCapsule }));
vi.mock('@/lib/firebase/admin', async (importOriginal) => ({ ...await importOriginal<Record<string, unknown>>(), getAdminDbOrThrow: history.getDb }));
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
    expect(service.proposeCognitiveKnowledge).toHaveBeenCalledWith('owner', 'owned', expect.objectContaining(proposal));
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
  it('requires an exact capsule version for approval selections and keeps rejection scoped to the remaining proposal', async () => {
    const route = await import('@/app/api/context/capsules/[capsuleId]/cognition/route');
    const patch = (body: unknown) => (route.PATCH as unknown as Handler)(new Request('http://localhost/cognition', { method: 'PATCH', body: JSON.stringify(body) }), user, context);
    const body = { decision: 'accept', reviewCardId: 'proposal', reason: 'Reviewed one chosen item.', selectedRecordIds: ['native'], selectProfile: false };
    expect((await patch(body)).status).toBe(400);
    expect((await patch({ ...body, decision: 'reject', expectedCapsuleVersion: 2 })).status).toBe(400);
    expect(service.decideCognitiveKnowledge).not.toHaveBeenCalled();
    service.decideCognitiveKnowledge.mockResolvedValue({ capsule: { version: 3 }, card: { state: 'owner_review' } });
    expect((await patch({ ...body, expectedCapsuleVersion: 2 })).status).toBe(200);
    expect(service.decideCognitiveKnowledge).toHaveBeenCalledWith('owner', 'owned', expect.objectContaining({ ...body, expectedCapsuleVersion: 2 }));
  });
  it('rejects editing one record while approving other records or a profile', async () => {
    const route = await import('@/app/api/context/capsules/[capsuleId]/cognition/route');
    const edited = { id: 'one', kind: 'distinction', label: 'Stages', scope: ['budget'], conceptA: 'approval', conceptB: 'payment', explanation: 'Different stages.', whyItMatters: 'Avoid inferring payment.', commonMistake: 'Conflating stages.', provenance: { generatedBy: { type: 'human', id: 'owner', at: '2026-10-03T00:00:00Z' }, sourceRefs: [] } };
    const body = { decision: 'edit_accept', reviewCardId: 'proposal', reason: 'Only edit this record.', expectedCapsuleVersion: 2, edited };
    for (const scope of [{ selectedRecordIds: ['one', 'two'], selectProfile: false }, { selectedRecordIds: ['one'], selectProfile: true }]) {
      const result = await (route.PATCH as unknown as Handler)(new Request('http://localhost/cognition', { method: 'PATCH', body: JSON.stringify({ ...body, ...scope }) }), user, context);
      expect(result.status).toBe(400);
    }
    expect(service.decideCognitiveKnowledge).not.toHaveBeenCalled();
  });
  it('exports a real native capsule only when the owner permits downloads', async () => {
    const route = await import('@/app/api/context/capsules/[capsuleId]/cognition/route');
    service.getCognitiveCapsuleInventory.mockResolvedValue({ capsuleId: 'owned', cognition: createCognitiveCapsule('owned'), allowDownload: true });
    const response = await (route.GET as unknown as Handler)(new Request('http://localhost/cognition?format=package'), user, context);
    expect(response.headers.get('content-type')).toBe('application/vnd.tacitus.cognitive-capsule+zip');
    expect(response.headers.get('content-disposition')).toContain('owned.capsule');
    expect(new Uint8Array(await response.arrayBuffer()).slice(0, 2)).toEqual(new Uint8Array([80, 75]));
    service.getCognitiveCapsuleInventory.mockResolvedValue({ capsuleId: 'owned', cognition: createCognitiveCapsule('owned'), allowDownload: false });
    expect((await (route.GET as unknown as Handler)(new Request('http://localhost/cognition?format=package'), user, context)).status).toBe(403);
    expect((await (route.GET as unknown as Handler)(new Request('http://localhost/cognition?format=jsonld'), user, context)).status).toBe(403);
  });
  it('shows the review title for each saved partial approval version in capsule history', async () => {
    history.getCapsule.mockResolvedValue({ capsuleId: 'owned', version: 3 });
    const rows: Record<string, Record<string, unknown>[]> = { versions: [{ version: 3 }, { version: 2 }, { version: 1 }], reviewCards: [{ title: 'Review composed graph and expertise', applyMetadata: { targetVersion: 3 }, cognitiveDecisionHistory: [{ metadata: { targetVersion: 2 } }, { metadata: { targetVersion: 3 } }] }] };
    function collection(name: string): unknown { return { doc: () => ({ collection }), orderBy: () => collection(name), limit: () => collection(name), get: async () => ({ docs: (rows[name] ?? []).map((value) => ({ data: () => value })) }) }; }
    history.getDb.mockReturnValue({ collection });
    const route = await import('@/app/api/context/capsules/[capsuleId]/history/route');
    const result = await (route.GET as unknown as Handler)(new Request('http://localhost/history'), user, context);
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ versions: [{ version: 3, appliedReviewCardTitle: 'Review composed graph and expertise' }, { version: 2, appliedReviewCardTitle: 'Review composed graph and expertise' }, { version: 1, appliedReviewCardTitle: null }] });
  });
});
