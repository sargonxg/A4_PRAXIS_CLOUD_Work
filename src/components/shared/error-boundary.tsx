"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";

/* ------------------------------------------------------------------ */
/*  ErrorFallback — the UI shown when an error is caught              */
/* ------------------------------------------------------------------ */

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
        <AlertTriangle className="h-6 w-6 text-crimson" />
      </div>
      <h2 className="font-serif text-xl font-medium text-navy-900">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-500">
        An unexpected error occurred while loading this page. You can try again,
        or contact our support team if the problem persists.
      </p>
      {error.message && (
        <p className="mt-3 max-w-md rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-2 text-xs font-mono text-navy-400">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        {reset && (
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        <Button variant="outline" asChild>
          <a href="mailto:support@tacitus.me" className="gap-2">
            <Mail className="h-4 w-4" />
            Report Issue
          </a>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ErrorBoundary — class component that catches render errors        */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: (Error & { digest?: string }) | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback error={this.state.error} reset={this.handleReset} />
      );
    }
    return this.props.children;
  }
}
