import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyIdToken, adminDb } from '@/lib/firebase/admin';
import { verifyCookie } from '@/lib/auth/cookie-signer';
import { shouldBypassMinuteRateLimit } from '@/lib/billing/usage-policy';
import { logApiCall } from '@/lib/observability/logger';
import { authenticationFailure } from '@/lib/auth/session-failure';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  isDemo: boolean;
}

interface AuthSessionPayload {
  demo?: boolean;
  token?: string;
}

export const RATE_LIMIT = 300;

/**
 * Firestore-backed rate limiter using 1-minute window buckets.
 * Works across serverless instances (unlike in-memory Map).
 * Fails open (allows request) if Firestore is unavailable.
 */
async function checkRateLimit(uid: string): Promise<boolean> {
  const windowKey = Math.floor(Date.now() / 60_000).toString();

  try {
    const docRef = adminDb.collection('rate_limits').doc(`${uid}_${windowKey}`);
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
): (req: Request) => Promise<Response>;
export function withAuth<TContext>(
  handler: (req: Request, user: AuthenticatedUser, context: TContext) => Promise<Response>
): (req: Request, context: TContext) => Promise<Response>;
export function withAuth<TContext>(
  handler: (req: Request, user: AuthenticatedUser, context: TContext) => Promise<Response>
) {
  return async (req: Request, context?: TContext) => {
    const ctx = context as TContext;
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

      let sessionData: AuthSessionPayload;
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

      // Sample mode — still rate-limited to prevent abuse
      if (sessionData.demo === true) {
        if (req.method !== 'GET') {
          status = 403;
          return NextResponse.json({ error: 'This sample is read-only. Sign in to ask questions or save work.', code: 'sample_read_only' }, { status: 403 });
        }
        const demoUser: AuthenticatedUser = {
          uid: 'demo-user-001',
          email: 'analyst@tacitus.demo',
          name: 'Demo Analyst',
          isDemo: true,
        };
        userUid = demoUser.uid;
        if (!(await checkRateLimit(demoUser.uid))) {
          status = 429;
          return minuteRateLimitResponse();
        }
        const response = await handler(req, demoUser, ctx);
        status = response.status;
        return response;
      }

      // Firebase authenticated user
      if (sessionData.token) {
        let user: AuthenticatedUser;
        try {
          const verified = await verifyIdToken(sessionData.token);
          user = { ...verified, isDemo: false };
        } catch (error) {
          const response = authenticationFailure(error);
          status = response.status;
          return response;
        }
        userUid = user.uid;
        try {
          // Admin SDK bypasses client rules, so enforce the same deletion state
          // before any analysis/write handler. Only cleanup reads/retries remain.
          const account = await adminDb.collection('users').doc(user.uid).get();
          const deletionState = account.data()?.accountDeletionStatus;
          const cleanupRequest = route === '/api/account' && ['GET', 'DELETE'].includes(req.method);
          if ((deletionState === 'deleting' || deletionState === 'deleted') && !cleanupRequest) {
            status = 409;
            return NextResponse.json({ error: 'Account cleanup is in progress. Open account settings to finish deletion.', code: 'account_deleting' }, { status: 409 });
          }
        } catch {
          status = 503;
          return NextResponse.json({ error: 'Account verification is temporarily unavailable. Please try again.', code: 'account_verification_unavailable' }, { status: 503 });
        }
        if (!shouldBypassMinuteRateLimit(user) && !(await checkRateLimit(user.uid))) {
          status = 429;
          return minuteRateLimitResponse();
        }
        // Operation failures are handled once by the outer catch, never retried
        // as an authentication fallback after partial writes.
        const response = await handler(req, user, ctx);
        status = response.status;
        return response;
      }

      status = 401;
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    } catch (err) {
      errorMsg = err instanceof Error ? err.name : 'RouteError';
      status = 500;
      return NextResponse.json({ error: 'Request failed. Please try again.', code: 'request_failed' }, { status: 500 });
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

function minuteRateLimitResponse(): Response {
  return NextResponse.json({
    error: 'Minute rate limit exceeded',
    code: 'minute_rate_limit',
    message: 'Too many requests in one minute. Wait briefly and try again.',
  }, { status: 429 });
}
