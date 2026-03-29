'use client';

import { ErrorFallback } from '@/components/shared/error-boundary';

/**
 * Root-level error boundary for the entire application.
 * Catches unhandled errors in any page route.
 * Next.js automatically wraps each layout segment with this.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)]">
      <ErrorFallback error={error} reset={reset} />
    </div>
  );
}
