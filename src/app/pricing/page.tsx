import Link from 'next/link';
import type { Metadata } from 'next';
import { PRICING_TIERS, PLAN_USAGE_BUCKETS, INTERNAL_COST_DISCLOSURE_NOTICE } from '@/lib/constants/pricing';
import { PricingCheckoutButton } from '@/components/billing/pricing-checkout-button';
import { LivingContextRail, PublicPageShell } from '@/components/ui/instrument';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple monthly PRAXIS plans for sourced policy work, saved context, and reviewable briefs.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'PRAXIS Pricing',
    description: 'Monthly PRAXIS plans for sourced policy questions, saved context, and grounded outputs.',
    url: '/pricing',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'PRAXIS pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRAXIS Pricing',
    description: 'Monthly PRAXIS plans for sourced policy questions and grounded outputs.',
    images: ['/opengraph-image'],
  },
};

export default function PricingPage() {
  const billingMode = process.env.POLAR_SERVER === 'sandbox'
    ? 'Checkout is in test mode. No real subscription will be started.'
    : process.env.POLAR_ACCESS_TOKEN
      ? 'Start free. Review your plan and payment details before confirming any upgrade.'
      : 'Paid upgrades are not available yet. You can create an account and start with the free plan.';
  const pricingRailCells = [
    { id: 'profile', label: 'Profile', value: 'Analyst or team', detail: 'Workspace-owned', state: 'ready' as const },
    { id: 'context', label: 'Context', value: 'One workspace first', detail: 'Upgrade when work travels', state: 'active' as const },
    { id: 'source', label: 'Sources', value: 'Included', detail: 'Receipts and documents', state: 'ready' as const },
    { id: 'output', label: 'Output', value: 'Briefs and memos', detail: 'Reviewable products', state: 'quiet' as const },
    { id: 'readiness', label: 'Readiness', value: 'Monthly plan', detail: 'Simple plan', state: 'active' as const },
  ];

  return (
    <PublicPageShell>
        <section className="py-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-700">Pricing</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-normal text-[color:var(--color-diplomatic-blue)] sm:text-5xl">
            Plans for people who need sourced policy work.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[color:var(--color-ink)]/70">
            PRAXIS is priced as a workspace, not as a menu of tool charges. Start by asking PRAXIS, attach sources or saved context when the work needs proof, and upgrade when the work needs to move across people.
          </p>
          <p className="mt-5 max-w-2xl rounded-xl border border-[color:var(--color-rose-gold)]/30 bg-white/65 px-4 py-3 text-sm leading-6 text-[color:var(--color-ink)]/70">
            {billingMode}
          </p>
          <LivingContextRail cells={pricingRailCells} compact className="mt-8" />
        </section>
        <section className="grid gap-4 lg:grid-cols-4">
          {PRICING_TIERS.map((tier) => (
            <article
              key={tier.id}
              className={`rounded-2xl border bg-white/75 p-5 shadow-sm ${tier.highlighted ? 'border-emerald-500' : 'border-[color:var(--color-rose-gold)]/25'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-semibold text-[color:var(--color-diplomatic-blue)]">{tier.name}</h2>
                {tier.highlighted ? <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-700">Most useful</span> : null}
              </div>
              <p className="mt-2 text-sm text-[color:var(--color-ink)]/60">{tier.audience}</p>
              <p className="mt-6 font-serif text-3xl font-semibold">
                {tier.price < 0 ? 'Custom' : tier.price === 0 ? 'Free' : `$${tier.price}`}
                {tier.price > 0 ? <span className="text-sm font-normal text-[color:var(--color-ink)]/55"> / month</span> : null}
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-ink)]/70">{tier.usage}</p>
              <ul className="mt-6 space-y-3 text-sm leading-6 text-[color:var(--color-ink)]/75">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <PricingCheckoutButton plan={tier.id} label={tier.cta} />
            </article>
          ))}
        </section>
        <section className="mt-16 rounded-2xl border border-[color:var(--color-rose-gold)]/25 bg-white/55 p-6">
          <h2 className="font-serif text-2xl font-semibold text-[color:var(--color-diplomatic-blue)]">What plans include</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {PLAN_USAGE_BUCKETS.map((bucket) => (
              <div key={bucket.name} className="rounded-xl border border-[color:var(--color-rose-gold)]/20 bg-white/70 p-4">
                <h3 className="text-sm font-semibold">{bucket.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-ink)]/65">{bucket.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-[color:var(--color-ink)]/60">{INTERNAL_COST_DISCLOSURE_NOTICE}</p>
        </section>
        <section id="trust-security" className="mt-8 rounded-2xl border border-[color:var(--color-rose-gold)]/25 bg-white/55 p-6">
          <h2 className="font-serif text-2xl font-semibold text-[color:var(--color-diplomatic-blue)]">Trust and security posture</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--color-ink)]/70">
            PRAXIS is a beta service using United States infrastructure by default, Firebase Auth, Google Cloud, and Polar for billing when subscriptions are active. Workspace outputs remain reviewable policy work, not professional advice.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/legal/security" className="praxis-link">Security</Link>
            <Link href="/legal/sub-processors" className="praxis-link">Sub-processors</Link>
            <Link href="/legal/terms" className="praxis-link">Beta terms</Link>
          </div>
        </section>
    </PublicPageShell>
  );
}
