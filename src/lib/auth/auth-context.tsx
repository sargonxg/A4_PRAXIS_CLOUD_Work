'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef, ReactNode } from 'react';
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { AnalystProfileSchema, type AnalystProfile } from '@/types/analyst-profile';
import type { SubscriptionTier } from '@/lib/firebase/firestore';
import { isOnboardingComplete } from '@/lib/auth/onboarding-status';
import { loadProfileAfterAuthReady } from '@/lib/auth/profile-readiness';
import { syncFirebaseSession } from '@/lib/auth/session-sync';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  orgName: string;
  isDemo: boolean;
  photoURL?: string;
  credits: number;
  /** Public-facing plan tier (free | analyst | team | enterprise). Drives sidebar plan badge. */
  subscription: SubscriptionTier;
}

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  credits: number;
  analystProfile: AnalystProfile | null;
  onboardingComplete: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUser: null,
  loading: true,
  credits: 0,
  analystProfile: null,
  onboardingComplete: false,
  authError: null,
  clearAuthError: () => {},
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signInWithGoogle: async () => ({ success: false }),
  signInAsDemo: async () => {},
  logout: async () => {},
  refreshCredits: async () => {},
  resetPassword: async () => ({ success: false }),
});

// ---------------------------------------------------------------------------
// Helper: create AuthUser from Firebase user (no Firestore dependency)
// ---------------------------------------------------------------------------

function fbUserToAuthUser(fbUser: FirebaseUser, credits = 0): AuthUser {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Analyst',
    role: 'analyst',
    orgId: 'org-default',
    orgName: 'TACITUS Platform',
    isDemo: false,
    photoURL: fbUser.photoURL || undefined,
    credits,
    subscription: 'free',
  };
}

async function serverSessionToAuthUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/session', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!response.ok) return null;
    const payload = await response.json() as {
      authenticated?: boolean;
      user?: {
        id?: string;
        email?: string;
        name?: string;
        isDemo?: boolean;
      } | null;
    };
    if (!payload.user?.id) return null;
    if (!payload.authenticated && payload.user.isDemo !== true) return null;
    return {
      id: payload.user.id,
      email: payload.user.email || '',
      name: payload.user.name || payload.user.email?.split('@')[0] || 'Analyst',
      role: 'analyst',
      orgId: 'org-default',
      orgName: 'TACITUS Platform',
      isDemo: payload.user.isDemo === true,
      credits: 0,
      subscription: 'free',
    };
  } catch {
    return null;
  }
}

const DEPLOYED_APP_DOMAIN = 'praxis.tacitus.me';
const GOOGLE_OAUTH_REDIRECT_URI = 'https://praxisbytacitus.firebaseapp.com/__/auth/handler';

function firebaseAuthErrorCode(err: unknown): string {
  return (err as { code?: string }).code || '';
}

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

function isPopupFallbackError(code: string): boolean {
  return code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request' || code === 'auth/web-storage-unsupported';
}

function describeGoogleAuthError(code: string): string {
  if (code === 'auth/unauthorized-domain') {
    return `This deployment domain is not authorized for Firebase Auth. Add ${DEPLOYED_APP_DOMAIN} in Firebase Console > Authentication > Settings > Authorized domains, and keep ${GOOGLE_OAUTH_REDIRECT_URI} authorized in Google OAuth.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled for this Firebase project. Enable the Google provider in Firebase Authentication.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled before completion.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google popup. PRAXIS is switching to Google redirect sign-in.';
  }
  if (code === 'auth/auth-domain-config-required') {
    return 'Firebase Auth is missing its authDomain configuration for this deployment.';
  }
  if (code === 'auth/invalid-api-key') {
    return 'Firebase Auth is using an invalid API key for this deployment.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error - could not reach Firebase authentication servers.';
  }
  return `Google sign-in failed${code ? ` (${code})` : ''}. Please try again.`;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [analystProfile, setAnalystProfile] = useState<AnalystProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Clear any legacy sample session on mount / page refresh.
  //
  // We track completion so onAuthStateChanged knows whether it's safe to
  // set loading=false. Without this, the Firebase listener can set
  // loading=false (with user=null) before the demo check resolves,
  // causing AppShell to briefly redirect to /login.
  // ---------------------------------------------------------------------------
  const demoCheckDoneRef = useRef(false);
  const firebaseAuthDoneRef = useRef(false);
  const authGenerationRef = useRef(0);
  const activeUidRef = useRef<string | null>(auth.currentUser?.uid ?? null);
  const logoutRequestedRef = useRef(false);
  const serverSessionRecoveryRef = useRef(true);
  const sessionRequestsRef = useRef(new Set<AbortController>());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Firebase emits the new account before signup finishes saving its name.
  // Both auth listeners must wait before publishing its token or app state.
  const signupProfileReadyRef = useRef<{
    uid: string | null;
    ready: Promise<boolean>;
    finish: (ready: boolean) => void;
    cancelled: boolean;
  } | null>(null);

  const cancelPendingSignup = useCallback(() => {
    const signup = signupProfileReadyRef.current;
    if (signup) {
      signup.cancelled = true;
      signup.finish(false);
      signupProfileReadyRef.current = null;
    }
  }, []);

  const cancelAuthRequests = useCallback(() => {
    for (const request of sessionRequestsRef.current) request.abort();
    sessionRequestsRef.current.clear();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = null;
  }, []);

  const observeAuthIdentity = useCallback((fbUser: FirebaseUser | null): number => {
    const uid = fbUser?.uid ?? null;
    if (activeUidRef.current !== uid) {
      if (!uid) serverSessionRecoveryRef.current = false;
      activeUidRef.current = uid;
      authGenerationRef.current++;
      firebaseAuthDoneRef.current = false;
      cancelAuthRequests();
      setUser(null);
      setFirebaseUser(null);
      setCredits(0);
      setAnalystProfile(null);
      setLoading(true);
      if (signupProfileReadyRef.current?.uid && signupProfileReadyRef.current.uid !== uid) {
        cancelPendingSignup();
      }
    }
    return authGenerationRef.current;
  }, [cancelAuthRequests, cancelPendingSignup]);

  const isCurrentAuth = useCallback((generation: number, fbUser: FirebaseUser | null): boolean => (
    generation === authGenerationRef.current
    && (auth.currentUser?.uid ?? null) === (fbUser?.uid ?? null)
    && (!fbUser || !logoutRequestedRef.current)
  ), []);

  useEffect(() => {
    let cancelled = false;
    const generation = authGenerationRef.current;
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || generation !== authGenerationRef.current) return;
        if (data?.user?.isDemo) {
          setUser(null);
          setCredits(0);
          setIsDemoMode(false);
          setAnalystProfile(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        demoCheckDoneRef.current = true;
        // If Firebase auth already resolved (no user), NOW set loading=false
        if (generation === authGenerationRef.current && firebaseAuthDoneRef.current) {
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Sync auth token to a cookie so the Next.js middleware can check it.
  // Returns true if the cookie was successfully set, false otherwise.
  const syncTokenCookie = useCallback(async (fbUser: FirebaseUser | null, generation = authGenerationRef.current): Promise<boolean> => {
    const request = new AbortController();
    sessionRequestsRef.current.add(request);
    try {
      if (fbUser) {
        const signup = signupProfileReadyRef.current;
        if (signup && (!signup.uid || signup.uid === fbUser.uid) && !await signup.ready) return false;
        if (!isCurrentAuth(generation, fbUser)) return false;
        const result = await syncFirebaseSession(fbUser, (input, init) => {
          if (!isCurrentAuth(generation, fbUser)) throw new Error('Authentication changed');
          return fetch(input, { ...init, signal: request.signal });
        });
        if (!isCurrentAuth(generation, fbUser)) return false;
        if (result === 'invalid') {
          setUser(null);
          setFirebaseUser(null);
          setCredits(0);
          setAnalystProfile(null);
          setAuthError('Your session is no longer valid. Please sign in again.');
          await fetch('/api/auth/session', { method: 'DELETE', signal: request.signal }).catch(() => {});
          if (isCurrentAuth(generation, fbUser)) await firebaseSignOut(auth).catch(() => {});
        } else if (result === 'unavailable') {
          setAuthError('PRAXIS could not verify your session right now. Please try again.');
        }
        return result === 'ready';
      } else if (!isDemoMode && isCurrentAuth(generation, null)) {
        await fetch('/api/auth/session', { method: 'DELETE', signal: request.signal });
      }
      return isCurrentAuth(generation, fbUser);
    } catch (err) {
      if (!isCurrentAuth(generation, fbUser)) return false;
      console.error('[auth] Cookie sync failed:', err);
      return false;
    } finally {
      sessionRequestsRef.current.delete(request);
    }
  }, [isDemoMode, isCurrentAuth]);

  // Listen to Firebase auth state.
  // Use a ref for the legacy sample flag to avoid re-subscribing on session
  // cleanup.
  const isDemoModeRef = useRef(isDemoMode);
  isDemoModeRef.current = isDemoMode;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if ((auth.currentUser?.uid ?? null) !== (fbUser?.uid ?? null)) return;
      const generation = observeAuthIdentity(fbUser);
      if (fbUser) {
        if (logoutRequestedRef.current) {
          if (auth.currentUser?.uid === fbUser.uid) await firebaseSignOut(auth).catch(() => {});
          return;
        }
        setIsDemoMode(false);

        // First: sync the session cookie required by middleware. If this fails,
        // do not expose an authenticated app state; otherwise /login can push
        // to /app while middleware immediately bounces back to /login.
        const synced = await syncTokenCookie(fbUser, generation);
        if (!isCurrentAuth(generation, fbUser)) return;
        if (!synced) {
          setAuthError((previous) => previous ?? 'Sign-in succeeded, but PRAXIS could not verify your secure session. Please try again, or contact TACITUS with the time of the attempt.');
          setUser(null);
          setFirebaseUser(null);
          setCredits(0);
          // Invalid identities are cleared by syncTokenCookie. Preserve the
          // Firebase login during a transient backend outage for a later retry.
          firebaseAuthDoneRef.current = true;
          setLoading(false);
          return;
        }

        // Session is ready: set the user immediately from Firebase Auth data
        // while Firestore profile hydration runs below.
        const authUser = fbUserToAuthUser(fbUser);
        setAuthError(null);
        setUser(authUser);
        setCredits(0);

        // Hydrate the profile already initialized by the verified session API.
        try {
          const { ensureUserProfile } = await import('@/lib/firebase/firestore');
          if (!isCurrentAuth(generation, fbUser)) return;
          const profile = await loadProfileAfterAuthReady(fbUser, () => {
            if (!isCurrentAuth(generation, fbUser)) throw new Error('Authentication changed');
            return ensureUserProfile({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
            });
          });
          if (!isCurrentAuth(generation, fbUser)) return;
          // Update with Firestore data (credits, role, org, plan tier)
          setUser({
            ...authUser,
            role: profile.role,
            orgId: profile.orgId,
            orgName: profile.orgName,
            credits: profile.credits,
            subscription: profile.subscription || 'free',
          });
          setCredits(profile.credits);

        } catch (err) {
          if (!isCurrentAuth(generation, fbUser)) return;
          // Firestore failed — that's OK, user is still logged in with defaults
          console.warn('[auth] Firestore profile load failed (using defaults):', err);
        }
        if (isCurrentAuth(generation, fbUser)) setFirebaseUser(fbUser);
      } else if (!isDemoModeRef.current) {
        if (!serverSessionRecoveryRef.current) await syncTokenCookie(null, generation);
        if (!isCurrentAuth(generation, null)) return;
        const sessionUser = serverSessionRecoveryRef.current && !logoutRequestedRef.current
          ? await serverSessionToAuthUser()
          : null;
        if (!isCurrentAuth(generation, null)) return;
        if (sessionUser) {
          setUser(sessionUser);
          setFirebaseUser(null);
          setIsDemoMode(sessionUser.isDemo);
          setCredits(sessionUser.credits);
          firebaseAuthDoneRef.current = true;
          setLoading(false);
          return;
        }
        setUser(null);
        setFirebaseUser(null);
        setCredits(0);
      }
      if (!isCurrentAuth(generation, fbUser)) return;
      firebaseAuthDoneRef.current = true;
      // If a Firebase user was found, we can set loading=false immediately.
      // If no Firebase user, only set loading=false after the demo check has
      // also completed — otherwise AppShell sees user=null too early.
      if (fbUser || demoCheckDoneRef.current) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncTokenCookie, observeAuthIdentity, isCurrentAuth]);

  // ---------------------------------------------------------------------------
  // Handle Google redirect result on page load.
  // signInWithRedirect navigates the user to Google; on return, getRedirectResult
  // resolves the credential. We still sync the PRAXIS cookie here so middleware
  // has the session before /login auto-redirects to the app.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const redirectResult = await getRedirectResult(auth);
        if (cancelled || !redirectResult?.user) return;
        if (logoutRequestedRef.current || auth.currentUser?.uid !== redirectResult.user.uid) return;
        const generation = observeAuthIdentity(redirectResult.user);
        const synced = await syncTokenCookie(redirectResult.user, generation);
        if (!isCurrentAuth(generation, redirectResult.user)) return;
        if (!synced) {
          setAuthError('Google sign-in finished, but PRAXIS could not initialize the secure app session. Please try again.');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const code = firebaseAuthErrorCode(err);
        console.error('[auth] Google redirect result error:', code, err);
        setAuthError(describeGoogleAuthError(code));
      }
    })();
    return () => { cancelled = true; };
  }, [syncTokenCookie, observeAuthIdentity, isCurrentAuth]);

  // ---------------------------------------------------------------------------
  // Token refresh: listen for token changes AND proactively refresh before expiry
  // Firebase ID tokens expire after 1 hour. This ensures the session cookie
  // always has a valid token, preventing 401s on long-lived sessions.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // onIdTokenChanged fires when:
    // 1. User signs in/out
    // 2. Token is refreshed (automatic or manual)
    // 3. Custom claims change
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      if ((auth.currentUser?.uid ?? null) !== (fbUser?.uid ?? null)) return;
      const generation = observeAuthIdentity(fbUser);
      if (fbUser) {
        // Sync the fresh token to the session cookie
        await syncTokenCookie(fbUser, generation);
        if (!isCurrentAuth(generation, fbUser)) return;

        // Schedule a proactive refresh 5 minutes before expiry
        // Firebase tokens expire in 3600s. Refresh at 50 minutes.
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(async () => {
          if (!isCurrentAuth(generation, fbUser)) return;
          try {
            // Force-refresh the token — Firebase SDK handles the refresh call
            await fbUser.getIdToken(true);
            // onIdTokenChanged will fire again with the new token
          } catch (err) {
            if (!isCurrentAuth(generation, fbUser)) return;
            console.warn('[auth] Proactive token refresh failed:', err);
          }
        }, 50 * 60 * 1000); // 50 minutes
      } else {
        // User signed out — clear the refresh timer
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [syncTokenCookie, observeAuthIdentity, isCurrentAuth]);

  // ---------------------------------------------------------------------------
  // Real-time credit sync: listen for Firestore profile changes so credits
  // update instantly after Polar payments, AI usage, or admin adjustments.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!firebaseUser || isDemoMode) return;
    const generation = authGenerationRef.current;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (!isCurrentAuth(generation, firebaseUser)) return;
        if (snapshot.exists()) {
          const data = snapshot.data();
          const newCredits = typeof data.credits === 'number' ? data.credits : 0;
          const newSubscription: SubscriptionTier =
            (data.subscription as SubscriptionTier) || 'free';
          setCredits(newCredits);
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  credits: newCredits,
                  role: data.role || prev.role,
                  subscription: newSubscription,
                }
              : null,
          );
        }
      },
      (err) => {
        if (!isCurrentAuth(generation, firebaseUser)) return;
        // Non-fatal — user keeps working with last known credits
        console.warn('[auth] Firestore snapshot listener error:', err);
      },
    );

    return () => unsubscribe();
  }, [firebaseUser, isDemoMode, isCurrentAuth]);

  // ---------------------------------------------------------------------------
  // Analyst profile: live subscription so onboarding/settings edits reshape the
  // shell, dashboard recommendations, and guards without a page reload.
  // Stays null on logout or legacy sample state.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isDemoMode) { setAnalystProfile(null); return; }
    if (!firebaseUser?.uid) { setAnalystProfile(null); return; }
    const generation = authGenerationRef.current;
    const profileRef = doc(db, 'users', firebaseUser.uid, 'profile', 'analyst');
    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (!isCurrentAuth(generation, firebaseUser)) return;
        if (!snapshot.exists()) {
          setAnalystProfile(null);
          return;
        }
        const parsed = AnalystProfileSchema.safeParse(snapshot.data());
        setAnalystProfile(parsed.success ? parsed.data : null);
      },
      (err) => {
        if (!isCurrentAuth(generation, firebaseUser)) return;
        console.warn('[auth] Analyst profile listener error:', err);
        setAnalystProfile(null);
      },
    );
    return () => unsubscribe();
  }, [firebaseUser, isDemoMode, isCurrentAuth]);

  // Email/password sign in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    // Set loading=true immediately so AppShell doesn't redirect to /login while
    // React hasn't yet re-rendered with the new user state from onAuthStateChanged.
    setLoading(true);
    setAuthError(null);
    logoutRequestedRef.current = false;
    cancelPendingSignup();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (logoutRequestedRef.current || auth.currentUser?.uid !== cred.user.uid) return { success: false, error: 'Sign-in was cancelled.' };
      const generation = observeAuthIdentity(cred.user);
      // Sync cookie before returning so middleware sees the token when router.push fires.
      const synced = await syncTokenCookie(cred.user, generation);
      if (!isCurrentAuth(generation, cred.user)) return { success: false, error: 'Sign-in was cancelled.' };
      if (!synced) {
        setLoading(false);
        return { success: false, error: 'Session initialization failed. Please try again.' };
      }
      // onAuthStateChanged will call setLoading(false) once it finishes.
      return { success: true };
    } catch (err: unknown) {
      setLoading(false); // Reset on error — onAuthStateChanged won't fire
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        return { success: false, error: 'Invalid email or password.' };
      }
      if (code === 'auth/wrong-password') {
        return { success: false, error: 'Incorrect password.' };
      }
      if (code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many attempts. Please try again later or reset your password.' };
      }
      if (code === 'auth/user-disabled') {
        return { success: false, error: 'This account has been disabled. Contact support.' };
      }
      if (code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error — could not reach authentication servers. Check your connection.' };
      }
      if (code === 'auth/operation-not-allowed') {
        return { success: false, error: 'Email/password sign-in is not enabled. Please contact support.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email address.' };
      }
      console.error('[auth] signInWithEmail unhandled error:', code, err);
      return { success: false, error: `Sign-in failed (${code || 'unknown'}). Please try again or use Google sign-in.` };
    }
  }, [syncTokenCookie, observeAuthIdentity, isCurrentAuth, cancelPendingSignup]);

  // Email/password sign up
  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setAuthError(null);
    logoutRequestedRef.current = false;
    cancelPendingSignup();
    let finishProfile!: (ready: boolean) => void;
    const ready = new Promise<boolean>((resolve) => { finishProfile = resolve; });
    const signup = { uid: null as string | null, ready, finish: finishProfile, cancelled: false };
    signupProfileReadyRef.current = signup;
    const cancelledResult = { success: false, error: 'Sign-up was cancelled.' };
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (signup.cancelled) return cancelledResult;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      signup.uid = cred.user.uid;
      if (signup.cancelled || logoutRequestedRef.current || auth.currentUser?.uid !== cred.user.uid) return cancelledResult;
      const generation = observeAuthIdentity(cred.user);
      await updateProfile(cred.user, { displayName: name });
      if (signup.cancelled || !isCurrentAuth(generation, cred.user)) return cancelledResult;
      // Profile writes do not guarantee that the cached ID token has fresh claims.
      await cred.user.getIdToken(true);
      if (signup.cancelled || !isCurrentAuth(generation, cred.user)) return cancelledResult;
      finishProfile(true);
      // Account creation succeeds even if email delivery is temporarily down.
      // Email verification is required separately for privileged operations.
      await sendEmailVerification(cred.user).catch(() => {
        if (isCurrentAuth(generation, cred.user)) setAuthError('Your account was created, but the verification email could not be sent. You can still sign in.');
      });
      if (signup.cancelled || !isCurrentAuth(generation, cred.user)) return cancelledResult;
      const synced = await syncTokenCookie(cred.user, generation);
      if (!isCurrentAuth(generation, cred.user)) return cancelledResult;
      if (!synced) {
        setLoading(false);
        return { success: false, error: 'Session initialization failed. Please try again.' };
      }
      return { success: true };
    } catch (err: unknown) {
      if (signup.cancelled) return cancelledResult;
      setLoading(false);
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists. Sign in instead.' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error — could not reach authentication servers. Check your connection.' };
      }
      if (code === 'auth/operation-not-allowed') {
        return { success: false, error: 'Email/password sign-in is not enabled. Please contact support.' };
      }
      console.error('[auth] signUpWithEmail unhandled error:', code, err);
      return { success: false, error: `Sign-up failed (${code || 'unknown'}). Please try again or use Google sign-in.` };
    } finally {
      finishProfile(false);
      if (signupProfileReadyRef.current === signup) signupProfileReadyRef.current = null;
    }
  }, [syncTokenCookie, observeAuthIdentity, isCurrentAuth, cancelPendingSignup]);

  // Google sign in: Firebase recommends popup or redirect. Popup keeps the user
  // on praxis.tacitus.me; redirect is retained as the browser-blocker fallback.
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    logoutRequestedRef.current = false;
    cancelPendingSignup();
    const provider = googleProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithPopup(auth, provider);
      if (logoutRequestedRef.current || auth.currentUser?.uid !== cred.user.uid) return { success: false, error: 'Sign-in was cancelled.' };
      const generation = observeAuthIdentity(cred.user);
      const synced = await syncTokenCookie(cred.user, generation);
      if (!isCurrentAuth(generation, cred.user)) return { success: false, error: 'Sign-in was cancelled.' };
      if (!synced) {
        setLoading(false);
        return { success: false, error: 'Google sign-in succeeded, but PRAXIS could not initialize the secure app session. Please try again.' };
      }
      return { success: true };
    } catch (err: unknown) {
      const code = firebaseAuthErrorCode(err);
      if (isPopupFallbackError(code)) {
        try {
          await signInWithRedirect(auth, provider);
          return { success: true };
        } catch (redirectErr: unknown) {
          setLoading(false);
          const redirectCode = firebaseAuthErrorCode(redirectErr);
          console.error('[auth] Google redirect fallback error:', redirectCode, redirectErr);
          return { success: false, error: describeGoogleAuthError(redirectCode) };
        }
      }
      setLoading(false);
      console.error('[auth] Google sign-in error:', code, err);
      return { success: false, error: describeGoogleAuthError(code) };
    }
  }, [syncTokenCookie, observeAuthIdentity, isCurrentAuth, cancelPendingSignup]);

  // Legacy sample entry point retained for UI compatibility; sample sessions are retired.
  const signInAsDemo = useCallback(async () => {
    setAuthError(null);
    await fetch('/api/auth/session', { method: 'DELETE' });
    setUser(null);
    setFirebaseUser(null);
    setCredits(0);
    setIsDemoMode(false);
    setAnalystProfile(null);
    setLoading(false);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    logoutRequestedRef.current = true;
    serverSessionRecoveryRef.current = false;
    const generation = ++authGenerationRef.current;
    activeUidRef.current = null;
    cancelPendingSignup();
    cancelAuthRequests();
    setUser(null);
    setFirebaseUser(null);
    setCredits(0);
    setAnalystProfile(null);
    setLoading(false);
    setIsDemoMode(false);
    setAuthError(null);
    const request = new AbortController();
    sessionRequestsRef.current.add(request);
    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
      if (generation !== authGenerationRef.current || !logoutRequestedRef.current) return;
      await fetch('/api/auth/session', { method: 'DELETE', signal: request.signal });
    } catch (err) {
      if (generation !== authGenerationRef.current || !logoutRequestedRef.current) return;
      console.error('[auth] Logout error:', err);
    } finally {
      sessionRequestsRef.current.delete(request);
    }
  }, [cancelPendingSignup, cancelAuthRequests]);

  // Refresh credits from Firestore
  const refreshCredits = useCallback(async () => {
    if (!firebaseUser) return;
    const generation = authGenerationRef.current;
    try {
      const { getUserProfile } = await import('@/lib/firebase/firestore');
      if (!isCurrentAuth(generation, firebaseUser)) return;
      const profile = await getUserProfile(firebaseUser.uid);
      if (!isCurrentAuth(generation, firebaseUser)) return;
      if (profile) {
        setCredits(profile.credits);
        setUser((prev) => prev ? { ...prev, credits: profile.credits } : null);
      }
    } catch (err) {
      if (!isCurrentAuth(generation, firebaseUser)) return;
      console.warn('[auth] Failed to refresh credits:', err);
    }
  }, [firebaseUser, isCurrentAuth]);

  // Send password reset email
  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        // Don't reveal whether the email exists — return success to prevent enumeration
        return { success: true };
      }
      if (code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many requests. Please wait a moment before trying again.' };
      }
      if (code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error — could not reach authentication servers.' };
      }
      console.error('[auth] resetPassword unhandled error:', code, err);
      return { success: false, error: 'Failed to send reset email. Please try again.' };
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const onboardingComplete = isOnboardingComplete(analystProfile);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    firebaseUser,
    loading,
    credits,
    analystProfile,
    onboardingComplete,
    authError,
    clearAuthError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsDemo,
    logout,
    refreshCredits,
    resetPassword,
  }), [
    user,
    firebaseUser,
    loading,
    credits,
    analystProfile,
    onboardingComplete,
    authError,
    clearAuthError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsDemo,
    logout,
    refreshCredits,
    resetPassword,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
