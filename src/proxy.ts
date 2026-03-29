import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'tacitus-auth-session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE);

  let sessionData: { demo?: boolean; token?: string } | null = null;
  if (session?.value) {
    try {
      sessionData = JSON.parse(session.value);
    } catch {
      sessionData = null;
    }
  }

  const isDemo = sessionData?.demo === true;
  const hasFirebaseToken = !!sessionData?.token;

  // --- /demo/* routes: require demo session cookie ---
  if (pathname.startsWith('/demo')) {
    if (!sessionData) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('mode', 'demo');
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
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
  // CSP: removed unsafe-eval, kept unsafe-inline for Next.js style injection.
  // Next.js requires unsafe-inline for style-src (CSS-in-JS) and script-src
  // (inline script tags for hydration). unsafe-eval removed for XSS protection.
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' apis.google.com *.firebaseapp.com *.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
    "img-src 'self' data: blob: *.googleapis.com *.googleusercontent.com; " +
    "font-src 'self' fonts.gstatic.com; " +
    "connect-src 'self' *.firebaseio.com *.googleapis.com *.firebaseapp.com api.acleddata.com api.gdeltproject.org api.reliefweb.int hapi.humdata.org api.worldbank.org *.firecrawl.dev api.parallel.ai js.stripe.com va.vercel-scripts.com; " +
    "frame-src 'self' *.firebaseapp.com accounts.google.com js.stripe.com;"
  );
  return response;
}

export const config = {
  matcher: ['/demo/:path*', '/app/:path*'],
};
