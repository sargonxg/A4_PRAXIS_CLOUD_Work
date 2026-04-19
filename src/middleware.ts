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
function parseSessionForRouting(cookieValue: string): { demo?: boolean; token?: string; onboarded?: boolean } | null {
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

/**
 * Generates a cryptographically random nonce for use in CSP headers.
 * Edge runtime exposes the Web Crypto API (crypto.getRandomValues) natively.
 */
function generateNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE);
  const nonce = generateNonce();

  const sessionData = session?.value ? parseSessionForRouting(session.value) : null;

  const isDemo = sessionData?.demo === true;
  const hasFirebaseToken = !!sessionData?.token;

  // --- /demo/* routes: require demo session cookie ---
  if (pathname.startsWith('/demo')) {
    if (!sessionData) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('mode', 'demo');
      return addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
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
      return addSecurityHeaders(NextResponse.rewrite(url), nonce);
    }

    return addSecurityHeaders(NextResponse.next(), nonce);
  }

  // --- /onboarding routes: requires Firebase auth, not available to demo users ---
  if (pathname.startsWith('/onboarding')) {
    if (isDemo) return addSecurityHeaders(NextResponse.redirect(new URL('/demo/dashboard', request.url)), nonce);
    if (!hasFirebaseToken) return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)), nonce);
    return addSecurityHeaders(NextResponse.next(), nonce);
  }

  // --- First-login redirect: send un-onboarded Firebase users to /onboarding before any /app/* page ---
  if (pathname.startsWith('/app') && hasFirebaseToken && sessionData?.onboarded === false && pathname !== '/onboarding') {
    return addSecurityHeaders(NextResponse.redirect(new URL('/onboarding', request.url)), nonce);
  }

  // --- /app/* routes: require Firebase JWT, reject demo users ---
  if (pathname.startsWith('/app')) {
    if (isDemo) {
      // Demo users cannot access the real app
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/demo/dashboard', request.url)),
        nonce
      );
    }
    if (!hasFirebaseToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
    }
    return addSecurityHeaders(NextResponse.next(), nonce);
  }

  return addSecurityHeaders(NextResponse.next(), nonce);
}

function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // COOP: same-origin-allow-popups is required for Google Sign-In redirect flow
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Expose nonce to Next.js App Router so its inline bootstrap scripts can use it.
  // Next.js reads the x-nonce response header and applies the nonce to its own
  // inline <script> tags automatically.
  // NOTE: If Firebase Auth popup fails with CSP errors, fall back to:
  // script-src 'self' 'unsafe-inline' ... (remove nonce + strict-dynamic)
  // and document the Firebase Auth script hashes needed for hash-based CSP.
  if (nonce) {
    response.headers.set('x-nonce', nonce);
  }

  // CSP: Google Identity Services needs *.google.com and *.gstatic.com.
  // script-src uses a per-request nonce + 'strict-dynamic' instead of 'unsafe-inline'.
  // 'strict-dynamic' propagates trust to scripts loaded by trusted (nonced) scripts,
  // which is required for Firebase Auth and Google Identity Services to work correctly.
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' apis.google.com *.firebaseapp.com *.googleapis.com *.google.com *.gstatic.com www.googletagmanager.com`
    : `'self' 'unsafe-inline' apis.google.com *.firebaseapp.com *.googleapis.com *.google.com *.gstatic.com www.googletagmanager.com`;

  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    `script-src ${scriptSrc}; ` +
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
    "img-src 'self' data: blob: *.googleapis.com *.googleusercontent.com *.gstatic.com; " +
    "font-src 'self' fonts.gstatic.com; " +
    "connect-src 'self' *.firebaseio.com *.googleapis.com *.firebaseapp.com identitytoolkit.googleapis.com securetoken.googleapis.com api.acleddata.com api.gdeltproject.org api.reliefweb.int hapi.humdata.org api.worldbank.org *.firecrawl.dev api.parallel.ai js.stripe.com wss://*.firebaseio.com www.google-analytics.com *.google-analytics.com www.googletagmanager.com; " +
    "frame-src 'self' *.firebaseapp.com accounts.google.com *.google.com js.stripe.com;"
  );

  return response;
}

export const config = {
  matcher: ['/demo/:path*', '/app/:path*', '/onboarding/:path*', '/onboarding', '/login', '/pricing'],
};
