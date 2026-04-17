import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'tacitus-auth-session';

/**
 * Edge-compatible session parser for routing decisions only.
 * Middleware runs on Edge runtime where Node.js `crypto` is unavailable.
 * Full HMAC signature verification happens in with-auth.ts (Node.js API handlers).
 *
 * Signed cookie format: JSON_PAYLOAD.HMAC_SIGNATURE
 * We extract the JSON payload before the last dot for routing decisions.
 * A forged cookie that gets past this check will still fail in with-auth.ts.
 */
function parseSessionForRouting(cookieValue: string): { demo?: boolean; token?: string } | null {
  try {
    // Signed format: JSON.SIGNATURE — extract JSON before last dot
    const idx = cookieValue.lastIndexOf('.');
    const jsonPart = idx !== -1 ? cookieValue.slice(0, idx) : cookieValue;
    const parsed = JSON.parse(jsonPart);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as { demo?: boolean; token?: string };
    }
    return null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE);

  const sessionData = session?.value ? parseSessionForRouting(session.value) : null;

  const isDemo = sessionData?.demo === true;
  const hasFirebaseToken = !!sessionData?.token;

  // --- /demo/* routes: require demo session cookie ---
  if (pathname.startsWith('/demo')) {
    if (!sessionData) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('mode', 'demo');
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    // Rewrite demo URLs to the canonical /app/$ROUTE page when one exists.
    // Demo-specific pages (e.g. /demo, /demo/deep-search-agent) are kept under
    // src/app/demo/ and are NOT rewritten.
    const demoSpecificRoutes = new Set([
      '/demo',
      '/demo/deep-search-agent',
    ]);
    if (!demoSpecificRoutes.has(pathname)) {
      const appPath = pathname.replace(/^\/demo/, '/app');
      const url = request.nextUrl.clone();
      url.pathname = appPath;
      return addSecurityHeaders(NextResponse.rewrite(url));
    }

    return addSecurityHeaders(NextResponse.next());
  }

  // --- /app/* routes: require Firebase JWT, reject demo users ---
  if (pathname.startsWith('/app')) {
    if (isDemo) {
      // Demo users cannot access the real app
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/demo/dashboard', request.url))
      );
    }
    if (!hasFirebaseToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // COOP: same-origin-allow-popups is required for Google Sign-In redirect flow
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // CSP: Google Identity Services needs *.google.com and *.gstatic.com.
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' apis.google.com *.firebaseapp.com *.googleapis.com *.google.com *.gstatic.com www.googletagmanager.com; " +
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
    "img-src 'self' data: blob: *.googleapis.com *.googleusercontent.com *.gstatic.com; " +
    "font-src 'self' fonts.gstatic.com; " +
    "connect-src 'self' *.firebaseio.com *.googleapis.com *.firebaseapp.com identitytoolkit.googleapis.com securetoken.googleapis.com api.acleddata.com api.gdeltproject.org api.reliefweb.int hapi.humdata.org api.worldbank.org *.firecrawl.dev api.parallel.ai js.stripe.com wss://*.firebaseio.com www.google-analytics.com *.google-analytics.com www.googletagmanager.com; " +
    "frame-src 'self' *.firebaseapp.com accounts.google.com *.google.com js.stripe.com;"
  );

  return response;
}

export const config = {
  matcher: ['/demo/:path*', '/app/:path*', '/login', '/pricing'],
};
