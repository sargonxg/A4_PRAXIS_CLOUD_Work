'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { ensureUserProfile, getUserProfile, type UserProfile } from '@/lib/firebase/firestore';

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
// Helper: convert Firebase user + Firestore profile to AuthUser
// ---------------------------------------------------------------------------

function toAuthUser(fbUser: FirebaseUser, profile: UserProfile): AuthUser {
  return {
    id: fbUser.uid,
    email: fbUser.email || profile.email,
    name: fbUser.displayName || profile.displayName,
    role: profile.role,
    orgId: profile.orgId,
    orgName: profile.orgName,
    isDemo: false,
    photoURL: fbUser.photoURL || profile.photoURL,
    credits: profile.credits,
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
  }, [isDemoMode]);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await ensureUserProfile({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
          });
          const authUser = toAuthUser(fbUser, profile);
          setUser(authUser);
          setFirebaseUser(fbUser);
          setCredits(profile.credits);
          setIsDemoMode(false);
          await syncTokenCookie(fbUser);
        } catch (err) {
          console.error('[auth] Failed to load user profile:', err);
          setUser(null);
          setFirebaseUser(null);
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

  // Email/password sign in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: unknown) {
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
  }, []);

  // Email/password sign up
  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists.' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }
      return { success: false, error: 'Sign up failed. Please try again.' };
    }
  }, []);

  // Google sign in
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in popup was closed.' };
      }
      return { success: false, error: 'Google sign-in failed. Please try again.' };
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
    }
  }, [firebaseUser]);

  // Refresh credits from Firestore
  const refreshCredits = useCallback(async () => {
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser.uid);
    if (profile) {
      setCredits(profile.credits);
      setUser((prev) => prev ? { ...prev, credits: profile.credits } : null);
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
