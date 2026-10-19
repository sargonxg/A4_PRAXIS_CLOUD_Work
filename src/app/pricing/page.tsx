import Link from 'next/link';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { PRICING_TIERS, INTERNAL_COST_DISCLOSURE_NOTICE } from '@/lib/constants/pricing';
import { getCheckoutAvailability } from '@/lib/billing/checkout-availability';
import { PricingCheckoutButton } from '@/components/billing/pricing-checkout-button';
import { PublicPageShell } from '@/components/ui/instrument';

const description = 'PRAXIS access is invitation-only. AI generation is paused, starter allowances are inactive, and paid upgrades are unavailable.';
export const metadata: Metadata = {
  title: 'Access and plans', description,
  alternates: { canonical: '/pricing' },
  openGraph: { title: 'PRAXIS access', description, url: '/pricing', images: ['/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'PRAXIS access', description, images: ['/opengraph-image'] },
};

export default async function PricingPage() {
  await connection();
  const checkout = getCheckoutAvailability();
  const practitioner = PRICING_TIERS.find(tier => tier.id === 'analyst')!;
  const futurePlans = PRICING_TIERS.filter(tier => tier.id !== 'free' && !(checkout.analyst && tier.id === 'analyst'));

  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <section className="py-12 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-800">Experimental access</p>
        <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-[color:var(--color-diplomatic-blue)] sm:text-5xl">Invitation-only access.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">AI generation is currently paused. Explore the public examples; workspace access requires an invitation.</p>
        {!checkout.analyst ? <p className="mt-4 text-sm text-slate-600">Paid upgrades are currently unavailable.</p> : null}
      </section>
      <section aria-label="Current access" className={checkout.analyst ? 'grid gap-5 md:grid-cols-2' : undefined}>
        {PRICING_TIERS.filter(tier => tier.id === 'free').map(tier => (
          <article key={tier.id} className="rounded-2xl border border-emerald-200 bg-white/80 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-3xl font-semibold text-slate-950">Invited preview</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900">Generation paused</span>
            </div>
            <p className="mt-4 font-medium text-slate-800">Configured allowance, currently inactive: {tier.usage}</p>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
              {tier.features.map(feature => <li key={feature} className="flex gap-3"><span aria-hidden="true" className="text-emerald-700">✓</span>{feature}</li>)}
            </ul>
            <p className="mt-5 text-sm leading-6 text-slate-600">The starter allowance is inactive while AI generation is paused. It becomes usable only if generation resumes and does not automatically refill. An allowance does not grant workspace access.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PricingCheckoutButton plan="free" label="Invited account access" />
              <Link href="/guide" className="praxis-link inline-flex min-h-11 items-center px-4 text-sm font-semibold">See the quick start</Link>
            </div>
          </article>
        ))}
        {checkout.analyst ? (
          <article className="rounded-2xl border border-slate-300 bg-white/80 p-6 sm:p-8">
            <h2 className="font-serif text-3xl font-semibold text-slate-950">{practitioner.name}</h2>
            <p className="mt-4 text-3xl font-semibold text-slate-950">${practitioner.price}<span className="ml-2 text-sm font-normal text-slate-600">USD / month</span></p>
            <p className="mt-3 text-sm font-medium text-slate-800">{practitioner.usage}</p>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              {practitioner.features.map(feature => <li key={feature}>{feature}</li>)}
            </ul>
            <p className="mt-5 text-sm leading-6 text-slate-600">Renews monthly. Manage or cancel through your account. Taxes, if applicable, appear at checkout.</p>
            {checkout.mode === 'sandbox' ? <p className="mt-3 text-sm text-amber-800">Test checkout only; no live subscription is offered.</p> : null}
            <PricingCheckoutButton plan="analyst" label={checkout.mode === 'sandbox' ? 'Test Practitioner checkout' : 'Choose Practitioner'} />
          </article>
        ) : null}
      </section>
      <details className="mt-8 rounded-2xl border border-slate-200 bg-white/55 p-5 sm:p-6">
        <summary className="min-h-11 cursor-pointer font-serif text-xl font-semibold text-slate-900">Future plan proposals</summary>
        <p className="mt-3 text-sm leading-6 text-slate-600">These plans are not offers or enabled entitlements.</p>
        <div className="mt-5 divide-y divide-slate-200">
          {futurePlans.map(tier => (
            <article key={tier.id} className="py-4 first:pt-0">
              <h2 className="font-serif text-xl font-semibold text-slate-950">{tier.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tier.id === 'analyst' ? 'An expanded individual allowance for research and writing. Activation is pending.' : tier.features[0]}</p>
            </article>
          ))}
        </div>
        <a href="mailto:hello@tacitus.me?subject=PRAXIS%20evaluation" className="praxis-link mt-3 inline-flex min-h-11 items-center text-sm font-semibold">Discuss an evaluation</a>
      </details>
      <section className="py-8 text-sm leading-6 text-slate-600" aria-label="Access boundaries">
        <p>{INTERNAL_COST_DISCLOSURE_NOTICE}</p>
        <p className="mt-3">TACITUS is an independent experimental project operated by Giulio Catanzariti. No TACITUS legal entity has been incorporated. Use public or synthetic material for evaluation; agree on data handling before using sensitive institutional records.</p>
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Related access information">
          <Link href="/legal/privacy" className="praxis-link inline-flex min-h-11 items-center">Privacy</Link>
          <Link href="/legal/terms" className="praxis-link inline-flex min-h-11 items-center">Experimental terms</Link>
          <Link href="/legal/data-processing" className="praxis-link inline-flex min-h-11 items-center">Data processing</Link>
          <Link href="/legal/security" className="praxis-link inline-flex min-h-11 items-center">Security</Link>
        </nav>
      </section>
    </PublicPageShell>
  );
}
