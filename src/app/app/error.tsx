'use client';

import { ErrorFallback } from '@/components/shared/error-boundary';

/**
 * Error boundary for the /app/* authenticated workspace.
 * Catches errors within any tool page without crashing the entire app shell.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} />;
}
