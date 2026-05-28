import Link from 'next/link';
import type { Metadata } from 'next';
import { PRICING_TIERS, PLAN_USAGE_BUCKETS, INTERNAL_COST_DISCLOSURE_NOTICE } from '@/lib/constants/pricing';
import { PraxisGlyphChip } from '@/components/brand/praxis-mark';
import { LivingContextRail, PublicPageShell } from '@/components/ui/instrument';

export const metadata: Metadata = {
  title: 'Pricing | PRAXIS by TACITUS',
  description: 'Simple monthly PRAXIS plans built around ContextCapsules, sourceability, and grounded policy work.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'PRAXIS Pricing',
    description: 'Monthly PRAXIS plans for ContextCapsule workspaces, sources, and grounded policy outputs.',
    url: '/pricing',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'PRAXIS pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRAXIS Pricing',
    description: 'Monthly PRAXIS plans for ContextCapsule workspaces and grounded policy outputs.',
    images: ['/opengraph-image'],
  },
};

export default function PricingPage() {
  const pricingRailCells = [
    { id: 'profile', label: 'Profile', value: 'Analyst or team', detail: 'Workspace-owned', state: 'ready' as const },
    { id: 'context', label: 'Context', value: 'One capsule first', detail: 'Upgrade when work travels', state: 'active' as const },
    { id: 'source', label: 'Sources', value: 'Included', detail: 'Receipts and documents', state: 'ready' as const },
    { id: 'output', label: 'Output', value: 'Memos and handovers', detail: 'Reviewable products', state: 'quiet' as const },
    { id: 'readiness', label: 'Readiness', value: 'Monthly plan', detail: 'No tool marketplace', state: 'active' as const },
  ];

  return (
    <PublicPageShell>
        <PublicHeader />
        <section className="py-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--color-gold-700)]">Pricing</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-normal text-[color:var(--color-diplomatic-blue)] sm:text-5xl">
            Monthly plans for one ContextCapsule workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[color:var(--color-ink)]/70">
            PRAXIS is priced as a workspace, not as a menu of tool charges. Start with one capsule and upgrade when capsules, sources, and handovers need to move across people.
          </p>
          <LivingContextRail cells={pricingRailCells} compact className="mt-8" />
        </section>
        <section className="grid gap-4 lg:grid-cols-4">
          {PRICING_TIERS.map((tier) => (
            <article
              key={tier.id}
              className={`rounded-2xl border bg-white/75 p-5 shadow-sm ${tier.highlighted ? 'border-[color:var(--color-gold-500)]' : 'border-[color:var(--color-rose-gold)]/25'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-semibold text-[color:var(--color-diplomatic-blue)]">{tier.name}</h2>
                {tier.highlighted ? <span className="rounded-full bg-[color:var(--color-gold-500)]/15 px-2 py-1 text-xs font-semibold text-[color:var(--color-gold-700)]">Most useful</span> : null}
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
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-gold-500)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.id === 'enterprise' ? 'mailto:hello@tacitus.me' : `/login?mode=signup${tier.id === 'analyst' || tier.id === 'team' ? `&plan=${tier.id}` : ''}`}
                className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--color-diplomatic-blue)] px-4 text-sm font-semibold text-white"
              >
                {tier.cta}
              </Link>
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
    </PublicPageShell>
  );
}

function PublicHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3">
        <PraxisGlyphChip size={34} />
        <span className="font-serif text-xl font-semibold text-[color:var(--color-diplomatic-blue)]">PRAXIS</span>
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-semibold text-[color:var(--color-ink)]/65">
        <Link href="/" className="praxis-link">Home</Link>
        <Link href="/login?mode=signup&redirect=%2Fapp%2Fcapsules" className="praxis-link hidden md:inline">Capsules</Link>
        <Link href="/pricing" className="praxis-link hidden md:inline">Pricing</Link>
        <Link href="/learn" className="praxis-link hidden md:inline">Learn</Link>
        <Link href="/release-notes" className="praxis-link hidden md:inline">Release notes</Link>
        <Link href="/login" className="rounded-full bg-white px-4 py-2 text-[color:var(--color-ink)]">Sign in</Link>
      </nav>
    </header>
  );
}
