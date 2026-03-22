import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'tacitus-auth-session';

/**
 * POST — Legacy login endpoint.
 * Now only handles demo mode login. Firebase Auth is handled client-side.
 */
export async function POST(request: Request) {
  try {
    const { isDemo } = await request.json();

    if (isDemo === true) {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, JSON.stringify({ demo: true }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      return NextResponse.json({
        success: true,
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

    return NextResponse.json(
      { error: 'Use Firebase Auth for authentication.', success: false },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 400 }
    );
  }
}
