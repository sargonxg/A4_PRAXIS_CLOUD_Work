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
      className="fixed right-4 top-16 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-[var(--shadow-float)]"
      aria-label="Welcome to PRAXIS"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Welcome</p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">Start with context, then ask.</h2>
        </div>
        <button
          type="button"
          aria-label="Dismiss welcome"
          onClick={dismiss}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-2 leading-5">
        <p>
          Attach sources or saved context in the Capsule Dock. Use Home, Capsules, and Settings from the app chrome.
        </p>
        <p>
          The Capsule Library is the fastest start. Try this capsule, then build your own governed context with DIALECTICA.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/app/capsules?starter=starter-situation-mediation-track"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Boxes className="h-3.5 w-3.5" />
          Try this capsule
        </Link>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Compass className="h-3.5 w-3.5" />
          Back to Ask
        </Link>
      </div>
    </aside>
  );
}
