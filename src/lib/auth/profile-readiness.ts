'use client';

const DEFAULT_PERMISSION_RETRY_DELAY_MS = 250;

export interface AuthTokenReadyUser {
  getIdToken(forceRefresh?: boolean): Promise<string>;
}

export interface ProfileReadinessOptions {
  retryDelayMs?: number;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isFirestorePermissionDenied(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const maybe = err as { code?: unknown; message?: unknown };
  return (
    maybe.code === 'permission-denied' ||
    maybe.code === 'firestore/permission-denied' ||
    (typeof maybe.message === 'string' &&
      maybe.message.toLowerCase().includes('missing or insufficient permissions'))
  );
}

export async function loadProfileAfterAuthReady<T>(
  fbUser: AuthTokenReadyUser,
  loadProfile: () => Promise<T>,
  options: ProfileReadinessOptions = {},
): Promise<T> {
  await fbUser.getIdToken(true);

  try {
    return await loadProfile();
  } catch (err) {
    if (!isFirestorePermissionDenied(err)) throw err;

    await delay(options.retryDelayMs ?? DEFAULT_PERMISSION_RETRY_DELAY_MS);
    await fbUser.getIdToken(true);
    return await loadProfile();
  }
}
