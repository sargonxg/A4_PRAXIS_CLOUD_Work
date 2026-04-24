'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const DISMISSED_KEY = 'praxis:onboarding-nudge-dismissed';
const SKIP_THRESHOLD = 2;

export function SkipNudgeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISSED_KEY) === '1') return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/profile');
        if (!res.ok || cancelled) return;
        const body = await res.json();
        const profile = body?.profile ?? body;
        const skipCount = Number(profile?.meta?.skipCount ?? 0);
        const completedAt = profile?.meta?.completedAt;
        if (skipCount >= SKIP_THRESHOLD && !completedAt && !cancelled) {
          setVisible(true);
        }
      } catch {
        // non-critical
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch { /* storage disabled */ }
    setVisible(false);
  };

  return (
    <div
      role="note"
      className="flex items-center justify-between gap-3 border-b border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs text-gold-900"
    >
      <p>
        You haven&rsquo;t finished setting up your analyst profile yet. PRAXIS calibrates every
        tool output to your role, mandate, and red lines —{' '}
        <a href="/onboarding" className="font-semibold underline underline-offset-2">
          complete onboarding
        </a>{' '}
        to get personalised analysis.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="rounded-md p-1 text-gold-800 hover:bg-gold-500/20"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
