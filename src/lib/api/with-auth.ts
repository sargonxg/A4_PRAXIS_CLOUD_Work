import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  isDemo: boolean;
}

// In-memory rate limiter with periodic garbage collection
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;
const GC_INTERVAL_MS = 5 * 60_000; // Clean up every 5 minutes
let lastGc = Date.now();

function checkRateLimit(uid: string): boolean {
  const now = Date.now();

  // Periodic garbage collection — remove expired entries
  if (now - lastGc > GC_INTERVAL_MS) {
    lastGc = now;
    for (const [key, entry] of rateLimitMap) {
      if (now - entry.windowStart > RATE_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(uid);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(uid, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

export function withAuth(
  handler: (req: Request, user: AuthenticatedUser) => Promise<Response>
) {
  return async (req: Request) => {
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('tacitus-auth-session');

      if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      let sessionData;
      try {
        sessionData = JSON.parse(sessionCookie.value);
      } catch {
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
        if (!checkRateLimit(demoUser.uid)) {
          return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
        return handler(req, demoUser);
      }

      // Firebase authenticated user
      if (sessionData.token) {
        try {
          const verified = await verifyIdToken(sessionData.token);
          const user: AuthenticatedUser = { ...verified, isDemo: false };

          if (!checkRateLimit(user.uid)) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
          }

          return handler(req, user);
        } catch {
          return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
        }
      }

      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    } catch {
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }
  };
}
