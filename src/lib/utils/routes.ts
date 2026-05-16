'use client';

import { usePathname } from 'next/navigation';

const PUBLIC_ROOT_PATHS = new Set([
  '/',
  '/login',
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
 * Returns the current authenticated app route prefix.
 */
export function useRoutePrefix(): '/app' {
  usePathname();
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
