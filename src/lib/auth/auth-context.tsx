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
  GoogleAuthProvider,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

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
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshCredits: () => Promise<void>;
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
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signInWithGoogle: async () => ({ success: false }),
  signInAsDemo: async () => {},
  logout: async () => {},
  refreshCredits: async () => {},
});

// ---------------------------------------------------------------------------
// Helper: create AuthUser from Firebase user (no Firestore dependency)
// ---------------------------------------------------------------------------

function fbUserToAuthUser(fbUser: FirebaseUser, credits = 100): AuthUser {
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

  // Sync auth token to a cookie so the Next.js middleware can check it
  const syncTokenCookie = useCallback(async (fbUser: FirebaseUser | null) => {
    try {
      if (fbUser) {
        const token = await fbUser.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } else if (!isDemoMode) {
        await fetch('/api/auth/session', { method: 'DELETE' });
      }
    } catch (err) {
      console.error('[auth] Cookie sync failed:', err);
    }
  }, [isDemoMode]);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // First: set the user immediately from Firebase Auth data (no Firestore dependency)
        const authUser = fbUserToAuthUser(fbUser);
        setUser(authUser);
        setFirebaseUser(fbUser);
        setCredits(100);
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

          // Send welcome email for brand-new users (credits === 100 means just created)
          if (profile.credits === 100 && profile.totalCreditsUsed === 0) {
            fetch('/api/email/welcome', { method: 'POST' }).catch(() => {});
          }
        } catch (err) {
          // Firestore failed — that's OK, user is still logged in with defaults
          console.warn('[auth] Firestore profile load failed (using defaults):', err);
        }
      } else if (!isDemoMode) {
        setUser(null);
        setFirebaseUser(null);
        setCredits(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncTokenCookie, isDemoMode]);

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

  // Email/password sign in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    // Set loading=true immediately so AppShell doesn't redirect to /login while
    // React hasn't yet re-rendered with the new user state from onAuthStateChanged.
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Sync cookie before returning so middleware sees the token when router.push fires.
      // onAuthStateChanged will call setLoading(false) once it finishes.
      await syncTokenCookie(cred.user);
      return { success: true };
    } catch (err: unknown) {
      setLoading(false); // Reset on error — onAuthStateChanged won't fire
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        return { success: false, error: 'Invalid email or password.' };
      }
      if (code === 'auth/wrong-password') {
        return { success: false, error: 'Invalid password.' };
      }
      if (code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }
      return { success: false, error: 'Authentication failed. Please try again.' };
    }
  }, [syncTokenCookie]);

  // Email/password sign up
  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await syncTokenCookie(cred.user);
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
      return { success: false, error: 'Sign up failed. Please try again.' };
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

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        credits,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemo,
        logout,
        refreshCredits,
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
