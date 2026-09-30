import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordMemoContextSnapshot, type MemoContextInput } from '@/lib/memo/context-snapshot';

const saveMemoDraft = vi.fn();
const saveOutputCapsule = vi.fn();
const getCapsuleAtVersion = vi.fn();

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, { uid: 'user-1', isDemo: request.headers.get('x-demo') === '1' }),
}));

vi.mock('@/lib/firebase/memo-service', () => ({
  saveMemoDraft: (uid: string, input: unknown) => saveMemoDraft(uid, input),
}));

vi.mock('@/lib/output-capsules/storage', () => ({
  saveOutputCapsule: (uid: string, input: unknown) => saveOutputCapsule(uid, input),
}));

vi.mock('@/lib/context/capsule-version-resolution', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/context/capsule-version-resolution')>(),
  getCapsuleAtVersion: (uid: string, id: string, version: number) => getCapsuleAtVersion(uid, id, version),
}));

const { POST } = await import('@/app/api/memos/from-ask-pack/route');

function request(payload: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/memos/from-ask-pack', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
}

function validPayload() {
  return {
    situationId: 'sit-1',
    askTurnId: 'turn-1',
    pack: {
      title: 'Ask pack',
      prompt: 'What matters?',
      answer: 'Access restrictions matter.',
      sourceCards: [
        {
          id: 'doc-1:chunk-1',
          title: 'Uploaded document doc-1',
          label: 'Uploaded Document',
          sourceType: 'uploaded-document',
          quotePreview: 'Access restrictions affected the crossing.',
          documentId: 'doc-1',
          chunkId: 'chunk-1',
          sourceReceiptId: 'receipt-1',
          sourceReceiptHref: '/app/library?receiptId=receipt-1',
          locatorLabel: '[D1:p.4] p.4 para-8',
          extractionFallbackLabel: 'Text extraction only',
          pageRef: 'p.4',
          paragraphRef: 'para-8',
          citationLabel: '[D1:p.4]',
          confidence: 0.82,
        },
      ],
      gaps: ['No field confirmation.'],
      provenance: {
        capsuleId: 'cap-1',
        capsuleVersion: 2,
        conversationId: 'thread-1',
        threadId: 'thread-1',
        runId: 'run-1',
        model: 'vertex-test',
        provider: 'google-vertex',
        contextPackageId: 'ctx-1',
        sourceReceiptIds: ['receipt-1'],
        unsupportedClaims: ['No field confirmation.'],
        outputTarget: 'policy-memo',
        generatedAt: '2026-05-17T12:00:00.000Z',
      },
    },
    outputTarget: 'policy-memo',
  };
}

describe('/api/memos/from-ask-pack', () => {
  beforeEach(() => {
    saveMemoDraft.mockReset();
    saveOutputCapsule.mockReset();
    getCapsuleAtVersion.mockReset();
    getCapsuleAtVersion.mockResolvedValue({ ownerUid: 'user-1', capsuleId: 'cap-1', version: 2 });
    saveMemoDraft.mockImplementation(async (_uid: string, input: MemoContextInput) => {
      // Use the real saved-version boundary: a permissive mock hid the orphaned output.
      recordMemoContextSnapshot(input, undefined, false);
      return {
        memo: {
          id: 'memo-1',
          caseId: 'sit-1',
          ownerUid: 'user-1',
          templateId: 'policy-memo',
          title: 'Ask pack',
          status: 'draft',
          currentVersionId: 'v1',
          createdAt: '2026-05-17T12:00:00.000Z',
          updatedAt: '2026-05-17T12:00:00.000Z',
        },
        versions: [],
      };
    });
    saveOutputCapsule.mockResolvedValue({ id: 'out-1' });
  });

  it('returns memo blocks in demo mode without persisting', async () => {
    const res = await POST(request(validPayload(), { 'x-demo': '1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, mode: 'demo-local', memo: null });
    expect(body.blocks.find((block: { id: string }) => block.id === 'pack-sources').items[0]).toContain('Source receipt: receipt-1');
    expect(saveMemoDraft).not.toHaveBeenCalled();
    expect(saveOutputCapsule).not.toHaveBeenCalled();
    expect(getCapsuleAtVersion).not.toHaveBeenCalled();
  });

  it('persists a citation-preserving Memo Studio draft for authenticated users', async () => {
    const res = await POST(request(validPayload()));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, memoId: 'memo-1' });
    expect(saveMemoDraft).toHaveBeenCalledWith('user-1', expect.objectContaining({
      caseId: 'sit-1',
      templateId: 'policy-memo',
      title: 'Ask pack',
      graphSnapshotId: 'sit-1:ask-pack:turn-1',
      status: 'draft',
      capsuleId: 'cap-1',
      capsuleVersion: 2,
      conversationId: 'thread-1',
      runId: 'run-1',
      outputTarget: 'policy-memo',
    }));
    const memoDraftInput = saveMemoDraft.mock.calls[0][1] as { blocks: Array<Record<string, unknown>> };
    for (const block of memoDraftInput.blocks) {
      expect(Object.values(block)).not.toContain(undefined);
    }
    expect(saveOutputCapsule).toHaveBeenCalledWith('user-1', expect.objectContaining({
      contextCapsuleId: 'cap-1',
      templateId: 'principals-decision-memo',
      payload: expect.objectContaining({
        title: 'Ask pack',
        sections: expect.arrayContaining([
          expect.objectContaining({ heading: 'Bottom line' }),
          expect.objectContaining({ heading: 'Artifact metadata' }),
        ]),
      }),
      citations: expect.arrayContaining([
        expect.objectContaining({ sourceReceiptId: 'receipt-1' }),
      ]),
      provenance: expect.objectContaining({
        createdBy: 'ask-praxis',
        traceId: 'thread-1:run-1',
      }),
    }));
    const outputCapsuleInput = saveOutputCapsule.mock.calls[0][1] as { citations: Array<Record<string, unknown>> };
    expect(outputCapsuleInput.citations[0]).not.toHaveProperty('uri');
    expect(body.outputCapsule).toMatchObject({ id: 'out-1' });
    expect(getCapsuleAtVersion).toHaveBeenCalledWith('user-1', 'cap-1', 2);
    expect(getCapsuleAtVersion.mock.invocationCallOrder[0]).toBeLessThan(saveOutputCapsule.mock.invocationCallOrder[0]);
  });

  it.each(['instant-unsaved', 'cap-1'])('detaches synthetic version-zero context %s while retaining its evidence and original receipt', async (capsuleId) => {
    const payload = validPayload();
    payload.pack.provenance.capsuleId = capsuleId;
    payload.pack.provenance.capsuleVersion = 0;

    const res = await POST(request(payload));

    expect(res.status).toBe(200);
    expect(getCapsuleAtVersion).not.toHaveBeenCalled();
    expect(saveOutputCapsule).toHaveBeenCalledWith('user-1', expect.objectContaining({
      contextCapsuleId: null,
      citations: expect.arrayContaining([expect.objectContaining({ sourceReceiptId: 'receipt-1' })]),
      payload: expect.objectContaining({ sections: expect.arrayContaining([
        expect.objectContaining({ heading: 'Artifact metadata', body: expect.stringContaining('unsaved') }),
      ]) }),
    }));
    expect(saveMemoDraft).toHaveBeenCalledWith('user-1', expect.objectContaining({
      capsuleId: null, capsuleVersion: null, sourceReceiptIds: ['receipt-1'],
      sourceReceipts: payload.pack.sourceCards,
      conversationId: 'thread-1', runId: 'run-1', unsupportedClaims: ['No field confirmation.'],
      blocks: expect.arrayContaining([expect.objectContaining({ id: 'pack-provenance',
        metadata: expect.objectContaining({ capsuleId, capsuleVersion: 0 }) })]),
    }));
  });

  it('saves explicitly unbound source evidence without inventing a capsule pin', async () => {
    const payload = validPayload();
    const provenance = payload.pack.provenance as { capsuleId: string | null; capsuleVersion: number | null };
    provenance.capsuleId = null;
    provenance.capsuleVersion = null;

    const res = await POST(request(payload));

    expect(res.status).toBe(200);
    expect(getCapsuleAtVersion).not.toHaveBeenCalled();
    expect(saveOutputCapsule).toHaveBeenCalledWith('user-1', expect.objectContaining({ contextCapsuleId: null }));
    expect(saveMemoDraft).toHaveBeenCalledWith('user-1', expect.objectContaining({
      capsuleId: null, capsuleVersion: null, sourceReceiptIds: ['receipt-1'], sourceReceipts: payload.pack.sourceCards,
    }));
  });

  it.each([
    ['cap-1', null], ['cap-1', -1], ['cap-1', 1.5], ['cap-1', Number.MAX_SAFE_INTEGER + 1],
    ['nested/cap', 2], ['nested/cap', 0], [' cap-1', 2], ['', 2], ['x'.repeat(161), 2],
    ['.', 2], ['..', 2], ['nested\\cap', 0], ['cap\u0000', 0],
  ])('rejects invalid saved association %s v%s before creating output state', async (capsuleId, capsuleVersion) => {
    const payload = validPayload();
    const provenance = payload.pack.provenance as { capsuleId: string | null; capsuleVersion: number | null };
    provenance.capsuleId = capsuleId as string;
    provenance.capsuleVersion = capsuleVersion as number | null;

    const res = await POST(request(payload));

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'capsule_version_unavailable', details: { recoverable: true } });
    expect(saveOutputCapsule).not.toHaveBeenCalled();
    expect(saveMemoDraft).not.toHaveBeenCalled();
    expect(getCapsuleAtVersion).not.toHaveBeenCalled();
  });

  it.each([null, { ownerUid: 'user-1', capsuleId: 'cap-1', version: 3 },
    { ownerUid: 'other', capsuleId: 'cap-1', version: 2 },
    { ownerUid: 'user-1', capsuleId: 'other', version: 2 },
    { ownerUid: 'user-1', capsuleId: 'cap-1', version: 2, archivedAt: '2026-09-30T00:00:00.000Z' }])(
    'rejects unavailable or mismatched pinned context before creating output state: %j', async (capsule) => {
      getCapsuleAtVersion.mockResolvedValue(capsule);

      const res = await POST(request(validPayload()));

      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({ code: 'capsule_version_unavailable', details: { recoverable: true } });
      expect(getCapsuleAtVersion).toHaveBeenCalledWith('user-1', 'cap-1', 2);
      expect(saveOutputCapsule).not.toHaveBeenCalled();
      expect(saveMemoDraft).not.toHaveBeenCalled();
    });

  it('rejects an unreadable exact pin without creating an orphan output or resolving latest', async () => {
    getCapsuleAtVersion.mockRejectedValue(new Error('Synthetic read failure'));

    const res = await POST(request(validPayload()));

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'capsule_version_unavailable', details: { requestedVersion: 2 } });
    expect(saveOutputCapsule).not.toHaveBeenCalled();
    expect(saveMemoDraft).not.toHaveBeenCalled();
  });

  it('rejects packs without an answer', async () => {
    const payload = validPayload();
    payload.pack.answer = '';

    const res = await POST(request(payload));

    expect(res.status).toBe(400);
    expect(saveMemoDraft).not.toHaveBeenCalled();
    expect(saveOutputCapsule).not.toHaveBeenCalled();
  });

  it('rejects a positive version without its capsule identity before creating grounded artifacts', async () => {
    const payload = validPayload();
    (payload.pack.provenance as { capsuleId: string | null }).capsuleId = null;

    const res = await POST(request(payload));

    expect(res.status).toBe(409);
    expect(saveMemoDraft).not.toHaveBeenCalled();
    expect(saveOutputCapsule).not.toHaveBeenCalled();
  });
});
