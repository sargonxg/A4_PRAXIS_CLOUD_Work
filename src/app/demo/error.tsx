'use client';

import { ErrorFallback } from '@/components/shared/error-boundary';

/**
 * Error boundary for the /demo/* workspace.
 * Same as app error boundary — catches tool page crashes.
 */
export default function DemoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} />;
}
