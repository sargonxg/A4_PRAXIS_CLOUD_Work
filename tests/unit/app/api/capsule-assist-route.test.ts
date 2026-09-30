import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { uid: 'owner', email: 'owner@example.test', name: 'Owner', isDemo: false },
  ownerGet: vi.fn(), collection: vi.fn(), doc: vi.fn(), create: vi.fn(), save: vi.fn(),
  credits: vi.fn(), model: vi.fn(),
}));
vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: typeof mocks.user) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.user),
}));
vi.mock('@/lib/api/save-tool-output', () => ({ saveToolOutput: mocks.save }));
vi.mock('@/lib/context/capsule-service', () => ({ createCapsuleArchitectReviewCards: mocks.create }));
vi.mock('@/lib/api/with-credits', () => ({ checkAndDeductCreditsForUid: mocks.credits }));
vi.mock('@/lib/ai/providers', () => ({ getModel: mocks.model }));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => ({ collection: mocks.collection }),
}));

import { POST } from '@/app/api/capsules/assist/[action]/route';
import { DocumentOwnerUnavailableError } from '@/lib/documents/owner-write';
import { buildCapsuleArchitectProposal } from '@/lib/context/capsule-architect';

const input = {
  job: 'Review supplied notes.', situationId: 'case-1',
  documents: [{ documentId: 'document-A', title: 'Synthetic notes', text: 'Actor: Example Council.' }],
};
const activeOwner = { credits: 0, totalCreditsUsed: 100, accountDeletionStatus: null };
const proposed = {
  capsule: { capsuleId: 'cap-1', version: 1 }, cards: [{ reviewCardId: 'review-A', state: 'proposed' }],
  proposal: { ontologyBinding: {}, temporality: {}, causality: {}, embeddedGraph: {} }, reviewRequired: true,
};
const post = (action: string, body: unknown = input, headers?: Record<string, string>) => POST(new Request(
  `https://praxis.test/api/capsules/assist/${action}`,
  { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) },
));

describe('deterministic capsule preparation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.isDemo = false;
    mocks.collection.mockReturnValue({ doc: mocks.doc });
    mocks.doc.mockReturnValue({ get: mocks.ownerGet });
    mocks.ownerGet.mockResolvedValue({ exists: true, data: () => activeOwner });
    mocks.create.mockResolvedValue(proposed);
    mocks.save.mockResolvedValue(undefined);
  });

  it('builds owner-scoped, review-required proposals even when AI credits are exhausted', async () => {
    const response = await post('architect');
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ reviewRequired: true, cards: proposed.cards });
    expect(mocks.collection).toHaveBeenCalledWith('users');
    expect(mocks.doc).toHaveBeenCalledWith('owner');
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create.mock.calls[0][0]).toBe('owner');
    expect(mocks.create.mock.calls[0][1]).toMatchObject({ situationId: 'case-1', documents: input.documents });
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'owner', profileVersion: 0, toolRunId: null,
      output: { summary: expect.any(String), reviewRequired: true, capsuleId: 'cap-1', capsuleVersion: 1,
        reviewCardIds: ['review-A'], counts: { documents: 1, reviewCards: 1 } },
      metadata: { capsuleAssistAction: 'architect', capsuleBuilder: true,
        executionKind: 'deterministic-context-preparation', modelExecution: false },
    }));
    expect(mocks.credits).not.toHaveBeenCalled();
    expect(mocks.model).not.toHaveBeenCalled();
    expect(activeOwner).toEqual({ credits: 0, totalCreditsUsed: 100, accountDeletionStatus: null });
  });

  it('returns real expanded 20-document proposals while storing only a bounded reference receipt', async () => {
    const documents = Array.from({ length: 20 }, (_, index) => ({ documentId: `source-${index}`, title: `Source ${index}`,
      originalUri: `https://example.test/${'a'.repeat(975)}`,
      text: Array.from({ length: 12 }, (_, sentence) => `Evidence sentinel ${index}-${sentence}: ${'政'.repeat(480)}.`).join('\n'),
    }));
    const proposal = buildCapsuleArchitectProposal({ jobPrompt: input.job, situationId: input.situationId,
      documents, normalizedAt: '2026-09-30T12:00:00Z' });
    const cards = proposal.reviewCards.map((card, index) => ({ ...card, reviewCardId: `review-${index}`, state: 'proposed' }));
    mocks.create.mockResolvedValue({ capsule: { capsuleId: 'large-cap', version: 2 }, cards, proposal, reviewRequired: true });
    const response = await post('architect', { ...input, documents });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.proposal).toEqual(JSON.parse(JSON.stringify(proposal)));
    expect(result.cards).toHaveLength(cards.length);
    expect(result.patch.temporality).toEqual(JSON.parse(JSON.stringify(proposal.temporality)));
    const receipt = mocks.save.mock.calls[0][0].output;
    expect(receipt).toMatchObject({ capsuleId: 'large-cap', capsuleVersion: 2, reviewRequired: true,
      reviewCardIds: cards.map((card) => card.reviewCardId), counts: { documents: 20, reviewCards: cards.length } });
    const serialized = JSON.stringify(receipt);
    expect(new TextEncoder().encode(serialized).byteLength).toBeLessThan(1024 * 1024);
    expect(new TextEncoder().encode(JSON.stringify(result)).byteLength).toBeGreaterThan(1024 * 1024);
    expect(serialized).not.toContain('Evidence sentinel');
    expect(serialized).not.toContain(documents[0].originalUri);
    expect(receipt).not.toHaveProperty('proposal');
    expect(receipt).not.toHaveProperty('cards');
    expect(receipt).not.toHaveProperty('patch');
  });

  it.each(['persona', 'output-schema', 'sources', 'few-shot'])('prepares the fixed %s template without AI metering', async (action) => {
    const response = await post(action);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ summary: expect.any(String), patch: expect.any(Object) });
    expect(mocks.ownerGet).toHaveBeenCalledOnce();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'owner', toolId: `capsule-builder-${action}`, requireWritableOwner: true,
    }));
    expect(mocks.credits).not.toHaveBeenCalled();
    expect(mocks.model).not.toHaveBeenCalled();
  });

  it.each(['deleting', 'deleted', 'missing'])('refuses an account that is %s before preparation or persistence', async (state) => {
    mocks.ownerGet.mockResolvedValue({ exists: state !== 'missing', data: () => ({ accountDeletionStatus: state }) });
    const response = await post('architect');
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('fails closed when account state cannot be read', async () => {
    mocks.ownerGet.mockRejectedValue(new Error('read unavailable'));
    const response = await post('architect');
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each(['persona', 'architect'])('surfaces commit-time account disappearance during %s preparation', async (action) => {
    mocks.save.mockRejectedValue(new DocumentOwnerUnavailableError());
    const response = await post(action);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ requireWritableOwner: true }));
  });

  it('rejects demo persistence and unknown actions before any private access', async () => {
    mocks.user.isDemo = true;
    expect((await post('architect')).status).toBe(403);
    mocks.user.isDemo = false;
    expect((await post('unknown')).status).toBe(404);
    expect(mocks.ownerGet).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('rejects invalid schema before account lookup or persistence', async () => {
    expect((await post('architect', { job: '' })).status).toBe(400);
    expect(mocks.ownerGet).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('bounds aggregate text across individually valid documents before private work', async () => {
    const response = await post('architect', { ...input,
      documents: Array.from({ length: 20 }, (_, index) => ({ documentId: `document-${index}`, text: 'x'.repeat(16000) })),
    });
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: 'request_text_too_large' });
    expect(mocks.ownerGet).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('rejects excessive nesting before private work', async () => {
    let nested: Record<string, unknown> = { value: 'leaf' };
    for (let index = 0; index < 40; index++) nested = { next: nested };
    const response = await post('architect', { ...input, capsule: nested });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'request_structure_too_deep' });
    expect(mocks.ownerGet).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('enforces actual streamed bytes even when Content-Length understates the body', async () => {
    const response = await post('architect', { ...input, capsule: { oversized: 'x'.repeat(750001) } }, { 'Content-Length': '1' });
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: 'request_payload_too_large' });
    expect(mocks.ownerGet).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON before private work', async () => {
    const response = await POST(new Request('https://praxis.test/api/capsules/assist/architect', { method: 'POST', body: '{broken' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'malformed_json' });
    expect(mocks.ownerGet).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
