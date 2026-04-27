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

/**
 * Build a NextResponse with:
 *   - x-nonce set on the REQUEST headers so Next.js auto-propagates the nonce
 *     to every inline bootstrap script it emits (required for strict-dynamic CSP)
 *   - x-nonce also set on the response headers so layouts/pages can read it via
 *     `headers().get('x-nonce')`
 *   - the full security-header suite applied
 *
 * This is the replacement for `NextResponse.next()` on every path that should
 * carry CSP — use it everywhere instead of calling NextResponse.next() directly.
 */
function nextWithNonce(request: NextRequest, nonce: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return addSecurityHeaders(response, nonce);
}

function rewriteWithNonce(request: NextRequest, url: URL, nonce: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  return addSecurityHeaders(response, nonce);
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

    const demoSpecificRoutes = new Set(['/demo', '/demo/deep-search-agent']);
    if (!demoSpecificRoutes.has(pathname)) {
      const appPath = pathname.replace(/^\/demo/, '/app');
      const url = request.nextUrl.clone();
      url.pathname = appPath;
      return rewriteWithNonce(request, url, nonce);
    }

    return nextWithNonce(request, nonce);
  }

  // --- /onboarding routes ---
  if (pathname.startsWith('/onboarding')) {
    if (isDemo) return addSecurityHeaders(NextResponse.redirect(new URL('/demo/dashboard', request.url)), nonce);
    if (!hasFirebaseToken) return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)), nonce);
    return nextWithNonce(request, nonce);
  }

  // --- First-login redirect for un-onboarded Firebase users ---
  if (pathname.startsWith('/app') && hasFirebaseToken && sessionData?.onboarded === false && pathname !== '/onboarding') {
    return addSecurityHeaders(NextResponse.redirect(new URL('/onboarding', request.url)), nonce);
  }

  // --- /app/* routes ---
  if (pathname.startsWith('/app')) {
    if (isDemo) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/demo/dashboard', request.url)),
        nonce,
      );
    }
    if (!hasFirebaseToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
    }
    return nextWithNonce(request, nonce);
  }

  return nextWithNonce(request, nonce);
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

  if (nonce) {
    // Expose nonce to server components via response header so layouts/pages
    // can read it with `headers().get('x-nonce')` for manual <Script nonce=...>
    // tags (e.g. JSON-LD in the landing page).
    response.headers.set('x-nonce', nonce);
  }

  // CSP: nonce + strict-dynamic is the supported secure pattern for Next.js.
  // Next.js automatically applies the nonce to its inline bootstrap scripts
  // when it reads `x-nonce` off the REQUEST headers (set in nextWithNonce /
  // rewriteWithNonce). Host-based allowlists (apis.google.com, *.gstatic.com,
  // etc.) remain valid fallbacks for browsers that do not support
  // strict-dynamic; modern browsers rely on the nonce chain.
  //
  // `script-src-elem` intentionally does not include the nonce. Chrome ignores
  // `unsafe-inline` whenever a nonce is present on the same directive, and the
  // Firebase/Google redirect return flow injects inline script elements that
  // are not under our nonce control. Keep the stricter nonce on `script-src`
  // while allowing those auth-managed script elements to execute.
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' apis.google.com *.firebaseapp.com *.googleapis.com *.google.com *.gstatic.com www.googletagmanager.com www.google.com www.recaptcha.net`
    : `'self' 'unsafe-inline' apis.google.com *.firebaseapp.com *.googleapis.com *.google.com *.gstatic.com www.googletagmanager.com www.google.com www.recaptcha.net`;
  const scriptSrcElem = nonce
    ? `'self' 'unsafe-inline' apis.google.com *.firebaseapp.com *.googleapis.com *.google.com *.gstatic.com www.googletagmanager.com www.google.com www.recaptcha.net`
    : scriptSrc;

  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
      `script-src ${scriptSrc}; ` +
      `script-src-elem ${scriptSrcElem}; ` +
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
      "img-src 'self' data: blob: *.googleapis.com *.googleusercontent.com *.gstatic.com www.googletagmanager.com www.google-analytics.com *.google-analytics.com; " +
      "font-src 'self' fonts.gstatic.com; " +
      "connect-src 'self' *.firebaseio.com *.googleapis.com *.firebaseapp.com identitytoolkit.googleapis.com securetoken.googleapis.com firebaseappcheck.googleapis.com api.acleddata.com api.gdeltproject.org api.reliefweb.int hapi.humdata.org api.worldbank.org *.firecrawl.dev api.parallel.ai js.stripe.com wss://*.firebaseio.com www.google-analytics.com *.google-analytics.com www.googletagmanager.com; " +
      "frame-src 'self' *.firebaseapp.com accounts.google.com *.google.com js.stripe.com;",
  );

  return response;
}

export const config = {
  matcher: ['/demo/:path*', '/app/:path*', '/onboarding/:path*', '/onboarding', '/login', '/pricing'],
};
