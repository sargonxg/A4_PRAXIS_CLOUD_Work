'use client';

/**
 * /app/billing/manage — redirect into the Stripe customer portal.
 *
 * Brief: Claude Code CC-10. Calls /api/billing/portal (Codex CX-9) to
 * mint a portal session URL and forwards the browser. Falls back to
 * the static pricing page when the route isn't shipped.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function BillingManagePage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/billing/portal', { method: 'POST', credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return (await r.json()) as { portalUrl?: string };
      })
      .then((body) => {
        if (cancelled) return;
        if (body.portalUrl) {
          window.location.href = body.portalUrl;
        } else {
          setError('portal URL missing from response');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'portal fetch failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-12 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      <h1 className="font-serif text-2xl text-slate-950">Opening the billing portal…</h1>
      {error ? (
        <p className="text-sm text-slate-700">
          Could not reach the portal ({error}). Visit{' '}
          <Link href="/pricing" className="font-semibold text-diplomatic-blue hover:underline">
            /pricing
          </Link>{' '}
          or{' '}
          <Link href="/app/billing/upgrade" className="font-semibold text-diplomatic-blue hover:underline">
            /app/billing/upgrade
          </Link>{' '}
          instead.
        </p>
      ) : null}
    </main>
  );
}
