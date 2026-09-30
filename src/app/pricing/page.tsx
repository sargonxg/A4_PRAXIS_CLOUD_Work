import Link from 'next/link';
import type { Metadata } from 'next';
import { PRICING_TIERS, INTERNAL_COST_DISCLOSURE_NOTICE } from '@/lib/constants/pricing';
import publicCapabilities from '@/lib/constants/tacitus-public-capabilities.json';
import { PricingCheckoutButton } from '@/components/billing/pricing-checkout-button';
import { PublicPageShell } from '@/components/ui/instrument';

const description = 'Experimental free access to PRAXIS. Ask a question, attach saved context and review your work. Paid upgrades are unavailable.';
export const metadata: Metadata = {
  title: 'Access and future plans', description,
  alternates: { canonical: '/pricing' },
  openGraph: { title: 'PRAXIS access', description, url: '/pricing', images: ['/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'PRAXIS access', description, images: ['/opengraph-image'] },
};

export default function PricingPage() {
  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <section className="py-12 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-800">Experimental access</p>
        <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-[color:var(--color-diplomatic-blue)] sm:text-5xl">Start with one question.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">Ask PRAXIS, attach context when it helps, and keep work you can review and reuse.</p>
        <p className="mt-4 text-sm leading-6 text-slate-600">{publicCapabilities.access.paid} TACITUS is an independent experimental project operated by Giulio Catanzariti. No TACITUS legal entity has been incorporated.</p>
      </section>
      <section aria-label="Current free access">
        {PRICING_TIERS.filter(tier => tier.id === 'free').map(tier => (
          <article key={tier.id} className="rounded-2xl border border-emerald-200 bg-white/80 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-3xl font-semibold text-slate-950">Free to try</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900">No credit card</span>
            </div>
            <p className="mt-4 font-medium text-slate-800">{tier.usage}</p>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
              {tier.features.map(feature => <li key={feature} className="flex gap-3"><span aria-hidden="true" className="text-emerald-700">✓</span>{feature}</li>)}
            </ul>
            <p className="mt-5 text-sm leading-6 text-slate-600">Other metered work shares the starter allowance. Check what remains in your account; an automatic monthly refill is not promised. Review AI-generated work against its sources before sharing.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PricingCheckoutButton plan="free" label="Start free" />
              <Link href="/guide" className="praxis-link inline-flex min-h-11 items-center px-4 text-sm font-semibold">See the quick start</Link>
            </div>
          </article>
        ))}
      </section>
      <details className="mt-8 rounded-2xl border border-slate-200 bg-white/55 p-5 sm:p-6">
        <summary className="min-h-11 cursor-pointer font-serif text-xl font-semibold text-slate-900">Future plan proposals</summary>
        <p className="mt-3 text-sm leading-6 text-slate-600">These prices and features describe possible future plans. They are not offers or enabled entitlements. Any institutional evaluation needs an agreed scope, responsible parties and suitable data-handling arrangements.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PRICING_TIERS.filter(tier => tier.id !== 'free').map(tier => (
            <article key={tier.id} className="rounded-xl border border-slate-200 bg-white/75 p-5">
              <h2 className="font-serif text-2xl font-semibold text-slate-950">{tier.name}</h2>
              <p className="mt-3 text-sm font-semibold text-slate-700">Proposed: {tier.price < 0 ? 'custom scope' : `$${tier.price} / month`}</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">{tier.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
              <a href="mailto:hello@tacitus.me?subject=PRAXIS%20evaluation" className="praxis-link mt-5 inline-flex min-h-11 items-center text-sm font-semibold">Discuss an evaluation</a>
            </article>
          ))}
        </div>
      </details>
      <section className="py-8 text-sm leading-6 text-slate-600" aria-label="Access boundaries">
        <p>{INTERNAL_COST_DISCLOSURE_NOTICE}</p>
        <p className="mt-3">Use public or synthetic material while evaluating the experimental workspace. Model processing, retention and institutional requirements need deployment-specific confirmation.</p>
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
