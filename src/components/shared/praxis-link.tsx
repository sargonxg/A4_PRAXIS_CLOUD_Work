'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { shouldPrefixPraxisHref, useRoutePrefix } from '@/lib/utils/routes';

type PraxisLinkProps = ComponentProps<typeof Link>;

/**
 * Drop-in replacement for Next.js Link that auto-prefixes href with /app or /demo
 * based on the current route group. External URLs and already-prefixed paths pass through.
 */
export function PraxisLink({ href, ...props }: PraxisLinkProps) {
  const prefix = useRoutePrefix();

  const hrefStr = typeof href === 'string' ? href : href.pathname ?? '';
  const prefixedHref = shouldPrefixPraxisHref(hrefStr) ? `${prefix}${hrefStr}` : href;

  return <Link href={prefixedHref} {...props} />;
}
