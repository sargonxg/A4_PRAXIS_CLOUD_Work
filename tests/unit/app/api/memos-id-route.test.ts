import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadMemoById = vi.fn();

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }, context: { params: Promise<{ id: string }> }) => Promise<Response>) => (
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) => handler(request, { uid: 'user-1', isDemo: request.headers.get('x-demo') === '1' }, context),
}));

vi.mock('@/lib/firebase/memo-service', () => ({
  loadMemoById: (uid: string, memoId: string) => loadMemoById(uid, memoId),
}));

const { GET } = await import('@/app/api/memos/[id]/route');

function request(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/memos/memo-1', {
    method: 'GET',
    headers,
  });
}

function context(id = 'memo-1') {
  return { params: Promise.resolve({ id }) };
}

describe('/api/memos/[id]', () => {
  beforeEach(() => {
    loadMemoById.mockReset();
  });

  it('loads a memo draft by direct id for the popup editor', async () => {
    loadMemoById.mockResolvedValue({
      memo: {
        id: 'memo-1',
        title: 'Boardroom pack - conflict in Sudan',
        caseId: 'default',
        status: 'draft',
        capsuleId: 'default',
        conversationId: 'thread-1',
        sourceReceiptIds: ['receipt-1'],
      },
      versions: [
        {
          id: 'v1',
          blocks: [{ id: 'b1', type: 'paragraph', content: 'Draft body', citations: [], metadata: {} }],
        },
      ],
    });

    const res = await GET(request(), context());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(loadMemoById).toHaveBeenCalledWith('user-1', 'memo-1');
    expect(body).toMatchObject({
      success: true,
      memo: {
        id: 'memo-1',
        title: 'Boardroom pack - conflict in Sudan',
        conversationId: 'thread-1',
        sourceReceiptIds: ['receipt-1'],
      },
    });
  });

  it('returns 404 when the memo id is not found', async () => {
    loadMemoById.mockResolvedValue(null);

    const res = await GET(request(), context('missing-memo'));

    expect(res.status).toBe(404);
  });
});
