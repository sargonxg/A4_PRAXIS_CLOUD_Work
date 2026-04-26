'use client';

/**
 * <AiErrorToast /> — top-right toast that consumes the cross-tool AI
 * error channel from `useAiErrorStore`. Mount once near the app shell
 * root; every tool's failed fetch publishes to the store.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';
import { useAiErrorStore, type AiErrorEntry } from '@/stores/ai-error-store';
import { cn } from '@/lib/utils/cn';

const AUTO_DISMISS_MS = 12_000;

export function AiErrorToast() {
  const errors = useAiErrorStore((s) => s.errors);
  const dismiss = useAiErrorStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      role="region"
      aria-label="AI tool errors"
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {errors.map((err) => (
        <ErrorToastRow key={err.id} entry={err} onDismiss={() => dismiss(err.id)} />
      ))}
    </div>
  );
}

function ErrorToastRow({ entry, onDismiss }: { entry: AiErrorEntry; onDismiss: () => void }) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const handleRetry = async () => {
    if (!entry.retry) return;
    setRetrying(true);
    try {
      await entry.retry();
      onDismiss();
    } finally {
      setRetrying(false);
    }
  };

  const tone =
    entry.status >= 500
      ? 'bg-rose-50 border-rose-300 text-rose-900'
      : entry.status === 429
        ? 'bg-amber-50 border-amber-300 text-amber-900'
        : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2 shadow-lg shadow-navy-950/5',
        tone
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
          {entry.toolId} · HTTP {entry.status}
        </p>
        <p className="text-sm leading-snug">{entry.message}</p>
        {entry.retryable && entry.retry && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className={cn(
              'mt-1.5 inline-flex items-center gap-1 rounded border border-current/30 bg-white/40 px-2 py-0.5 text-xs font-medium hover:bg-white/70',
              retrying && 'cursor-wait opacity-60'
            )}
          >
            <RotateCcw className={cn('h-3 w-3', retrying && 'animate-spin')} />
            Retry
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 hover:bg-white/40"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
