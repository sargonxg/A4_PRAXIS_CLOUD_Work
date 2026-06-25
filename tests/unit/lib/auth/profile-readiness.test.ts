import { describe, expect, it, vi } from 'vitest';

import { loadProfileAfterAuthReady } from '@/lib/auth/profile-readiness';

describe('loadProfileAfterAuthReady', () => {
  it('awaits a fresh auth token before running the Firestore profile operation', async () => {
    const events: string[] = [];
    let resolveToken!: () => void;
    const tokenReady = new Promise<string>((resolve) => {
      resolveToken = () => resolve('fresh-token');
    });
    const user = {
      getIdToken: vi.fn(async (forceRefresh?: boolean) => {
        events.push(`token:${String(forceRefresh)}`);
        await tokenReady;
        events.push('token:ready');
        return 'fresh-token';
      }),
    };
    const loadProfile = vi.fn(async () => {
      events.push('profile:load');
      return { credits: 1000 };
    });

    const resultPromise = loadProfileAfterAuthReady(user, loadProfile, { retryDelayMs: 0 });
    await Promise.resolve();

    expect(loadProfile).not.toHaveBeenCalled();
    resolveToken();
    await expect(resultPromise).resolves.toEqual({ credits: 1000 });
    expect(events).toEqual(['token:true', 'token:ready', 'profile:load']);
  });

  it('retries once after an immediate Firestore permission-denied race', async () => {
    const permissionDenied = Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied',
    });
    const user = {
      getIdToken: vi.fn(async () => 'fresh-token'),
    };
    const loadProfile = vi
      .fn()
      .mockRejectedValueOnce(permissionDenied)
      .mockResolvedValueOnce({ credits: 1000 });

    await expect(loadProfileAfterAuthReady(user, loadProfile, { retryDelayMs: 0 })).resolves.toEqual({
      credits: 1000,
    });

    expect(user.getIdToken).toHaveBeenCalledTimes(2);
    expect(user.getIdToken).toHaveBeenNthCalledWith(1, true);
    expect(user.getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(loadProfile).toHaveBeenCalledTimes(2);
  });
});
