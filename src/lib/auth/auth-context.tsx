'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import type { AnalystProfile } from '@/types/analyst-profile';

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
}

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  credits: number;
  analystProfile: AnalystProfile | null;
  onboardingComplete: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Demo user constant
// ---------------------------------------------------------------------------

const DEMO_USER: AuthUser = {
  id: 'demo-user-001',
  email: 'analyst@tacitus.demo',
  name: 'Demo Analyst',
  role: 'senior',
  orgId: 'org-demo-001',
  orgName: 'TACITUS Demo Organization',
  isDemo: true,
  credits: 999,
};

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
  };
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

  // ---------------------------------------------------------------------------
  // Restore demo session on mount / page refresh.
  // The demo cookie survives refreshes but the in-memory state does not.
  // Check the session endpoint to see if a demo cookie exists and restore it.
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
          setUser(DEMO_USER);
          setCredits(999);
          setIsDemoMode(true);
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
        let token = await fbUser.getIdToken();
        let res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        // If token verification failed (e.g. slightly stale token), retry once with a force-refreshed token
        if (!res.ok && res.status === 401) {
          console.warn('[auth] Cookie sync: token rejected (401), retrying with fresh token...');
          token = await fbUser.getIdToken(true);
          res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
        }

        if (!res.ok) {
          console.error('[auth] Cookie sync failed with status:', res.status);
          return false;
        }
        return true;
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
  // Use a ref for isDemoMode to avoid re-subscribing on demo toggle
  // (re-subscribing triggers an immediate onAuthStateChanged callback that
  // can flash user=null before the demo state is re-applied).
  const isDemoModeRef = useRef(isDemoMode);
  isDemoModeRef.current = isDemoMode;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // First: set the user immediately from Firebase Auth data (no Firestore dependency)
        const authUser = fbUserToAuthUser(fbUser);
        setUser(authUser);
        setFirebaseUser(fbUser);
        setCredits(0);
        setIsDemoMode(false);

        // Second: sync cookie (needed for middleware)
        await syncTokenCookie(fbUser);

        // Third: try to load/create Firestore profile (non-blocking)
        try {
          const { ensureUserProfile } = await import('@/lib/firebase/firestore');
          const profile = await ensureUserProfile({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
          });
          // Update with Firestore data (credits, role, org)
          setUser({
            ...authUser,
            role: profile.role,
            orgId: profile.orgId,
            orgName: profile.orgName,
            credits: profile.credits,
          });
          setCredits(profile.credits);

          // Send welcome email for brand-new users (0 credits used = never used the app)
          if (profile.totalCreditsUsed === 0) {
            fetch('/api/email/welcome', { method: 'POST' }).catch(() => {});
          }
        } catch (err) {
          // Firestore failed — that's OK, user is still logged in with defaults
          console.warn('[auth] Firestore profile load failed (using defaults):', err);
        }
      } else if (!isDemoModeRef.current) {
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
  // resolves the credential. onAuthStateChanged handles the user state update;
  // this effect only catches errors from the redirect flow.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    getRedirectResult(auth).catch((err: unknown) => {
      const code = (err as { code?: string }).code || '';
      console.error('[auth] Google redirect result error:', code, err);
    });
  }, []);

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
  // update instantly after Stripe payments, AI usage, or admin adjustments.
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
          setCredits(newCredits);
          setUser((prev) =>
            prev ? { ...prev, credits: newCredits, role: data.role || prev.role } : null,
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
  // Analyst profile: load once when the Firebase user changes.
  // Stays null on logout / demo mode — banner and card check this field.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!firebaseUser?.uid) { setAnalystProfile(null); return; }
    import('@/lib/firebase/analyst-profile-service')
      .then(({ loadAnalystProfile }) => loadAnalystProfile(firebaseUser.uid))
      .then(setAnalystProfile)
      .catch(() => setAnalystProfile(null));
  }, [firebaseUser?.uid]);

  // Email/password sign in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    // Set loading=true immediately so AppShell doesn't redirect to /login while
    // React hasn't yet re-rendered with the new user state from onAuthStateChanged.
    setLoading(true);
    try {
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
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
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

  // Google sign in — uses redirect flow to avoid COOP popup blocking
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
      // Page navigates to Google — this line is never reached
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/unauthorized-domain') {
        return { success: false, error: 'This domain is not authorized for Google sign-in. Please add it in Firebase Console > Authentication > Settings > Authorized domains.' };
      }
      console.error('[auth] Google sign-in error:', code, err);
      return { success: false, error: `Google sign-in failed (${code}). Please try again.` };
    }
  }, []);

  // Demo mode
  const signInAsDemo = useCallback(async () => {
    // Set demo cookie FIRST so middleware allows navigation
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo: true }),
    });
    setUser(DEMO_USER);
    setFirebaseUser(null);
    setCredits(999);
    setIsDemoMode(true);
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
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (err) {
      console.error('[auth] Logout error:', err);
      // Force clear state even if signOut fails
      setUser(null);
      setFirebaseUser(null);
      setCredits(0);
      setIsDemoMode(false);
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

  const onboardingComplete = Boolean(analystProfile?.meta?.completedAt);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        credits,
        analystProfile,
        onboardingComplete,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemo,
        logout,
        refreshCredits,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
