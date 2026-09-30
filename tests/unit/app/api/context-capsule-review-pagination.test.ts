import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CapsulePaginationError } from '@/lib/context/capsule-pagination';

const service = vi.hoisted(() => ({
  getCapsule: vi.fn(), listCapsuleReviewCards: vi.fn(), listCapsuleReviewCardsPage: vi.fn(),
}));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/context/capsule-service', () => service);
vi.mock('@/lib/api/standard-error', () => ({ handleRouteError: () => Response.json({ error: 'Unexpected server error' }, { status: 500 }) }));
type Handler = (request: Request, user: { uid: string }, context: { params: Promise<{ capsuleId: string }> }) => Promise<Response>;

describe('capsule review pagination route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getCapsule.mockResolvedValue({ capsuleId: 'cap-1', ownerUid: 'u1' });
    service.listCapsuleReviewCardsPage.mockResolvedValue({ cards: [{ reviewCardId: 'card-1' }], nextCursor: 'next', hasMore: true });
  });
  async function get(query: string) {
    const { GET } = await import('@/app/api/context/capsules/[capsuleId]/route');
    return (GET as unknown as Handler)(new Request(`http://localhost/api/context/capsules/cap-1?${query}`),
      { uid: 'u1' }, { params: Promise.resolve({ capsuleId: 'cap-1' }) });
  }
  it('passes the authenticated owner and continuation and exposes further review cards', async () => {
    const response = await get('includeReviewCards=true&reviewLimit=50&reviewCursor=opaque');
    expect(response.status).toBe(200);
    expect(service.listCapsuleReviewCardsPage).toHaveBeenCalledWith('u1', 'cap-1', { limit: 50, cursor: 'opaque' });
    expect(await response.json()).toMatchObject({ reviewCards: [{ reviewCardId: 'card-1' }], reviewCardsNextCursor: 'next', reviewCardsHasMore: true });
    expect(service.listCapsuleReviewCards).not.toHaveBeenCalled();
  });
  it('rejects out-of-range limits and mismatched cursors as client errors', async () => {
    expect((await get('includeReviewCards=true&reviewLimit=101')).status).toBe(400);
    expect(service.listCapsuleReviewCardsPage).not.toHaveBeenCalled();
    service.listCapsuleReviewCardsPage.mockRejectedValueOnce(new CapsulePaginationError('Invalid cursor for this owner'));
    expect((await get('includeReviewCards=true&reviewLimit=50&reviewCursor=wrong')).status).toBe(400);
  });
});
