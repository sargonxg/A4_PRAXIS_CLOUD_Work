'use client';

import { usePathname } from 'next/navigation';

const PUBLIC_ROOT_PATHS = new Set([
  '/',
  '/login',
  '/pricing',
  '/privacy',
  '/terms',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
]);

export function shouldPrefixPraxisHref(href: string): boolean {
  if (!href) return false;
  if (
    href.startsWith('/app') ||
    href.startsWith('/demo') ||
    href.startsWith('http') ||
    href.startsWith('#') ||
    href.startsWith('mailto:')
  ) {
    return false;
  }
  if (PUBLIC_ROOT_PATHS.has(href)) return false;
  return true;
}

/**
 * Returns the current route prefix based on whether we're in demo or app mode.
 */
export function useRoutePrefix(): '/app' | '/demo' {
  const pathname = usePathname();
  if (pathname.startsWith('/demo')) return '/demo';
  return '/app';
}

/**
 * Hook that returns a function to prefix paths with the current route group.
 * Usage: const route = usePraxisRoute(); router.push(route('/dashboard'));
 */
export function usePraxisRoute() {
  const prefix = useRoutePrefix();
  return (path: string) => `${prefix}${path.startsWith('/') ? path : '/' + path}`;
}
