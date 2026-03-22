'use server';

import { cookies } from 'next/headers';

const AUTH_COOKIE = 'tacitus-auth-session';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  orgName: string;
  isDemo?: boolean;
};

/**
 * @deprecated Use Firebase Auth via auth-context.tsx instead.
 * This file is kept for backward compatibility with server components
 * that still call getSession().
 */

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(AUTH_COOKIE);
  if (!session?.value) return null;

  try {
    const data = JSON.parse(session.value);

    // Demo session
    if (data.demo) {
      return {
        id: 'demo-user-001',
        email: 'analyst@tacitus.demo',
        name: 'Demo Analyst',
        role: 'senior',
        orgId: 'org-demo-001',
        orgName: 'TACITUS Demo Organization',
        isDemo: true,
      };
    }

    // Firebase token session — extract basic info from JWT payload
    if (data.token) {
      try {
        const payload = JSON.parse(
          Buffer.from(data.token.split('.')[1], 'base64').toString()
        );
        return {
          id: payload.user_id || payload.sub || '',
          email: payload.email || '',
          name: payload.name || payload.email?.split('@')[0] || 'User',
          role: 'analyst',
          orgId: 'org-default',
          orgName: 'TACITUS Platform',
          isDemo: false,
        };
      } catch {
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function signIn() {
  // Deprecated — handled by Firebase Auth client-side
  return null;
}

export async function signInDemo() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, JSON.stringify({ demo: true }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  return {
    id: 'demo-user-001',
    email: 'analyst@tacitus.demo',
    name: 'Demo Analyst',
    role: 'senior',
    orgId: 'org-demo-001',
    orgName: 'TACITUS Demo Organization',
    isDemo: true,
  };
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
