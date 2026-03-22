import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'tacitus-auth-session';

/**
 * POST — Sets the auth session cookie.
 * Accepts either a Firebase ID token or a demo flag.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();

    if (body.demo === true) {
      // Demo mode session
      cookieStore.set(SESSION_COOKIE, JSON.stringify({ demo: true }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      return NextResponse.json({ success: true });
    }

    if (body.token) {
      // Firebase auth session — store the token in a cookie
      // The middleware will check for the cookie's existence.
      // API routes that need verified auth will verify the token server-side.
      cookieStore.set(SESSION_COOKIE, JSON.stringify({ token: body.token }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
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
