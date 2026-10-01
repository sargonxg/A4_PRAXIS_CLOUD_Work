import type { ReactElement } from 'react';
import type { User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/lib/auth/auth-context';

type AuthListener = (user: User | null) => unknown;
const runtime = vi.hoisted(() => ({
  cursor: 0,
  hooks: new Map<number, unknown>(),
  effects: [] as Array<() => unknown>,
  authListener: null as AuthListener | null,
  tokenListener: null as AuthListener | null,
  listenerJobs: [] as Promise<unknown>[],
  auth: { currentUser: null as User | null },
  createdUser: null as User | null,
  profileReady: Promise.resolve(),
  sessionNames: [] as string[],
  sessionOwners: [] as string[],
  createAccount: vi.fn(),
  updateProfile: vi.fn(),
  sendVerification: vi.fn(),
  ensureProfile: vi.fn(),
  signOut: vi.fn(),
}));

// Exercise the provider callbacks without a DOM or another rendering dependency.
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useState: (initial: unknown) => {
    const key = runtime.cursor++;
    if (!runtime.hooks.has(key)) runtime.hooks.set(key, initial);
    return [runtime.hooks.get(key), (update: unknown) => runtime.hooks.set(key,
      typeof update === 'function'
        ? (update as (previous: unknown) => unknown)(runtime.hooks.get(key))
        : update)];
  },
  useRef: (initial: unknown) => {
    const key = runtime.cursor++;
    if (!runtime.hooks.has(key)) runtime.hooks.set(key, { current: initial });
    return runtime.hooks.get(key);
  },
  useCallback: (callback: unknown) => callback,
  useMemo: (compute: () => unknown) => compute(),
  useEffect: (effect: () => unknown) => { runtime.effects.push(effect); },
}));
vi.mock('@/lib/firebase/config', () => ({ auth: runtime.auth, db: {} }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, listener: AuthListener) => {
    runtime.authListener = listener;
    return vi.fn();
  },
  onIdTokenChanged: (_auth: unknown, listener: AuthListener) => {
    runtime.tokenListener = listener;
    return vi.fn();
  },
  createUserWithEmailAndPassword: runtime.createAccount,
  updateProfile: runtime.updateProfile,
  sendEmailVerification: runtime.sendVerification,
  signOut: runtime.signOut,
  setPersistence: vi.fn().mockResolvedValue(undefined),
  getRedirectResult: vi.fn().mockResolvedValue(null),
  browserLocalPersistence: {},
}));
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), onSnapshot: vi.fn(() => vi.fn()) }));
vi.mock('@/lib/firebase/firestore', () => ({ ensureUserProfile: runtime.ensureProfile }));

type AuthValue = ReactElement<{
  value: {
    user: { id: string; name: string; credits: number; subscription: string } | null;
    firebaseUser: User | null;
    loading: boolean;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
  };
}>;
function value() {
  runtime.cursor = 0;
  return (AuthProvider({ children: null }) as AuthValue).props.value;
}
async function flush() {
  for (let turn = 0; turn < 12; turn++) await Promise.resolve();
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(async () => {
  vi.useFakeTimers();
  runtime.hooks.clear();
  runtime.effects = [];
  runtime.authListener = null;
  runtime.tokenListener = null;
  runtime.listenerJobs = [];
  runtime.auth.currentUser = null;
  runtime.sessionNames = [];
  runtime.sessionOwners = [];
  runtime.profileReady = Promise.resolve();
  runtime.signOut.mockReset().mockImplementation(async () => {
    runtime.auth.currentUser = null;
    runtime.listenerJobs.push(Promise.resolve(runtime.authListener?.(null)));
    runtime.listenerJobs.push(Promise.resolve(runtime.tokenListener?.(null)));
  });
  runtime.sendVerification.mockReset().mockResolvedValue(undefined);
  runtime.ensureProfile.mockReset().mockResolvedValue({
    role: 'analyst', orgId: 'org-default', orgName: 'TACITUS Platform',
    credits: 1000, subscription: 'free',
  });
  let cachedName = '';
  const user = {
    uid: 'synthetic-signup-owner', email: 'analyst@example.test', displayName: null as string | null, photoURL: null,
    getIdToken: vi.fn(async (forceRefresh?: boolean) => {
      if (forceRefresh) cachedName = user.displayName || '';
      return JSON.stringify({ uid: user.uid, name: cachedName });
    }),
  };
  runtime.createdUser = user as unknown as User;
  runtime.createAccount.mockReset().mockImplementation(async () => {
    // Firebase notifies both listeners before the account-creation promise resolves.
    runtime.auth.currentUser = runtime.createdUser;
    runtime.listenerJobs.push(Promise.resolve(runtime.authListener?.(runtime.createdUser)));
    runtime.listenerJobs.push(Promise.resolve(runtime.tokenListener?.(runtime.createdUser)));
    return { user: runtime.createdUser };
  });
  runtime.updateProfile.mockReset().mockImplementation(async (_user: User, profile: { displayName: string }) => {
    await runtime.profileReady;
    user.displayName = profile.displayName;
  });
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as { token: string };
      runtime.sessionNames.push((JSON.parse(body.token) as { name: string }).name);
      runtime.sessionOwners.push((JSON.parse(body.token) as { uid: string }).uid);
      return new Response('{}', { status: 200 });
    }
    return new Response(JSON.stringify({ user: null }), { status: 200 });
  }));
  value();
  for (const effect of runtime.effects) effect();
  await flush();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('email signup profile readiness', () => {
  it('keeps the new identity private until its name and token are ready, then hydrates the same owner', async () => {
    const profile = deferred();
    runtime.profileReady = profile.promise;
    const signup = value().signUpWithEmail('analyst@example.test', 'synthetic-password', 'Synthetic Signup Analyst');
    await flush();
    expect(runtime.updateProfile).toHaveBeenCalledOnce();
    expect(runtime.sessionNames).toEqual([]);
    expect(value().user).toBeNull();
    expect(value().loading).toBe(true);

    profile.resolve();
    expect(await signup).toEqual({ success: true });
    await Promise.all(runtime.listenerJobs);
    expect(runtime.sessionNames.length).toBeGreaterThan(0);
    expect(runtime.sessionNames.every((name) => name === 'Synthetic Signup Analyst')).toBe(true);
    expect(value().user).toMatchObject({ name: 'Synthetic Signup Analyst', credits: 1000, subscription: 'free' });
    expect(value().firebaseUser?.uid).toBe('synthetic-signup-owner');
    expect(runtime.ensureProfile).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      uid: 'synthetic-signup-owner', displayName: 'Synthetic Signup Analyst',
    }));
    expect(runtime.signOut).not.toHaveBeenCalled();
  });

  it('retains the named account when verification-email delivery fails', async () => {
    runtime.sendVerification.mockRejectedValueOnce(new Error('Synthetic mail outage'));
    expect(await value().signUpWithEmail('analyst@example.test', 'synthetic-password', 'Synthetic Signup Analyst')).toEqual({ success: true });
    await Promise.all(runtime.listenerJobs);
    expect(runtime.sessionNames.every((name) => name === 'Synthetic Signup Analyst')).toBe(true);
    expect(value().user?.name).toBe('Synthetic Signup Analyst');
    expect(runtime.signOut).not.toHaveBeenCalled();
  });

  it('releases failed signup readiness so a later valid login can sync', async () => {
    runtime.createAccount.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    expect(await value().signUpWithEmail('analyst@example.test', 'synthetic-password', 'Synthetic Signup Analyst')).toMatchObject({ success: false });
    runtime.auth.currentUser = runtime.createdUser;
    await runtime.authListener?.(runtime.createdUser);
    expect(runtime.sessionNames.length).toBeGreaterThan(0);
    expect(value().loading).toBe(false);
  });

  it('signs out the actual pending Firebase user and prevents a delayed profile from restoring it', async () => {
    const profile = deferred();
    runtime.profileReady = profile.promise;
    const signup = value().signUpWithEmail('analyst@example.test', 'synthetic-password', 'Synthetic Signup Analyst');
    await flush();
    expect(value().firebaseUser).toBeNull();
    await value().logout();
    profile.resolve();
    const result = await signup;
    await Promise.all(runtime.listenerJobs);
    expect(runtime.signOut).toHaveBeenCalledOnce();
    expect(runtime.auth.currentUser).toBeNull();
    expect(runtime.sessionOwners).toEqual([]);
    expect(runtime.ensureProfile).not.toHaveBeenCalled();
    expect(value().user).toBeNull();
    expect(value().firebaseUser).toBeNull();
    expect(value().loading).toBe(false);
    expect(result.success).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not publish or hydrate signup A after Firebase switches to account B', async () => {
    const profile = deferred();
    runtime.profileReady = profile.promise;
    const signup = value().signUpWithEmail('analyst@example.test', 'synthetic-password', 'Synthetic Signup Analyst');
    await flush();
    const secondUser = {
      uid: 'synthetic-second-owner', email: 'second@example.test', displayName: 'Second Analyst', photoURL: null,
      getIdToken: vi.fn(async () => JSON.stringify({ uid: 'synthetic-second-owner', name: 'Second Analyst' })),
    } as unknown as User;
    runtime.auth.currentUser = secondUser;
    const switched = [
      Promise.resolve(runtime.authListener?.(secondUser)),
      Promise.resolve(runtime.tokenListener?.(secondUser)),
    ];
    profile.resolve();
    const result = await signup;
    await Promise.all([...runtime.listenerJobs, ...switched]);
    expect(runtime.sessionOwners.length).toBeGreaterThan(0);
    expect(runtime.sessionOwners.every((uid) => uid === secondUser.uid)).toBe(true);
    expect(runtime.ensureProfile).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ uid: secondUser.uid }));
    expect(value().user).toMatchObject({ id: secondUser.uid, name: 'Second Analyst' });
    expect(value().firebaseUser?.uid).toBe(secondUser.uid);
    expect(result.success).toBe(false);
    expect(runtime.signOut).not.toHaveBeenCalled();
  });

  it('does not restore an account when its Firestore hydration finishes after logout', async () => {
    const hydration = deferred();
    runtime.ensureProfile.mockImplementation(async () => {
      await hydration.promise;
      return { role: 'analyst', orgId: 'org-default', orgName: 'TACITUS Platform', credits: 1000, subscription: 'free' };
    });
    expect(await value().signUpWithEmail('analyst@example.test', 'synthetic-password', 'Synthetic Signup Analyst')).toEqual({ success: true });
    await vi.waitFor(() => expect(runtime.ensureProfile).toHaveBeenCalledOnce());
    await value().logout();
    hydration.resolve();
    await Promise.all(runtime.listenerJobs);
    expect(runtime.auth.currentUser).toBeNull();
    expect(value().user).toBeNull();
    expect(value().firebaseUser).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['profile update', 'token refresh'])('releases a rejected %s before a later valid login', async (failure) => {
    if (failure === 'profile update') runtime.updateProfile.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    else vi.mocked(runtime.createdUser!.getIdToken).mockImplementationOnce(async () => {
      throw { code: 'auth/network-request-failed' };
    });
    const result = await value().signUpWithEmail('analyst@example.test', 'synthetic-password', 'Synthetic Signup Analyst');
    await Promise.all(runtime.listenerJobs);
    expect(result.success).toBe(false);
    expect(runtime.signOut).not.toHaveBeenCalled();
    await runtime.authListener?.(runtime.createdUser);
    expect(runtime.sessionOwners).toContain('synthetic-signup-owner');
    expect(value().loading).toBe(false);
  });

  it.each(['logout', 'account switch'])('aborts in-flight session requests during %s and ignores their late responses', async (transition) => {
    const pending = deferred();
    const pendingSignals: AbortSignal[] = [];
    const fetcher = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { token: string };
        const identity = JSON.parse(body.token) as { uid: string };
        if (identity.uid === runtime.createdUser!.uid) {
          pendingSignals.push(init.signal!);
          await pending.promise;
          if (init.signal!.aborted) throw new DOMException('Authentication changed', 'AbortError');
        }
      }
      return fetcher(url, init);
    }));
    const signup = value().signUpWithEmail('analyst@example.test', 'synthetic-password', 'Synthetic Signup Analyst');
    await vi.waitFor(() => expect(pendingSignals.length).toBeGreaterThan(0));
    let switched: Promise<unknown>[] = [];
    if (transition === 'logout') await value().logout();
    else {
      const secondUser = {
        uid: 'synthetic-second-owner', email: 'second@example.test', displayName: 'Second Analyst', photoURL: null,
        getIdToken: vi.fn(async () => JSON.stringify({ uid: 'synthetic-second-owner', name: 'Second Analyst' })),
      } as unknown as User;
      runtime.auth.currentUser = secondUser;
      switched = [Promise.resolve(runtime.authListener?.(secondUser)), Promise.resolve(runtime.tokenListener?.(secondUser))];
      await Promise.all(switched);
    }
    expect(pendingSignals.every((signal) => signal.aborted)).toBe(true);
    pending.resolve();
    expect((await signup).success).toBe(false);
    await Promise.all([...runtime.listenerJobs, ...switched]);
    expect(runtime.sessionOwners).not.toContain('synthetic-signup-owner');
    if (transition === 'logout') {
      expect(value().user).toBeNull();
      expect(value().firebaseUser).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    } else expect(value().user).toMatchObject({ id: 'synthetic-second-owner', name: 'Second Analyst' });
  });

  it('suppresses account A POSTs when its token read resolves after a switch to B', async () => {
    const tokenReady = deferred();
    vi.mocked(runtime.createdUser!.getIdToken).mockImplementation(async () => {
      await tokenReady.promise;
      return JSON.stringify({ uid: 'synthetic-signup-owner', name: 'First Analyst' });
    });
    runtime.auth.currentUser = runtime.createdUser;
    const previous = [Promise.resolve(runtime.authListener?.(runtime.createdUser)), Promise.resolve(runtime.tokenListener?.(runtime.createdUser))];
    await flush();
    expect(runtime.createdUser!.getIdToken).toHaveBeenCalled();
    const secondUser = {
      uid: 'synthetic-second-owner', email: 'second@example.test', displayName: 'Second Analyst', photoURL: null,
      getIdToken: vi.fn(async () => JSON.stringify({ uid: 'synthetic-second-owner', name: 'Second Analyst' })),
    } as unknown as User;
    runtime.auth.currentUser = secondUser;
    await Promise.all([runtime.authListener?.(secondUser), runtime.tokenListener?.(secondUser)]);
    tokenReady.resolve();
    await Promise.all(previous);
    expect(runtime.sessionOwners.every((uid) => uid === secondUser.uid)).toBe(true);
    expect(runtime.ensureProfile).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ uid: secondUser.uid }));
    expect(value().user).toMatchObject({ id: secondUser.uid, name: 'Second Analyst' });
  });

  it('ignores an old server-session recovery response after a Firebase identity arrives', async () => {
    const recovery = deferred();
    const fetcher = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (!init?.method) {
        await recovery.promise;
        return new Response(JSON.stringify({
          authenticated: true, user: { id: 'old-server-owner', email: 'old@example.test', name: 'Old Analyst' },
        }), { status: 200 });
      }
      return fetcher(url, init);
    }));
    const oldRecovery = Promise.resolve(runtime.authListener?.(null));
    await flush();
    runtime.auth.currentUser = runtime.createdUser;
    await Promise.all([runtime.authListener?.(runtime.createdUser), runtime.tokenListener?.(runtime.createdUser)]);
    recovery.resolve();
    await oldRecovery;
    expect(value().user?.id).toBe('synthetic-signup-owner');
    expect(value().firebaseUser?.uid).toBe('synthetic-signup-owner');
    expect(value().loading).toBe(false);
  });
});
