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

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
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
        if (firebaseAuthDoneRef.current) {
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Sync auth token to a cookie so the Next.js middleware can check it.
  // Returns true if the cookie was successfully set, false otherwise.
  const syncTokenCookie = useCallback(async (fbUser: FirebaseUser | null): Promise<boolean> => {
    try {
      if (fbUser) {
        const result = await syncFirebaseSession(fbUser);
        if (result === 'invalid') {
          setUser(null);
          setFirebaseUser(null);
          setCredits(0);
          setAnalystProfile(null);
          setAuthError('Your session is no longer valid. Please sign in again.');
          await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
          await firebaseSignOut(auth).catch(() => {});
        } else if (result === 'unavailable') {
          setAuthError('PRAXIS could not verify your session right now. Please try again.');
        }
        return result === 'ready';
      } else if (!isDemoMode) {
        await fetch('/api/auth/session', { method: 'DELETE' });
      }
      return true;
    } catch (err) {
      console.error('[auth] Cookie sync failed:', err);
      return false;
    }
  }, [isDemoMode]);

  // Listen to Firebase auth state.
  // Use a ref for the legacy sample flag to avoid re-subscribing on session
  // cleanup.
  const isDemoModeRef = useRef(isDemoMode);
  isDemoModeRef.current = isDemoMode;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const authUser = fbUserToAuthUser(fbUser);
        setIsDemoMode(false);

        // First: sync the session cookie required by middleware. If this fails,
        // do not expose an authenticated app state; otherwise /login can push
        // to /app while middleware immediately bounces back to /login.
        const synced = await syncTokenCookie(fbUser);
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
        setAuthError(null);
        setUser(authUser);
        setCredits(0);

        // Hydrate the profile already initialized by the verified session API.
        try {
          const { ensureUserProfile } = await import('@/lib/firebase/firestore');
          const profile = await loadProfileAfterAuthReady(fbUser, () =>
            ensureUserProfile({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
            }),
          );
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
          // Firestore failed — that's OK, user is still logged in with defaults
          console.warn('[auth] Firestore profile load failed (using defaults):', err);
        }
        setFirebaseUser(fbUser);
      } else if (!isDemoModeRef.current) {
        const sessionUser = await serverSessionToAuthUser();
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
      firebaseAuthDoneRef.current = true;
      // If a Firebase user was found, we can set loading=false immediately.
      // If no Firebase user, only set loading=false after the demo check has
      // also completed — otherwise AppShell sees user=null too early.
      if (fbUser || demoCheckDoneRef.current) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncTokenCookie]);

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
        const synced = await syncTokenCookie(redirectResult.user);
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
  }, [syncTokenCookie]);

  // ---------------------------------------------------------------------------
  // Token refresh: listen for token changes AND proactively refresh before expiry
  // Firebase ID tokens expire after 1 hour. This ensures the session cookie
  // always has a valid token, preventing 401s on long-lived sessions.
  // ---------------------------------------------------------------------------
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // onIdTokenChanged fires when:
    // 1. User signs in/out
    // 2. Token is refreshed (automatic or manual)
    // 3. Custom claims change
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Sync the fresh token to the session cookie
        await syncTokenCookie(fbUser);

        // Schedule a proactive refresh 5 minutes before expiry
        // Firebase tokens expire in 3600s. Refresh at 50 minutes.
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(async () => {
          try {
            // Force-refresh the token — Firebase SDK handles the refresh call
            await fbUser.getIdToken(true);
            // onIdTokenChanged will fire again with the new token
          } catch (err) {
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
  }, [syncTokenCookie]);

  // ---------------------------------------------------------------------------
  // Real-time credit sync: listen for Firestore profile changes so credits
  // update instantly after Polar payments, AI usage, or admin adjustments.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!firebaseUser || isDemoMode) return;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
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
        // Non-fatal — user keeps working with last known credits
        console.warn('[auth] Firestore snapshot listener error:', err);
      },
    );

    return () => unsubscribe();
  }, [firebaseUser, isDemoMode]);

  // ---------------------------------------------------------------------------
  // Analyst profile: live subscription so onboarding/settings edits reshape the
  // shell, dashboard recommendations, and guards without a page reload.
  // Stays null on logout or legacy sample state.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isDemoMode) { setAnalystProfile(null); return; }
    if (!firebaseUser?.uid) { setAnalystProfile(null); return; }
    const profileRef = doc(db, 'users', firebaseUser.uid, 'profile', 'analyst');
    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setAnalystProfile(null);
          return;
        }
        const parsed = AnalystProfileSchema.safeParse(snapshot.data());
        setAnalystProfile(parsed.success ? parsed.data : null);
      },
      (err) => {
        console.warn('[auth] Analyst profile listener error:', err);
        setAnalystProfile(null);
      },
    );
    return () => unsubscribe();
  }, [firebaseUser?.uid, isDemoMode]);

  // Email/password sign in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    // Set loading=true immediately so AppShell doesn't redirect to /login while
    // React hasn't yet re-rendered with the new user state from onAuthStateChanged.
    setLoading(true);
    setAuthError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Sync cookie before returning so middleware sees the token when router.push fires.
      const synced = await syncTokenCookie(cred.user);
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
  }, [syncTokenCookie]);

  // Email/password sign up
  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // Account creation succeeds even if email delivery is temporarily down.
      // Email verification is required separately for privileged operations.
      await sendEmailVerification(cred.user).catch(() => {
        setAuthError('Your account was created, but the verification email could not be sent. You can still sign in.');
      });
      const synced = await syncTokenCookie(cred.user);
      if (!synced) {
        setLoading(false);
        return { success: false, error: 'Session initialization failed. Please try again.' };
      }
      return { success: true };
    } catch (err: unknown) {
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
    }
  }, [syncTokenCookie]);

  // Google sign in: Firebase recommends popup or redirect. Popup keeps the user
  // on praxis.tacitus.me; redirect is retained as the browser-blocker fallback.
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    const provider = googleProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithPopup(auth, provider);
      const synced = await syncTokenCookie(cred.user);
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
  }, [syncTokenCookie]);

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
    try {
      if (firebaseUser) {
        await firebaseSignOut(auth);
      }
      setUser(null);
      setFirebaseUser(null);
      setCredits(0);
      setIsDemoMode(false);
      setAuthError(null);
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (err) {
      console.error('[auth] Logout error:', err);
      // Force clear state even if signOut fails
      setUser(null);
      setFirebaseUser(null);
      setCredits(0);
      setIsDemoMode(false);
      setAuthError(null);
    }
  }, [firebaseUser]);

  // Refresh credits from Firestore
  const refreshCredits = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const { getUserProfile } = await import('@/lib/firebase/firestore');
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        setCredits(profile.credits);
        setUser((prev) => prev ? { ...prev, credits: profile.credits } : null);
      }
    } catch (err) {
      console.warn('[auth] Failed to refresh credits:', err);
    }
  }, [firebaseUser]);

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
