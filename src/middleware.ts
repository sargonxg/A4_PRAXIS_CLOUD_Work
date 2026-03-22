import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication (from the (app) route group)
const PROTECTED_PATHS = [
  '/dashboard',
  '/reports',
  '/assistant',
  '/media-compass',
  '/conflict-graph',
  '/un-toolkit',
  '/documents',
  '/settings',
  '/calendar',
  '/advisory',
  '/talking-points',
  '/stakeholder-map',
  '/early-warning',
  '/sanctions',
  '/scenarios',
  '/negotiation-prep',
  '/compare',
  '/cases',
  '/argus',
  '/concordia',
  '/dossier',
  '/treaty-analyzer',
  '/risk-monitor',
  '/actors',
  '/team',
  '/briefing',
  '/situations',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this path is protected
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtected) {
    const session = request.cookies.get('tacitus-auth-session');

    if (!session?.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/reports/:path*',
    '/assistant/:path*',
    '/media-compass/:path*',
    '/conflict-graph/:path*',
    '/un-toolkit/:path*',
    '/documents/:path*',
    '/settings/:path*',
    '/calendar/:path*',
    '/advisory/:path*',
    '/talking-points/:path*',
    '/stakeholder-map/:path*',
    '/early-warning/:path*',
    '/sanctions/:path*',
    '/scenarios/:path*',
    '/negotiation-prep/:path*',
    '/compare/:path*',
    '/cases/:path*',
    '/argus/:path*',
    '/concordia/:path*',
    '/dossier/:path*',
    '/treaty-analyzer/:path*',
    '/risk-monitor/:path*',
    '/actors/:path*',
    '/team/:path*',
    '/briefing/:path*',
    '/situations/:path*',
  ],
};
