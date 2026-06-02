import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  applyCapsuleReviewCard: vi.fn(),
  proposeCapsuleGraphEdgeChange: vi.fn(),
  proposeCapsuleGraphNodeChange: vi.fn(),
  rejectCapsuleReviewCard: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: unknown) => handler,
}));

vi.mock('@/lib/api/standard-error', () => ({
  handleRouteError: (err: unknown) => Response.json({ error: err instanceof Error ? err.message : 'route failed' }, { status: 500 }),
}));

vi.mock('@/lib/context/capsule-service', () => service);

type MockedAuthRouteHandler = (
  request: Request,
  user: { uid: string; isDemo: boolean },
  context: { params: Promise<{ capsuleId: string }> },
) => Promise<Response>;

describe('capsule graph proposal routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates node proposal review cards without canonical mutation', async () => {
    service.proposeCapsuleGraphNodeChange.mockResolvedValueOnce({
      capsule: { capsuleId: 'cap-1', version: 1 },
      card: { reviewCardId: 'review-card-node-1', target: 'graphProposal', state: 'proposed' },
    });
    const { POST } = await import('@/app/api/context/capsules/[capsuleId]/graph/nodes/route');
    const post = POST as unknown as MockedAuthRouteHandler;

    const response = await post(
      new Request('http://localhost/api/context/capsules/cap-1/graph/nodes', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'create',
          node: {
            id: 'actor-ministry',
            label: 'Ministry',
            entityType: 'Actor',
            confidence: 0.63,
            sourceReceiptIds: ['source-1'],
          },
        }),
      }),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(service.proposeCapsuleGraphNodeChange).toHaveBeenCalledWith('u1', 'cap-1', expect.objectContaining({
      operation: 'create',
      node: expect.objectContaining({ entityType: 'Actor' }),
    }));
    expect(payload.card).toMatchObject({ reviewCardId: 'review-card-node-1', target: 'graphProposal' });
  });

  it('creates edge proposal review cards without canonical mutation', async () => {
    service.proposeCapsuleGraphEdgeChange.mockResolvedValueOnce({
      capsule: { capsuleId: 'cap-1', version: 1 },
      card: { reviewCardId: 'review-card-edge-1', target: 'graphProposal', state: 'proposed' },
    });
    const { POST } = await import('@/app/api/context/capsules/[capsuleId]/graph/edges/route');
    const post = POST as unknown as MockedAuthRouteHandler;

    const response = await post(
      new Request('http://localhost/api/context/capsules/cap-1/graph/edges', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'create',
          edge: {
            id: 'edge-1',
            source: 'actor-ministry',
            target: 'claim-1',
            relationshipType: 'claims',
            confidence: 0.58,
            sourceReceiptIds: ['source-1'],
          },
        }),
      }),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );

    expect(response.status).toBe(201);
    expect(service.proposeCapsuleGraphEdgeChange).toHaveBeenCalledWith('u1', 'cap-1', expect.objectContaining({
      operation: 'create',
      edge: expect.objectContaining({ relationshipType: 'claims' }),
    }));
  });

  it('reuses applyCapsuleReviewCard for approve actions', async () => {
    service.applyCapsuleReviewCard.mockResolvedValueOnce({
      capsule: { capsuleId: 'cap-1', version: 2 },
      card: { reviewCardId: 'review-card-node-1', state: 'applied' },
    });
    const { POST } = await import('@/app/api/context/capsules/[capsuleId]/graph/nodes/route');
    const post = POST as unknown as MockedAuthRouteHandler;

    const response = await post(
      new Request('http://localhost/api/context/capsules/cap-1/graph/nodes', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'approve',
          reviewCardId: 'review-card-node-1',
          confirmationReason: 'Graph proposal reviewed in Capsule Studio.',
        }),
      }),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(service.applyCapsuleReviewCard).toHaveBeenCalledWith('u1', 'cap-1', 'review-card-node-1', expect.objectContaining({
      reviewerUid: 'u1',
      diffHash: expect.stringMatching(/^diff:graph:/),
      confirmationReason: 'Graph proposal reviewed in Capsule Studio.',
    }));
    expect(payload.capsule).toMatchObject({ version: 2 });
  });

  it('rejects graph proposal review cards without applying graph mutations', async () => {
    service.rejectCapsuleReviewCard.mockResolvedValueOnce({
      capsule: { capsuleId: 'cap-1', version: 1 },
      card: { reviewCardId: 'review-card-node-1', state: 'rejected' },
    });
    const { POST } = await import('@/app/api/context/capsules/[capsuleId]/graph/nodes/route');
    const post = POST as unknown as MockedAuthRouteHandler;

    const response = await post(
      new Request('http://localhost/api/context/capsules/cap-1/graph/nodes', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'reject',
          reviewCardId: 'review-card-node-1',
          confirmationReason: 'Not supported by the source receipt.',
        }),
      }),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(service.rejectCapsuleReviewCard).toHaveBeenCalledWith('u1', 'cap-1', 'review-card-node-1', expect.objectContaining({
      reviewerUid: 'u1',
      confirmationReason: 'Not supported by the source receipt.',
    }));
    expect(service.applyCapsuleReviewCard).not.toHaveBeenCalled();
    expect(payload.card).toMatchObject({ state: 'rejected' });
  });
});
