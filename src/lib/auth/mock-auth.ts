'use server';

import { cookies } from 'next/headers';

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'PRAXIS2026';

const DEMO_USER = {
  id: 'demo-user-001',
  email: 'analyst@tacitus.demo',
  name: 'Demo Analyst',
  role: 'senior',
  orgId: 'org-demo-001',
  orgName: 'TACITUS Demo Organization',
  isDemo: false,
};

const AUTH_COOKIE = 'tacitus-auth-session';

export async function signIn(email: string, password?: string) {
  if (password && password !== DEMO_PASSWORD) {
    return null;
  }

  const cookieStore = await cookies();
  const user = {
    ...DEMO_USER,
    email: email || DEMO_USER.email,
    name: email ? email.split('@')[0] : DEMO_USER.name,
    isDemo: false,
  };
  cookieStore.set(AUTH_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  return user;
}

export async function signInDemo() {
  const cookieStore = await cookies();
  const user = {
    ...DEMO_USER,
    isDemo: true,
  };
  cookieStore.set(AUTH_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  return user;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(AUTH_COOKIE);
  if (!session?.value) return null;
  try {
    return JSON.parse(session.value) as AuthUser;
  } catch {
    return null;
  }
}

export type AuthUser = typeof DEMO_USER;
