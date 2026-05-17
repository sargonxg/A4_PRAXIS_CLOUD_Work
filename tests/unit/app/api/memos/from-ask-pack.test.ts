import { beforeEach, describe, expect, it, vi } from 'vitest';

const saveMemoDraft = vi.fn();

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, { uid: 'user-1', isDemo: request.headers.get('x-demo') === '1' }),
}));

vi.mock('@/lib/firebase/memo-service', () => ({
  saveMemoDraft: (uid: string, input: unknown) => saveMemoDraft(uid, input),
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
        threadId: 'thread-1',
        model: 'vertex-test',
        provider: 'google-vertex',
        contextPackageId: 'ctx-1',
        generatedAt: '2026-05-17T12:00:00.000Z',
      },
    },
  };
}

describe('/api/memos/from-ask-pack', () => {
  beforeEach(() => {
    saveMemoDraft.mockReset();
    saveMemoDraft.mockResolvedValue({ memoId: 'memo-1', href: '/app/write?memoId=memo-1' });
  });

  it('returns memo blocks in demo mode without persisting', async () => {
    const res = await POST(request(validPayload(), { 'x-demo': '1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, mode: 'demo-local', memo: null });
    expect(body.blocks.find((block: { id: string }) => block.id === 'pack-sources').items[0]).toContain('Source receipt: receipt-1');
    expect(saveMemoDraft).not.toHaveBeenCalled();
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
    }));
  });

  it('rejects packs without an answer', async () => {
    const payload = validPayload();
    payload.pack.answer = '';

    const res = await POST(request(payload));

    expect(res.status).toBe(400);
    expect(saveMemoDraft).not.toHaveBeenCalled();
  });
});
