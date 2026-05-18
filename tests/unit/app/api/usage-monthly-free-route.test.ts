import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockedUser: { uid: string; email: string; emailVerified: boolean; isDemo: boolean };
let mockedUsageData: Record<string, unknown> | null;
let capturedUsageDocId: string | null;

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: typeof mockedUser) => Promise<Response>) => (
    request: Request,
  ) => handler(request, mockedUser),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: (id: string) => {
            capturedUsageDocId = id;
            return {
              get: async () => ({
                data: () => mockedUsageData,
              }),
            };
          },
        }),
      }),
    }),
  }),
}));

describe('/api/usage/monthly-free', () => {
  beforeEach(() => {
    mockedUser = {
      uid: 'user-123',
      email: 'analyst@example.com',
      emailVerified: true,
      isDemo: false,
    };
    mockedUsageData = {
      creditsUsed: 120,
      conversationStarts: 3,
      lastOperationType: 'ai_chat',
    };
    capturedUsageDocId = null;
  });

  it('returns monthly PRAXIS credit usage from the monthly-free usage document', async () => {
    const { GET } = await import('@/app/api/usage/monthly-free/route');

    const response = await GET(new Request('https://praxis.test/api/usage/monthly-free'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(capturedUsageDocId).toMatch(/^monthly-free-\d{4}-\d{2}$/);
    expect(body).toMatchObject({
      allowance: 31_000,
      used: 120,
      creditsUsed: 120,
      remaining: 30_880,
      conversationStarts: 3,
      lastOperationType: 'ai_chat',
      persisted: true,
    });
    expect(body.monthKey).toMatch(/^\d{4}-\d{2}$/);
    expect(body.nextResetAt).toBeTruthy();
  });

  it('reports verified unlimited admins without reading Firestore usage', async () => {
    mockedUser = {
      uid: 'admin-123',
      email: 'giulio@tacitus.me',
      emailVerified: true,
      isDemo: false,
    };
    const { GET } = await import('@/app/api/usage/monthly-free/route');

    const response = await GET(new Request('https://praxis.test/api/usage/monthly-free'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(capturedUsageDocId).toBeNull();
    expect(body.unlimited).toBe(true);
    expect(body.allowance).toBe(31_000);
  });
});
