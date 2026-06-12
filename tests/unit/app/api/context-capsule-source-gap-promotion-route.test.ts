import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  activateCapsule: vi.fn(),
  approveAdvisoryMemoryCandidate: vi.fn(),
  archiveCapsule: vi.fn(),
  bumpCapsuleVersion: vi.fn(),
  deleteCapsule: vi.fn(),
  exportCapsuleCorePackage: vi.fn(),
  forkCapsule: vi.fn(),
  getCapsule: vi.fn(),
  promoteCapsuleSourceGaps: vi.fn(),
  proposeCogneeSeedReviewCards: vi.fn(),
  rateCapsule: vi.fn(),
  rejectAdvisoryMemoryCandidate: vi.fn(),
  renameCapsule: vi.fn(),
  setCapsuleAccessPolicy: vi.fn(),
  setCapsuleCoreLock: vi.fn(),
  setCapsuleFavorite: vi.fn(),
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: unknown) => handler,
}));

vi.mock('@/lib/api/standard-error', () => ({
  handleRouteError: (err: unknown) => Response.json({ error: err instanceof Error ? err.message : 'route failed' }, { status: 500 }),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: vi.fn(),
}));

vi.mock('@/lib/context/capsule-service', () => service);

vi.mock('@/lib/capsule-plus', () => ({
  buildCapsulePlusExportBundle: vi.fn(),
  buildCapsulePlusManifest: vi.fn(),
  buildPraxisCapsuleFilename: vi.fn(),
}));

vi.mock('@/lib/capsule-plus/postgres', () => ({
  listCapsulePlusGraphRows: vi.fn(),
}));

type MockedAuthRouteHandler = (
  request: Request,
  user: { uid: string; isDemo: boolean },
  context: { params: Promise<{ capsuleId: string }> },
) => Promise<Response>;

describe('capsule Ask source-gap promotion route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('files an Ask gap sourcing proposal through the existing capsule action route', async () => {
    service.promoteCapsuleSourceGaps.mockResolvedValueOnce({
      capsule: { capsuleId: 'cap-1', version: 1 },
      proposals: [{ proposalId: 'ask-gap-1', reviewCardId: 'review-card-ask-gap-1' }],
      reviewCards: [{ reviewCardId: 'review-card-ask-gap-1', state: 'proposed' }],
      reviewRequired: true,
    });
    const { POST } = await import('@/app/api/context/capsules/[capsuleId]/route');
    const post = POST as unknown as MockedAuthRouteHandler;

    const response = await post(
      new Request('http://localhost/api/context/capsules/cap-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'promote-source-gaps',
          kind: 'sourcing',
          title: 'Source gap: monitoring mandate',
          rationale: 'Ask PRAXIS found no current source for the monitoring mandate.',
          suggestedChange: 'Attach a current primary source for the monitoring mandate.',
          origin: {
            type: 'ask_gap',
            threadId: 'ask-thread-1',
            turnId: 'turn-1',
            gapIndex: 0,
            gapHash: 'gap-hash-1',
          },
        }),
      }),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(service.promoteCapsuleSourceGaps).toHaveBeenCalledWith('u1', 'cap-1', expect.objectContaining({
      kind: 'sourcing',
      title: 'Source gap: monitoring mandate',
      source: 'ask-gap-promotion',
      origin: expect.objectContaining({
        type: 'ask_gap',
        threadId: 'ask-thread-1',
        turnId: 'turn-1',
      }),
    }));
    expect(payload.reviewCards).toEqual([expect.objectContaining({ reviewCardId: 'review-card-ask-gap-1' })]);
  });

  it('returns 409 when the active capsule is archived or read-only', async () => {
    const err = new Error('Archived capsules are read-only; restore or fork the capsule before filing source-gap proposals.');
    err.name = 'CapsuleReadOnlyError';
    service.promoteCapsuleSourceGaps.mockRejectedValueOnce(err);
    const { POST } = await import('@/app/api/context/capsules/[capsuleId]/route');
    const post = POST as unknown as MockedAuthRouteHandler;

    const response = await post(
      new Request('http://localhost/api/context/capsules/cap-1', {
        method: 'POST',
        body: JSON.stringify({
          action: 'promote-source-gaps',
          kind: 'sourcing',
          title: 'Source gap: monitoring mandate',
          rationale: 'Ask PRAXIS found no current source for the monitoring mandate.',
          suggestedChange: 'Attach a current primary source for the monitoring mandate.',
          origin: { type: 'ask_gap', threadId: 'ask-thread-1', turnId: 'turn-1' },
        }),
      }),
      { uid: 'u1', isDemo: false },
      { params: Promise.resolve({ capsuleId: 'cap-1' }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toMatch(/read-only/i);
  });
});
