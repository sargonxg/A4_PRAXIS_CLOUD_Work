import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/onboarding/complete/route';

vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: (req: Request, user: { uid: string }) => unknown) => (req: Request) => handler(req, { uid: 'owner' }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/firebase/analyst-profile-admin', () => ({ getAnalystProfile: vi.fn(async () => ({})), completeAnalystProfile: vi.fn(async () => ({ versionId: 'v1' })) }));
vi.mock('@/types/analyst-profile', () => ({ isProfileComplete: () => true }));
vi.mock('@/lib/firebase/profile-events', () => ({ publishProfileEvent: vi.fn(async () => undefined), refreshProfileEmbedding: vi.fn(async () => undefined) }));
vi.mock('@/lib/auth/cookie-signer', () => ({ signCookie: vi.fn(), verifyCookie: vi.fn() }));

beforeEach(() => vi.clearAllMocks());
describe('onboarding completion return target', () => {
  it.each([false, true])('retains an explicit destination when createFirstSituation is %s', async (createFirstSituation) => {
    const handoff = 'a7fc6ad8-73f0-4b83-a55d-7602777e02c4';
    const response = await POST(new Request('https://praxis.tacitus.me/api/onboarding/complete', { method: 'POST', body: JSON.stringify({ createFirstSituation, redirect: `/app/capsules/builder?handoff=${handoff}&capsulePrompt=Compare%20positions#Private` }) }) as never);
    const result = await response.json();
    expect(result.redirectTo).toBe(`/app/capsules/builder?handoff=${handoff}`);
    expect(JSON.stringify(result)).not.toContain('Compare');
    expect(JSON.stringify(result)).not.toContain('Private');
  });
  it('falls back to the chosen workspace action for an external destination', async () => {
    const response = await POST(new Request('https://praxis.tacitus.me/api/onboarding/complete', { method: 'POST', body: JSON.stringify({ createFirstSituation: true, redirect: '//evil.test' }) }) as never);
    expect((await response.json()).redirectTo).toBe('/app/capsules/builder?fromOnboarding=1');
  });
});
