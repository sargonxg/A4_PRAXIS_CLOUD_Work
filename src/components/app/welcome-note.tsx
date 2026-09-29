'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Boxes, Compass, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

const WELCOME_DISMISS_PREFIX = 'praxis:first-run-welcome-dismissed:v1';

export function WelcomeNote() {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  const dismissalKey = useMemo(() => {
    return `${WELCOME_DISMISS_PREFIX}:${user?.id ?? 'anonymous'}`;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        setDismissed(localStorage.getItem(dismissalKey) === 'true');
      } catch {
        setDismissed(false);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [dismissalKey, user?.id]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(dismissalKey, 'true');
    } catch {
      // Keep the note dismissible even when local storage is unavailable.
    }
  }

  if (!hydrated || dismissed) return null;

  return (
    <aside
      data-testid="first-run-welcome"
      className="fixed right-4 top-16 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-[var(--shadow-float)]"
      aria-label="Welcome to PRAXIS"
    >
      <details>
        <summary className="min-h-8 cursor-pointer pr-10 font-semibold leading-8 text-slate-800">New to PRAXIS? Quick start</summary>
        <h2 className="mt-3 text-base font-semibold text-slate-950">Ask first. Add context when useful.</h2>
        <div className="mt-3 grid gap-2 leading-5">
          <p>Start with a question. Attach sources or saved context in the Capsule Dock when you need them, then review the answer and its evidence.</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/app/capsules?starter=starter-situation-mediation-track" onClick={dismiss} className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">
            <Boxes className="h-3.5 w-3.5" /> Try this capsule
          </Link>
          <Link href="/app" onClick={dismiss} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Compass className="h-3.5 w-3.5" /> Back to Ask
          </Link>
        </div>
      </details>
        <button
          type="button"
          aria-label="Dismiss welcome"
          onClick={dismiss}
          className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
    </aside>
  );
}
