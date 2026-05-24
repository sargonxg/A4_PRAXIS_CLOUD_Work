import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieGet = vi.fn();
const userGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: cookieGet,
  }),
}));

vi.mock('@/lib/auth/cookie-signer', () => ({
  verifyCookie: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  verifyIdToken: vi.fn().mockResolvedValue({ uid: 'u1' }),
  getAdminDbOrThrow: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: userGet,
        update: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  })),
}));

vi.mock('@/lib/firebase/firestore', () => ({
  DEFAULT_AI_SETTINGS: {
    preferredModel: 'auto',
    temperature: 0.3,
    researchDepth: 'standard',
    customInstructions: '',
    maxTokens: 2048,
  },
}));

const { verifyCookie } = await import('@/lib/auth/cookie-signer');
const { GET } = await import('@/app/api/settings/ai/route');

describe('GET /api/settings/ai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'signed-session-cookie' });
    vi.mocked(verifyCookie).mockReturnValue(JSON.stringify({ token: 'firebase-id-token' }));
    userGet.mockResolvedValue({
      exists: true,
      data: () => ({
        aiSettings: {
          preferredModel: 'auto',
          temperature: 0.4,
          researchDepth: 'comprehensive',
          customInstructions: 'Prefer source receipts.',
          maxTokens: 4096,
        },
      }),
    });
  });

  it('verifies signed session cookies before loading user AI settings', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(verifyCookie).toHaveBeenCalledWith('signed-session-cookie');
    expect(body.settings).toMatchObject({
      researchDepth: 'comprehensive',
      customInstructions: 'Prefer source receipts.',
    });
  });

  it('returns 401 for invalid signed session cookies instead of 500', async () => {
    vi.mocked(verifyCookie).mockReturnValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid session');
  });
});
