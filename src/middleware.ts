import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'tacitus-auth-session';

export function middleware(request: NextRequest) {
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
  return response;
}

export const config = {
  matcher: ['/demo/:path*', '/app/:path*'],
};
