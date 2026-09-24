'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type CheckoutPlan = 'free' | 'analyst' | 'team' | 'enterprise';

type PricingCheckoutButtonProps = {
  plan: CheckoutPlan;
  label: string;
};

type SessionPayload = {
  authenticated?: boolean;
  user?: { id?: string; email?: string } | null;
};

type CheckoutPayload = {
  url?: string;
  configured?: boolean;
  fallbackHref?: string;
  mode?: 'sandbox' | 'production' | 'unconfigured';
  error?: string;
};

export function PricingCheckoutButton({ plan, label }: PricingCheckoutButtonProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const waitingForSession = checkingSession && plan !== 'free' && plan !== 'enterprise';

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' });
        const payload = await response.json().catch(() => ({})) as SessionPayload;
        if (!cancelled) setAuthenticated(Boolean(payload.authenticated || payload.user?.id));
      } catch {
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleClick() {
    setMessage(null);
    if (plan === 'enterprise') {
      window.location.href = 'mailto:hello@tacitus.me?subject=PRAXIS%20Institution%20plan';
      return;
    }
    if (plan === 'free') {
      window.location.href = authenticated ? '/app' : '/login?mode=signup&redirect=%2Fapp';
      return;
    }
    if (!authenticated) {
      const postSignupCheckoutPath = `/app/settings?tab=billing&checkoutPlan=${plan}`;
      const params = new URLSearchParams({ mode: 'signup', plan, redirect: postSignupCheckoutPath });
      window.location.href = `/login?${params.toString()}`;
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const payload = await response.json().catch(() => ({})) as CheckoutPayload;
      if (response.ok && payload.url) {
        window.location.href = payload.url;
        return;
      }
      if (response.status === 401) {
        window.location.href = `/login?mode=signup&plan=${plan}`;
        return;
      }
      setMessage(payload.error ?? 'Billing checkout is not available in this environment.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not start checkout.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7">
      <button
        type="button"
        data-testid={`pricing-checkout-${plan}`}
        onClick={handleClick}
        disabled={busy || waitingForSession}
        className={cn(
          'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-diplomatic-blue)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--color-navy-900)] disabled:cursor-not-allowed disabled:opacity-60',
          plan === 'enterprise' && 'bg-white text-[color:var(--color-diplomatic-blue)] ring-1 ring-[color:var(--color-rose-gold)]/35 hover:bg-white/80',
        )}
      >
        {busy || waitingForSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {label}
      </button>
      {message ? (
        <p role="status" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          {message}
        </p>
      ) : null}
    </div>
  );
}
