import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';
import { isUserOnboarded } from '@/lib/firebase/analyst-profile-admin';
import { signCookie, verifyCookie } from '@/lib/auth/cookie-signer';
import { getAdminPrincipalAccess } from '@/lib/auth/admin-gate';

const SESSION_COOKIE = 'tacitus-auth-session';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
};

function cookieOptionsForRequest(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = forwardedProto === 'https' || url.protocol === 'https:';
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
  return {
    ...BASE_COOKIE_OPTIONS,
    secure: process.env.NODE_ENV === 'production' ? !isLocalhost || isHttps : isHttps,
  };
}

/**
 * POST — Sets the auth session cookie.
 * Accepts either a Firebase ID token (verified server-side) or a demo flag.
 * Validates origin to prevent CSRF attacks.
 */
export async function POST(request: Request) {
  try {
    // CSRF protection: validate same-origin.
    // Use x-forwarded-host as fallback since reverse proxy may transform the host header.
    const origin = request.headers.get('origin');
    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host');

    if (origin && host) {
      let originHost: string;
      try {
        originHost = new URL(origin).host;
      } catch {
        console.error('[auth/session] Malformed origin header:', origin);
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
      if (originHost !== host) {
        console.error('[auth/session] CSRF: origin mismatch', { origin, originHost, host });
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
    }

    const body = await request.json();
    const cookieStore = await cookies();
    const cookieOptions = cookieOptionsForRequest(request);

    if (body.demo === true) {
      // Demo mode session
      cookieStore.set(SESSION_COOKIE, signCookie(JSON.stringify({ demo: true, onboarded: true, onboardingComplete: true })), cookieOptions);
      return NextResponse.json({ success: true });
    }

    if (body.token && typeof body.token === 'string') {
      // Verify the Firebase ID token before storing it
      let verifiedUser: Awaited<ReturnType<typeof verifyIdToken>>;
      try {
        const verified = await verifyIdToken(body.token);
        if (!verified.uid) {
          console.error('[auth/session] verifyIdToken returned no uid');
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        verifiedUser = verified;
        console.log('[auth/session] Token verified for uid:', verifiedUser.uid);
      } catch (err) {
        console.error('[auth/session] Token verification failed:', err instanceof Error ? err.message : String(err));
        return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
      }

      // Embed onboarded flag edge-safely in the cookie. Middleware cannot call
      // Firestore (Edge runtime), so we resolve it at login time. Source of truth:
      // users/{uid}/profile/analyst.meta.completedAt (with one-time legacy
      // mirroring from users/{uid}.onboardingCompletedAt for pre-merge users).
      let onboarded = false;
      try {
        onboarded = await isUserOnboarded(verifiedUser.uid);
      } catch (err) {
        console.warn('[auth/session] Could not resolve onboarded flag for uid:', verifiedUser.uid, err instanceof Error ? err.message : String(err));
      }

      const adminAccess = getAdminPrincipalAccess(verifiedUser);

      // Token is valid — store in cookie for subsequent requests (includes onboarded flag for middleware)
      cookieStore.set(
        SESSION_COOKIE,
        signCookie(JSON.stringify({
          token: body.token,
          onboarded,
          onboardingComplete: onboarded,
          issuedAt: Date.now(),
          user: {
            uid: verifiedUser.uid,
            email: verifiedUser.email,
            name: verifiedUser.name,
            emailVerified: verifiedUser.emailVerified,
          },
          admin: adminAccess.admin,
          adminReason: adminAccess.reason,
        })),
        cookieOptions,
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing token or demo flag' }, { status: 400 });
  } catch (err) {
    console.error('[auth/session] Unhandled error:', err instanceof Error ? err.message : String(err));
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
    const verified = verifyCookie(session.value);
    if (!verified) {
      return NextResponse.json({ user: null });
    }
    const data = JSON.parse(verified);
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
          onboardingComplete: true,
        },
      });
    }
    if (data.user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: data.user.uid,
          email: data.user.email,
          name: data.user.name,
          emailVerified: data.user.emailVerified === true,
          isDemo: false,
          admin: data.admin === true,
          onboardingComplete: data.onboardingComplete === true || data.onboarded === true,
        },
      });
    }
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
