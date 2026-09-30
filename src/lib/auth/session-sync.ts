export type SessionSyncResult = 'ready' | 'invalid' | 'unavailable';

/** A stale ID token gets one refresh. A backend outage never becomes logout. */
export async function syncFirebaseSession(
  user: { getIdToken: (forceRefresh?: boolean) => Promise<string> },
  fetcher: typeof fetch = fetch,
): Promise<SessionSyncResult> {
  try {
    const post = async (forceRefresh: boolean) => fetcher('/api/auth/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: await user.getIdToken(forceRefresh) }),
    });
    let response = await post(false);
    if (response.status === 401) response = await post(true);
    return response.ok ? 'ready' : response.status === 401 ? 'invalid' : 'unavailable';
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    return ['auth/user-token-expired', 'auth/invalid-user-token', 'auth/user-disabled', 'auth/user-not-found'].includes(code) ? 'invalid' : 'unavailable';
  }
}
