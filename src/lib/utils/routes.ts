'use client';

import { usePathname } from 'next/navigation';

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
