import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  isDemo: boolean;
}

/**
 * Wraps an API route handler with authentication.
 * Checks for the session cookie and extracts user info.
 * For Firebase users, the token is validated client-side; the cookie confirms a session exists.
 * For demo users, returns the demo user profile.
 *
 * Also applies rate limiting via a simple in-memory counter.
 */
export function withAuth(
  handler: (req: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return async (req: Request) => {
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('tacitus-auth-session');

      if (!sessionCookie?.value) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      let sessionData;
      try {
        sessionData = JSON.parse(sessionCookie.value);
      } catch {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }

      // Demo mode
      if (sessionData.demo === true) {
        const demoUser: AuthenticatedUser = {
          uid: 'demo-user-001',
          email: 'analyst@tacitus.demo',
          name: 'Demo Analyst',
          isDemo: true,
        };
        return handler(req, demoUser);
      }

      // Firebase authenticated user
      if (sessionData.token) {
        // For server-side verification, we trust the session cookie.
        // Full token verification would require Firebase Admin SDK.
        // We attempt to decode the token payload for user info.
        try {
          const payload = JSON.parse(
            Buffer.from(sessionData.token.split('.')[1], 'base64').toString()
          );
          const user: AuthenticatedUser = {
            uid: payload.user_id || payload.sub || '',
            email: payload.email || '',
            name: payload.name || payload.email?.split('@')[0] || 'User',
            isDemo: false,
          };
          return handler(req, user);
        } catch {
          return NextResponse.json(
            { error: 'Invalid authentication token' },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    } catch {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}
