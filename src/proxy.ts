import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'tacitus-auth-session';
const LEGACY_APP_ROUTE_TARGETS: Record<string, string> = {
  '/app/desk': '/app/dashboard',
  '/app/cockpit': '/app/dashboard',
  '/app/context': '/app/contexts',
  '/app/context-builder': '/app/contexts',
  '/app/actors': '/app/contexts',
  '/app/requirements': '/app/contexts',
  '/app/sources': '/app/library',
  '/app/documents': '/app/library',
  '/app/reports': '/app/write',
  '/app/source-scout': '/app/assistant',
  '/app/research': '/app/assistant',
  '/app/source-monitor': '/app/assistant',
  '/app/deep-search-agent': '/app/assistant',
  '/app/argus': '/app/assistant',
  '/app/global-search': '/app/assistant',
  '/app/compare': '/app/assistant',
  '/app/graphops': '/app/canvas',
  '/app/graph': '/app/canvas',
  '/app/conflict-graph': '/app/canvas',
  '/app/power-map': '/app/canvas',
  '/app/external-actors': '/app/canvas',
  '/app/dialectica': '/app/canvas',
  '/app/brainstorming-table': '/app/tools',
  '/app/boardroom': '/app/tools',
  '/app/auto-briefings': '/app/write',
  '/app/advisory': '/app/tools',
  '/app/concordia': '/app/tools',
  '/app/scenarios': '/app/tools',
  '/app/game-theory': '/app/tools',
  '/app/briefing': '/app/write',
  '/app/policy-memo': '/app/write',
  '/app/talking-points': '/app/write',
  '/app/dossier': '/app/write',
  '/app/export-center': '/app/write',
  '/app/editor': '/app/write',
  '/app/risk-monitor': '/app/dashboard',
  '/app/early-warning': '/app/dashboard',
  '/app/humanitarian': '/app/dashboard',
  '/app/human-rights': '/app/dashboard',
  '/app/economic-impact': '/app/dashboard',
  '/app/electoral-risk': '/app/dashboard',
  '/app/peacebuilding-index': '/app/dashboard',
  '/app/geospatial-monitor': '/app/dashboard',
  '/app/media-compass': '/app/assistant',
  '/app/media-roundup': '/app/assistant',
  '/app/info-environment': '/app/assistant',
  '/app/sanctions': '/app/write',
  '/app/sanctions-explorer': '/app/write',
  '/app/legal-tracker': '/app/write',
  '/app/treaty-analyzer': '/app/write',
  '/app/un-toolkit': '/app/write',
  '/app/mediation-design': '/app/tools',
  '/app/negotiation-prep': '/app/tools',
  '/app/commitments': '/app/canvas',
  '/app/timeline': '/app/canvas',
  '/app/team': '/app/dashboard',
};

function redirectWithSearch(request: NextRequest, nonce: string, target: string): NextResponse {
  const url = new URL(target, request.url);
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  return addSecurityHeaders(NextResponse.redirect(url), nonce);
}

/**
 * Edge-compatible session parser for routing decisions only.
 * Middleware runs on Edge runtime where Node.js `crypto` is unavailable.
 * Full HMAC signature verification happens in with-auth.ts (Node.js API handlers).
 *
 * Signed cookie format: JSON_PAYLOAD.HMAC_SIGNATURE
 * We extract the JSON payload before the last dot for routing decisions.
 * A forged cookie that gets past this check will still fail in with-auth.ts.
 */
function parseSessionForRouting(cookieValue: string): { demo?: boolean; token?: string; onboarded?: boolean; onboardingComplete?: boolean } | null {
  try {
    const idx = cookieValue.lastIndexOf('.');
    const jsonPart = idx !== -1 ? cookieValue.slice(0, idx) : cookieValue;
    const parsed = JSON.parse(jsonPart);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as { demo?: boolean; token?: string; onboarded?: boolean; onboardingComplete?: boolean };
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE);
  const nonce = generateNonce();

  const sessionData = session?.value ? parseSessionForRouting(session.value) : null;

  const isDemo = sessionData?.demo === true;
  const hasFirebaseToken = !!sessionData?.token;

  // Public route aliases accidentally generated by app-prefixed links. Handle
  // them before /app auth so cached clients do not hit login or 404.
  if (pathname === '/app/pricing') {
    return addSecurityHeaders(NextResponse.redirect(new URL('/pricing', request.url)), nonce);
  }

  if (pathname === '/contexts') {
    return redirectWithSearch(request, nonce, '/app/contexts');
  }
  if (pathname.startsWith('/contexts/')) {
    const slug = pathname.split('/').filter(Boolean).at(1);
    if (!slug) return redirectWithSearch(request, nonce, '/app/contexts');
    const url = new URL('/app/contexts', request.url);
    url.searchParams.set('situationId', slug);
    request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
    return addSecurityHeaders(NextResponse.redirect(url), nonce);
  }
  if (pathname === '/methods') {
    return redirectWithSearch(request, nonce, '/app/tools');
  }
  if (pathname.startsWith('/methods/')) {
    const methodId = pathname.split('/').filter(Boolean).at(1);
    const url = new URL('/app/tools', request.url);
    if (methodId) url.searchParams.set('method', methodId);
    request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
    return addSecurityHeaders(NextResponse.redirect(url), nonce);
  }
  if (pathname === '/ontologies') {
    return redirectWithSearch(request, nonce, '/app/contexts');
  }
  if (pathname.startsWith('/ontologies/')) {
    const ontologyId = pathname.split('/').filter(Boolean).at(1);
    const url = new URL('/app/contexts', request.url);
    if (ontologyId) url.searchParams.set('ontology', ontologyId);
    request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
    return addSecurityHeaders(NextResponse.redirect(url), nonce);
  }
  if (pathname === '/users') {
    return redirectWithSearch(request, nonce, '/app/cores/user');
  }
  if (pathname.startsWith('/users/')) {
    const modelId = pathname.split('/').filter(Boolean).at(1);
    const url = new URL('/app/cores/user', request.url);
    if (modelId) url.searchParams.set('model', modelId);
    request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
    return addSecurityHeaders(NextResponse.redirect(url), nonce);
  }

  const legacyAppTarget = LEGACY_APP_ROUTE_TARGETS[pathname]
    ?? (pathname === '/app/workbench' ? '/app/contexts' : null)
    ?? (pathname.startsWith('/app/workbench/') ? '/app/contexts' : null)
    ?? (pathname.startsWith('/app/boardroom/') ? '/app/tools' : null)
    ?? (pathname.startsWith('/app/library/') ? '/app/contexts' : null);
  if (legacyAppTarget) {
    const url = new URL(legacyAppTarget, request.url);
    if (pathname.startsWith('/app/workbench/')) {
      const situationId = pathname.split('/').filter(Boolean).at(2);
      if (situationId) url.searchParams.set('situationId', situationId);
    }
    request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
    return addSecurityHeaders(NextResponse.redirect(url), nonce);
  }

  // --- /onboarding routes ---
  if (pathname.startsWith('/onboarding')) {
    if (isDemo) return addSecurityHeaders(NextResponse.redirect(new URL('/app/dashboard', request.url)), nonce);
    if (!hasFirebaseToken) return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)), nonce);
    return nextWithNonce(request, nonce);
  }

  // --- First-login redirect for un-onboarded Firebase users ---
  if (
    pathname.startsWith('/app') &&
    hasFirebaseToken &&
    sessionData?.onboardingComplete !== true &&
    sessionData?.onboarded !== true &&
    pathname !== '/onboarding'
  ) {
    return addSecurityHeaders(NextResponse.redirect(new URL('/onboarding', request.url)), nonce);
  }

  // --- /app/* routes ---
  if (pathname.startsWith('/app')) {
    if (isDemo) return nextWithNonce(request, nonce);
    if (!hasFirebaseToken) {
      const loginUrl = new URL('/login', request.url);
      const redirectUrl = request.nextUrl.clone();
      loginUrl.searchParams.set('redirect', `${redirectUrl.pathname}${redirectUrl.search}`);
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
      "img-src 'self' data: blob: *.googleapis.com *.googleusercontent.com *.gstatic.com www.googletagmanager.com www.google-analytics.com *.google-analytics.com api.maptiler.com demotiles.maplibre.org; " +
      "font-src 'self' fonts.gstatic.com; " +
      "connect-src 'self' *.firebaseio.com *.googleapis.com *.firebaseapp.com identitytoolkit.googleapis.com securetoken.googleapis.com firebaseappcheck.googleapis.com api.gdeltproject.org api.reliefweb.int hapi.humdata.org api.worldbank.org wss://*.firebaseio.com www.google-analytics.com *.google-analytics.com www.googletagmanager.com www.google.com api.maptiler.com demotiles.maplibre.org; " +
      "frame-src 'self' *.firebaseapp.com accounts.google.com *.google.com;",
  );

  return response;
}

export const config = {
  matcher: [
    '/app/:path*',
    '/contexts/:path*',
    '/methods/:path*',
    '/ontologies/:path*',
    '/users/:path*',
    '/onboarding/:path*',
    '/onboarding',
    '/login',
    '/login/:path*',
    '/waitlist',
    '/legal/:path*',
    '/pricing',
  ],
};
