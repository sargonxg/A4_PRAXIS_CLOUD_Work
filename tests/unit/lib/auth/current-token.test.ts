import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyCurrentIdentity } from '@/lib/auth/current-token';

const decoded = { uid: 'owner-1', auth_time: 100, email: 'owner@example.test' };
const unavailable = Object.assign(new Error('credentials unavailable'), { code: 'app/invalid-credential' });

describe('current Firebase identity verification', () => {
  const verify = vi.fn();
  const fetcher = vi.fn();
  beforeEach(() => {
    vi.resetAllMocks();
    verify.mockResolvedValue(decoded);
    fetcher.mockResolvedValue(Response.json({ users: [{ localId: 'owner-1', validSince: '100' }] }));
  });
  const run = (apiKey: string | undefined = 'public-key') => verifyCurrentIdentity('signed-token', { verify, fetcher, apiKey });

  it('uses Admin revocation verification and avoids REST when it succeeds', async () => {
    expect(await run()).toEqual(decoded);
    expect(verify).toHaveBeenCalledWith('signed-token', true);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('never falls back to a production identity endpoint in the isolated emulator lane', async () => {
    verify.mockRejectedValue(unavailable);
    await expect(verifyCurrentIdentity('emulator-issued-token', { verify, fetcher, apiKey: 'demo-praxis-ci-key', emulator: true }))
      .rejects.toMatchObject({ code: 'auth/verification-unavailable' });
    expect(verify).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each(['auth/id-token-revoked', 'auth/id-token-expired', 'auth/user-disabled', 'auth/user-not-found'])('never falls back after %s', async (code) => {
    verify.mockRejectedValue(Object.assign(new Error('identity rejected'), { code }));
    await expect(run()).rejects.toMatchObject({ code });
    expect(verify).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('proves signature and current account without privileged credentials', async () => {
    verify.mockRejectedValueOnce(unavailable).mockResolvedValueOnce(decoded);
    expect(await run()).toEqual(decoded);
    expect(verify.mock.calls).toEqual([['signed-token', true], ['signed-token', false]]);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('accounts:lookup'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ idToken: 'signed-token' }) }));
  });

  it('does not call lookup when cryptographic verification fails', async () => {
    verify.mockRejectedValueOnce(unavailable).mockRejectedValueOnce(Object.assign(new Error('invalid'), { code: 'auth/invalid-id-token' }));
    await expect(run()).rejects.toMatchObject({ code: 'auth/invalid-id-token' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    [{ users: [] }, 'auth/user-not-found'],
    [{ users: [{ localId: 'another-owner' }] }, 'auth/invalid-id-token'],
    [{ users: [{ localId: 'owner-1', disabled: true }] }, 'auth/user-disabled'],
    [{ users: [{ localId: 'owner-1', validSince: '101' }] }, 'auth/id-token-revoked'],
  ])('rejects deleted, mismatched, disabled, or revoked lookup result', async (body, code) => {
    verify.mockRejectedValueOnce(unavailable).mockResolvedValueOnce(decoded);
    fetcher.mockResolvedValueOnce(Response.json(body));
    await expect(run()).rejects.toMatchObject({ code });
  });

  it('maps rejected lookup tokens to an identity rejection', async () => {
    verify.mockRejectedValueOnce(unavailable).mockResolvedValueOnce(decoded);
    fetcher.mockResolvedValueOnce(Response.json({ error: { message: 'TOKEN_EXPIRED' } }, { status: 400 }));
    await expect(run()).rejects.toMatchObject({ code: 'auth/id-token-expired' });
  });

  it.each([503, 429, 403])('fails closed during lookup HTTP %s', async (status) => {
    verify.mockRejectedValueOnce(unavailable).mockResolvedValueOnce(decoded);
    fetcher.mockResolvedValueOnce(new Response('', { status }));
    await expect(run()).rejects.toMatchObject({ code: 'auth/verification-unavailable' });
  });

  it('fails closed when public configuration or valid revocation metadata is unavailable', async () => {
    verify.mockRejectedValueOnce(unavailable).mockResolvedValueOnce(decoded);
    await expect(verifyCurrentIdentity('signed-token', { verify, fetcher })).rejects.toMatchObject({ code: 'auth/verification-unavailable' });
    expect(fetcher).not.toHaveBeenCalled();
    verify.mockReset();
    verify.mockRejectedValueOnce(unavailable).mockResolvedValueOnce(decoded);
    fetcher.mockResolvedValueOnce(Response.json({ users: [{ localId: 'owner-1', validSince: 'bad-value' }] }));
    await expect(run()).rejects.toMatchObject({ code: 'auth/verification-unavailable' });
  });
});
