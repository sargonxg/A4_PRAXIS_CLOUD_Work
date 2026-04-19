'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

const SESSION_KEY = 'praxis-onboarding-banner-dismissed';

export function OnboardingBanner() {
  const { user, onboardingComplete } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  if (!user || user.isDemo || onboardingComplete || dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  }

  return (
    <div
      role="region"
      aria-label="Analyst profile incomplete"
      className="border-b border-yellow-500/30 bg-yellow-500/5"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-2 text-xs">
        <div className="flex items-center gap-2 text-slate-800">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-yellow-600" aria-hidden="true" />
          <span>Complete your analyst profile — calibrates every PRAXIS tool to your work.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="rounded-md bg-yellow-500 px-3 py-1 font-semibold text-white hover:bg-yellow-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500"
          >
            Continue
          </Link>
          <button
            onClick={dismiss}
            aria-label="Dismiss banner"
            className="text-slate-400 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 rounded"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
