import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getCapsule: vi.fn(),
}));

const packet = vi.hoisted(() => ({
  buildAgentContextPacket: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: unknown) => handler,
}));

vi.mock('@/lib/api/standard-error', () => ({
  handleRouteError: (err: unknown) => Response.json({ error: err instanceof Error ? err.message : 'route failed' }, { status: 500 }),
}));

vi.mock('@/lib/context/capsule-service', () => service);
vi.mock('@/lib/context/agent-context-packet', () => packet);

type MockedAuthRouteHandler = (
  request: Request,
  user: { uid: string; isDemo: boolean },
  context: { params: Promise<{ capsuleId: string }> },
) => Promise<Response>;

describe('GET /api/context/capsules/[capsuleId]/agent-packet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves the owner capsule and returns the serialized packet summary', async () => {
    service.getCapsule.mockResolvedValueOnce({ capsuleId: 'cap-1', version: 3 });
    packet.buildAgentContextPacket.mockReturnValueOnce({
      packetText: '## PRAXIS Agent Context Graph Packet v1\n\n### 3. Salience Ledger\nselected_counts: nodes=2',
      selected: {
        nodes: [
          { id: 'actor-1', label: 'Actor', reviewState: 'advisory', sourceReceiptIds: ['source-1'] },
          { id: 'gap-1', label: 'Missing interest', reviewState: 'missing', sourceReceiptIds: [] },
        ],
        edges: [
          { id: 'edge-1', label: 'infers', relationshipType: 'supports_claim', confidenceKind: 'INFERRED', reviewState: 'advisory', sourceReceiptIds: ['source-1'] },
        ],
        claims: [
          { id: 'claim-1', text: 'Contested claim', status: 'reviewed', linkedNodeIds: ['actor-1'], linkedEdgeIds: ['edge-1'], sourceReceiptIds: ['source-1'], contradicts: ['source-2'] },
        ],
        sources: [
          { id: 'source-1', title: 'Old source', stale: true },
          { id: 'source-2', title: 'Counter source', stale: false },
        ],
        paths: [],
        timeline: [],
        causalLinks: [],
      },
      omitted: [{ id: 'edge-9', kind: 'edge', reason: 'budget', detail: 'Exceeded standard edge limit 30.' }],
      groundingMap: {
        nodes: { 'N-1': 'actor-1' },
        edges: { 'E-1': 'edge-1' },
        claims: { 'CL-1': 'claim-1' },
        sources: { 'SR-1': 'source-1', 'SR-2': 'source-2' },
        paths: {},
      },
    });
    const { GET } = await import('@/app/api/context/capsules/[capsuleId]/agent-packet/route');
    const get = GET as unknown as MockedAuthRouteHandler;

    const response = await get(
      new Request('http://localhost/api/context/capsules/cap-1/agent-packet?q=risk&tier=expanded'),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(service.getCapsule).toHaveBeenCalledWith('u1', 'cap-1');
    expect(packet.buildAgentContextPacket).toHaveBeenCalledWith(expect.objectContaining({
      capsule: { capsuleId: 'cap-1', version: 3 },
      userQuery: 'risk',
      budgetTier: 'expanded',
      requestTime: expect.any(String),
      turnId: null,
    }));
    expect(payload.selectedCounts).toEqual({ nodes: 2, edges: 1, claims: 1, sources: 2, paths: 0, timeline: 0, causalLinks: 0 });
    expect(payload.omitted).toHaveLength(1);
    expect(payload.groundingMap.claims[0]).toMatchObject({
      id: 'CL-1',
      originalId: 'claim-1',
      text: 'Contested claim',
      nodes: [{ id: 'N-1', originalId: 'actor-1', label: 'Actor' }],
      edges: [{ id: 'E-1', originalId: 'edge-1', label: 'supports_claim' }],
      sources: [{ id: 'SR-1', originalId: 'source-1', title: 'Old source' }],
      contradicts: [{ id: 'SR-2', originalId: 'source-2', title: 'Counter source' }],
    });
    expect(payload.riskFlags.map((flag: { kind: string }) => flag.kind)).toEqual([
      'stale_source',
      'advisory_row',
      'inferred_edge',
      'conflict',
      'missing_primitive',
    ]);
  });

  it('defaults to the standard tier and returns an empty-graph packet', async () => {
    service.getCapsule.mockResolvedValueOnce({ capsuleId: 'cap-empty', version: 1 });
    packet.buildAgentContextPacket.mockReturnValueOnce({
      packetText: '## PRAXIS Agent Context Graph Packet v1\n\n### 6. Incident Neighborhoods\nno graph evidence yet',
      selected: { nodes: [], edges: [], claims: [], sources: [], paths: [], timeline: [], causalLinks: [] },
      omitted: [],
      groundingMap: { nodes: {}, edges: {}, claims: {}, sources: {}, paths: {} },
    });
    const { GET } = await import('@/app/api/context/capsules/[capsuleId]/agent-packet/route');
    const get = GET as unknown as MockedAuthRouteHandler;

    const response = await get(
      new Request('http://localhost/api/context/capsules/cap-empty/agent-packet'),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-empty' }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(packet.buildAgentContextPacket).toHaveBeenCalledWith(expect.objectContaining({ budgetTier: 'standard', userQuery: null }));
    expect(payload.selectedCounts).toEqual({ nodes: 0, edges: 0, claims: 0, sources: 0, paths: 0, timeline: 0, causalLinks: 0 });
    expect(payload.riskFlags).toEqual([]);
  });

  it('rejects invalid budget tiers without calling the serializer', async () => {
    const { GET } = await import('@/app/api/context/capsules/[capsuleId]/agent-packet/route');
    const get = GET as unknown as MockedAuthRouteHandler;

    const response = await get(
      new Request('http://localhost/api/context/capsules/cap-1/agent-packet?tier=max'),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );

    expect(response.status).toBe(400);
    expect(packet.buildAgentContextPacket).not.toHaveBeenCalled();
  });

  it('returns not found for demo users or missing capsules', async () => {
    const { GET } = await import('@/app/api/context/capsules/[capsuleId]/agent-packet/route');
    const get = GET as unknown as MockedAuthRouteHandler;

    const demo = await get(
      new Request('http://localhost/api/context/capsules/cap-1/agent-packet'),
      { uid: 'demo', isDemo: true },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );
    expect(demo.status).toBe(404);

    service.getCapsule.mockResolvedValueOnce(null);
    const missing = await get(
      new Request('http://localhost/api/context/capsules/missing/agent-packet'),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'missing' }) },
    );
    expect(missing.status).toBe(404);
  });
});
