import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyIdToken, adminDb } from '@/lib/firebase/admin';
import { verifyCookie } from '@/lib/auth/cookie-signer';
import { logApiCall } from '@/lib/observability/logger';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  isDemo: boolean;
}

const RATE_LIMIT = 100;

/**
 * Firestore-backed rate limiter using 1-minute window buckets.
 * Works across serverless instances (unlike in-memory Map).
 * Fails open (allows request) if Firestore is unavailable.
 */
async function checkRateLimit(uid: string): Promise<boolean> {
  const windowKey = Math.floor(Date.now() / 60_000).toString();
  const docRef = adminDb.collection('rate_limits').doc(`${uid}_${windowKey}`);

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      const current = doc.exists ? (doc.data()?.count ?? 0) : 0;
      if (current >= RATE_LIMIT) return false;
      tx.set(docRef, { count: current + 1, uid, expiresAt: Date.now() + 120_000 }, { merge: true });
      return true;
    });
    return result;
  } catch {
    // If Firestore fails, allow the request (fail open for availability)
    return true;
  }
}

export function withAuth(
  handler: (req: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return async (req: Request) => {
    const start = Date.now();
    const url = new URL(req.url);
    const route = url.pathname;
    let userUid = 'anonymous';
    let status = 500;
    let errorMsg: string | undefined;

    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('tacitus-auth-session');

      if (!sessionCookie?.value) {
        status = 401;
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      let sessionData;
      try {
        const verified = verifyCookie(sessionCookie.value);
        if (!verified) {
          status = 401;
          return NextResponse.json({ error: 'Invalid session signature' }, { status: 401 });
        }
        sessionData = JSON.parse(verified);
      } catch {
        status = 401;
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }

      // Demo mode — still rate-limited to prevent abuse
      if (sessionData.demo === true) {
        const demoUser: AuthenticatedUser = {
          uid: 'demo-user-001',
          email: 'analyst@tacitus.demo',
          name: 'Demo Analyst',
          isDemo: true,
        };
        userUid = demoUser.uid;
        if (!(await checkRateLimit(demoUser.uid))) {
          status = 429;
          return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
        const response = await handler(req, demoUser);
        status = response.status;
        return response;
      }

      // Firebase authenticated user
      if (sessionData.token) {
        try {
          const verified = await verifyIdToken(sessionData.token);
          const user: AuthenticatedUser = { ...verified, isDemo: false };
          userUid = user.uid;

          if (!(await checkRateLimit(user.uid))) {
            status = 429;
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
          }

          const response = await handler(req, user);
          status = response.status;
          return response;
        } catch {
          status = 401;
          return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
        }
      }

      status = 401;
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
      status = 500;
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    } finally {
      logApiCall({
        route,
        uid: userUid,
        latencyMs: Date.now() - start,
        status,
        error: errorMsg,
      });
    }
  };
}
