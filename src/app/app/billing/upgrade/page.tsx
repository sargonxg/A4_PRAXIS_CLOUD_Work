'use client';

/**
 * /app/billing/upgrade — three-tier plan picker.
 *
 * Brief: Claude Code CC-10. Wires to /api/billing/checkout (Codex CX-9
 * Stripe). When the route isn't shipped the page still renders and
 * the CTA pings a placeholder POST that returns 404 gracefully.
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    line: 'Solo researcher · capped flows.',
    features: ['1 capsule', '5 paths', '50 flows / mo', 'Community support'],
    accent: false,
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    price: '$49',
    cadence: '/ analyst / month',
    line: 'Working analyst · all paths, full readiness.',
    features: ['Unlimited capsules', '10 operator paths', '500 flows / mo', 'Memory Bank', 'Capsule fork + share'],
    accent: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$199',
    cadence: '/ seat / month',
    line: 'Hybrid teams · governance + audit.',
    features: ['Everything in Practitioner', 'Shared capsule library', 'Audit ledger export', 'SAML SSO', 'SLA support'],
    accent: false,
  },
] as const;

export default function UpgradePage() {
  const [pending, setPending] = useState<string | null>(null);

  async function checkout(tierId: string) {
    setPending(tierId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tier: tierId }),
      });
      if (res.ok) {
        const body = (await res.json()) as { checkoutUrl?: string };
        if (body.checkoutUrl) {
          window.location.href = body.checkoutUrl;
          return;
        }
      }
      // Endpoint not shipped — point user at the static pricing page.
      window.location.href = '/pricing';
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">Subscriptions</p>
        <h1 className="mt-2 font-serif text-3xl text-slate-950 sm:text-4xl">
          Pick the plan that matches your cadence.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
          PRAXIS subscriptions replace per-token credit math with a clean monthly flow quota tied
          to the capsule contract. Upgrade when capsules ship to teammates and Memory Bank lights
          up.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <article
            key={tier.id}
            className={[
              'flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm',
              tier.accent ? 'border-[#8A5A00] ring-2 ring-[#E8B931]/30' : 'border-slate-200',
            ].join(' ')}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-950">{tier.name}</h2>
              {tier.accent ? (
                <span className="rounded-full bg-[#8A5A00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                  most chosen
                </span>
              ) : null}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-3xl font-semibold text-slate-950">{tier.price}</span>
              <span className="text-xs text-slate-500">{tier.cadence}</span>
            </div>
            <p className="text-sm text-slate-700">{tier.line}</p>
            <ul className="space-y-1 text-sm text-slate-700">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void checkout(tier.id)}
              disabled={pending !== null}
              className={[
                'mt-auto inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-60',
                tier.accent
                  ? 'bg-[#111827] text-white hover:bg-[#243244]'
                  : 'border border-slate-300 bg-white text-slate-900 hover:border-slate-400',
              ].join(' ')}
            >
              {pending === tier.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              {tier.id === 'free' ? 'Stay free' : 'Choose ' + tier.name}
            </button>
          </article>
        ))}
      </section>

      <footer className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        Need to manage an existing subscription?{' '}
        <Link href="/app/billing/manage" className="font-semibold text-diplomatic-blue hover:underline">
          Open the billing portal
        </Link>
        .
      </footer>
    </main>
  );
}
