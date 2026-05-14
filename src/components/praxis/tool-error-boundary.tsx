'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FixThisFirstPanel } from '@/components/praxis/fix-this-first-panel';
import type { CapsuleGateError } from '@/lib/api/capsule-gate-client';

interface Props {
  children: ReactNode;
  toolName?: string;
  onRetry?: () => void;
  /**
   * When set, the boundary renders FixThisFirstPanel instead of the
   * generic error state. Caller passes this after parsing a 412 from a
   * tool route via parseCapsuleGateResponse / readCapsuleGateError.
   */
  capsuleGate?: CapsuleGateError | null;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ToolErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[${this.props.toolName || 'Tool'}] Error:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.props.capsuleGate) {
      return (
        <FixThisFirstPanel
          missing={this.props.capsuleGate.missingCores}
          stale={this.props.capsuleGate.staleCores}
          toolHint={this.props.toolName ? `${this.props.toolName} needs more context.` : undefined}
        />
      );
    }
    if (this.state.hasError) {
      const isAiError = this.state.error?.message?.includes('AI') ||
                         this.state.error?.message?.includes('generation') ||
                         this.state.error?.message?.includes('model');

      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-crimson/20 bg-crimson/5 p-8 text-center" role="alert" data-testid="tool-error-state">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-crimson/10">
            <AlertTriangle className="h-6 w-6 text-crimson" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-900">
              {isAiError ? 'AI Analysis Failed' : `${this.props.toolName || 'Tool'} Error`}
            </h3>
            <p className="mt-1 text-xs text-navy-500 max-w-md">
              {isAiError
                ? 'The AI model encountered an issue. This usually resolves by retrying.'
                : this.state.error?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-md bg-diplomatic-blue px-4 py-2 text-xs font-medium text-white hover:bg-diplomatic-blue/90 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
