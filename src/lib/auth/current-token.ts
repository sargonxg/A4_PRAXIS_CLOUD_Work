import { isIdentityRejection } from '@/lib/auth/session-failure';

const INFRASTRUCTURE_CODES = new Set([
  'app/invalid-credential', 'app/network-error', 'auth/insufficient-permission',
  'auth/internal-error', 'auth/network-request-failed',
]);

function authError(code: string): Error & { code: string } {
  return Object.assign(new Error('Firebase identity verification failed'), { code });
}

/** Prefer Admin revocation checks. Without privileged credentials, verify the
 * signature then the same live account with Firebase REST. Cookie snapshots
 * and unverified JWT contents never authorize work. See Firebase manage-sessions
 * and Identity Platform UserInfo.validSince for auth_time revocation semantics. */
export async function verifyCurrentIdentity<T extends { uid: string; auth_time: number }>(
  token: string,
  options: {
    verify: (token: string, checkRevoked: boolean) => Promise<T>;
    apiKey?: string;
    fetcher?: typeof fetch;
    emulator?: boolean;
  },
): Promise<T> {
  try {
    return await options.verify(token, true);
  } catch (error) {
    if (isIdentityRejection(error)) throw error;
    if (options.emulator) throw authError('auth/verification-unavailable');
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (!INFRASTRUCTURE_CODES.has(code) || !options.apiKey) throw authError('auth/verification-unavailable');
  }

  const decoded = await options.verify(token, false);
  let response: Response;
  let body: { users?: Array<{ localId?: string; disabled?: boolean; validSince?: string }>; error?: { message?: string } };
  try {
    response = await (options.fetcher ?? fetch)(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(options.apiKey!)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://praxis.tacitus.me' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(10_000), cache: 'no-store' },
    );
    body = await response.json();
  } catch {
    throw authError('auth/verification-unavailable');
  }
  if (!response.ok) {
    const code = body.error?.message?.split(' : ')[0];
    const rejection: Record<string, string> = {
      TOKEN_EXPIRED: 'auth/id-token-expired', INVALID_ID_TOKEN: 'auth/invalid-id-token',
      USER_DISABLED: 'auth/user-disabled', USER_NOT_FOUND: 'auth/user-not-found',
      CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'auth/id-token-revoked',
    };
    throw authError(rejection[code ?? ''] ?? 'auth/verification-unavailable');
  }
  if (!Array.isArray(body.users)) throw authError('auth/verification-unavailable');
  const account = body.users[0];
  if (!account) throw authError('auth/user-not-found');
  if (account.localId !== decoded.uid) throw authError('auth/invalid-id-token');
  if (account.disabled === true) throw authError('auth/user-disabled');
  if (account.validSince !== undefined) {
    const validSince = Number(account.validSince);
    if (!Number.isFinite(validSince) || !Number.isFinite(decoded.auth_time)) throw authError('auth/verification-unavailable');
    if (decoded.auth_time < validSince) throw authError('auth/id-token-revoked');
  }
  return decoded;
}
