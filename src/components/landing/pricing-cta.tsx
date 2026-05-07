"use client";

import Link from "next/link";

const tiers = [
  {
    name: "Demo (free)",
    features: ["Example cases", "guest session", "workbench preview", "source receipts"],
  },
  {
    name: "Analyst $100",
    features: ["1 seat", "5 situations", "full graph", "own data"],
  },
  {
    name: "Team $499/mo",
    features: ["5 seats", "25 situations", "shared graphs", "team handoff"],
  },
  {
    name: "Institution (custom)",
    features: ["SSO, audit, private", "GCP residency", "custom workflows", "DPA + sub-processors"],
  },
];

function trackPricingCta(target: "demo" | "founder") {
  window.dispatchEvent(
    new CustomEvent("cta_click", {
      detail: {
        source: "landing_pricing",
        target,
      },
    }),
  );

  if ("gtag" in window && typeof window.gtag === "function") {
    window.gtag("event", "cta_click", {
      source: "landing_pricing",
      target,
    });
  }
}

export function PricingCTA() {
  return (
    <section id="pricing" className="relative overflow-hidden px-6 py-16 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-cream-50 to-cream-100"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-1/2 h-56 w-[min(820px,92vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_30%_55%,rgba(218,165,32,0.14),transparent_35%),radial-gradient(circle_at_72%_42%,rgba(33,75,135,0.13),transparent_42%)] blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <span className="mx-auto mb-5 block h-px w-16 bg-gradient-to-r from-transparent via-gold-600 to-transparent" aria-hidden="true" />
          <span className="text-overline text-gold-700">Pricing</span>
        </div>
        <h2 className="mx-auto max-w-3xl text-center font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
          Start with example cases, scale into institutional work.
        </h2>

        <div className="mt-12 overflow-hidden rounded-xl border border-cream-300/70 bg-white/85 shadow-sm shadow-navy-900/[0.04]">
          <div className="grid gap-px bg-cream-300/70 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <article key={tier.name} className="flex min-h-[240px] flex-col bg-white p-6">
                <div>
                  <h3 className="text-base font-semibold text-navy-900">{tier.name}</h3>
                </div>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-navy-600">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-600"
                      />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/demo/syria-2024"
            prefetch={false}
            data-analytics="pricing-cta-demo"
            onClick={() => trackPricingCta("demo")}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-500 hover:shadow-lg hover:shadow-gold-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100 active:scale-[0.99] sm:w-auto"
          >
            Try the demo →
          </Link>
          <a
            href="mailto:hello@tacitus.me?subject=PRAXIS%20intro%20call"
            data-analytics="pricing-cta-founder"
            onClick={() => trackPricingCta("founder")}
            className="inline-flex w-full items-center justify-center rounded-md border border-diplomatic-blue/20 bg-white/70 px-6 py-3 text-sm font-semibold text-diplomatic-blue transition-all duration-200 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100 sm:w-auto"
          >
            Talk to Giulio (founder) →
          </a>
        </div>
      </div>
    </section>
  );
}
