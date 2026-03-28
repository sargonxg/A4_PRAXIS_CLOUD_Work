import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';

const SESSION_COOKIE = 'tacitus-auth-session';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
};

/**
 * POST — Sets the auth session cookie.
 * Accepts either a Firebase ID token (verified server-side) or a demo flag.
 * Validates origin to prevent CSRF attacks.
 */
export async function POST(request: Request) {
  try {
    // CSRF protection: validate same-origin
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
    }

    const body = await request.json();
    const cookieStore = await cookies();

    if (body.demo === true) {
      // Demo mode session
      cookieStore.set(SESSION_COOKIE, JSON.stringify({ demo: true }), COOKIE_OPTIONS);
      return NextResponse.json({ success: true });
    }

    if (body.token && typeof body.token === 'string') {
      // Verify the Firebase ID token before storing it
      try {
        const verified = await verifyIdToken(body.token);
        if (!verified.uid) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
      }

      // Token is valid — store in cookie for subsequent requests
      cookieStore.set(
        SESSION_COOKIE,
        JSON.stringify({ token: body.token }),
        COOKIE_OPTIONS,
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing token or demo flag' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 });
  }
}

/**
 * GET — Returns current session status.
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  if (!session?.value) {
    return NextResponse.json({ user: null });
  }

  try {
    const data = JSON.parse(session.value);
    if (data.demo) {
      return NextResponse.json({
        user: {
          id: 'demo-user-001',
          email: 'analyst@tacitus.demo',
          name: 'Demo Analyst',
          role: 'senior',
          orgId: 'org-demo-001',
          orgName: 'TACITUS Demo Organization',
          isDemo: true,
        },
      });
    }
    // For Firebase sessions, the client manages the user state.
    // We just confirm a session exists.
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ user: null });
  }
}

/**
 * DELETE — Clears the auth session cookie.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
