'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PRICING_TIERS, CREDIT_COSTS } from '@/lib/constants/pricing';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-cream-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-serif text-2xl font-semibold tracking-wide text-diplomatic-blue">TACITUS</span>
            <span className="rounded-full bg-gold-600/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-700">PRAXIS</span>
          </Link>
          <Link href="/login" className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-white hover:bg-gold-600">
            Start Using PRAXIS
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="text-center">
          <h1 className="font-serif text-4xl font-semibold text-navy-900">TACITUS Credits</h1>
          <p className="mt-3 text-lg text-navy-500 max-w-2xl mx-auto">
            Every AI operation in PRAXIS uses TACITUS Credits. Choose the plan that fits your analytical workflow.
          </p>
        </div>

        {/* Tiers */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6',
                tier.highlighted
                  ? 'border-gold-500 bg-gold-500/5 ring-2 ring-gold-500/20 shadow-lg'
                  : 'border-navy-200 bg-white'
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <h3 className="text-lg font-semibold text-navy-900">{tier.name}</h3>
              <div className="mt-2">
                {tier.price === 0 ? (
                  <span className="text-3xl font-bold text-navy-900">Free</span>
                ) : tier.price === -1 ? (
                  <span className="text-3xl font-bold text-navy-900">Custom</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-navy-900">${tier.price}</span>
                    <span className="text-sm text-navy-500">/month</span>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-navy-500">
                {tier.credits === -1 ? 'Unlimited credits' : `${tier.credits.toLocaleString()} credits/month`}
              </p>
              <p className="text-xs text-navy-400">
                {tier.maxSituations === -1 ? 'Unlimited situations' : `${tier.maxSituations} active situation${tier.maxSituations > 1 ? 's' : ''}`}
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-navy-600">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.id === 'enterprise' ? 'mailto:hello@tacitus.me' : tier.id === 'free' ? '/login' : `/login?plan=${tier.id}`}
                className={cn(
                  'mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors',
                  tier.highlighted
                    ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20'
                    : tier.id === 'enterprise'
                      ? 'bg-navy-900 text-white hover:bg-navy-800'
                      : 'border border-navy-200 text-navy-700 hover:bg-navy-50'
                )}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Credit Costs */}
        <div className="mt-20">
          <h2 className="text-center font-serif text-2xl font-semibold text-navy-900">Credit Cost Reference</h2>
          <p className="mt-2 text-center text-sm text-navy-500">How many credits each AI operation uses</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(
              Object.entries(CREDIT_COSTS).reduce((acc, [, v]) => {
                if (!acc[v.category]) acc[v.category] = [];
                acc[v.category].push(v);
                return acc;
              }, {} as Record<string, typeof CREDIT_COSTS[string][]>)
            ).map(([category, items]) => (
              <div key={category} className="rounded-xl border border-navy-200 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-3">{category}</h3>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-navy-600">{item.label}</span>
                      <span className="text-xs font-bold text-navy-900">{item.cost} cr</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-sm text-navy-500">
            Questions? Contact us at{' '}
            <a href="mailto:hello@tacitus.me" className="text-diplomatic-blue hover:underline">hello@tacitus.me</a>
          </p>
        </div>
      </div>
    </div>
  );
}
