import type { Metadata } from "next";
import Link from "next/link";
import { CoreCapsuleHero } from "@/components/landing/core-capsule-hero";
import { CapsuleAnatomyHoneycomb } from "@/components/landing/capsule-anatomy-honeycomb";
import { OutputCatalogCarousel } from "@/components/landing/output-catalog-carousel";
import { ComposeCapsulesShowcase } from "@/components/landing/compose-capsules-demo";
import { PersonaCards } from "@/components/landing/persona-cards";
import { ConnectorStrip } from "@/components/landing/connector-strip";

export const metadata: Metadata = {
  title: "PRAXIS — How it works",
  description:
    "PRAXIS turns analyst intent into typed, citable, composable capsules. Twelve cores, fourteen output templates, twenty connectors, one diplomatic-grade workspace.",
};

export default function LearnPage() {
  return (
    <div className="relative">
      {/* Atmospheric radial backdrop — gold + diplomatic blue specular,
          stays under the paper texture from the landing layout. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 12% 8%, rgba(232,185,49,0.18) 0%, transparent 45%)",
            "radial-gradient(circle at 92% 18%, rgba(75,146,219,0.16) 0%, transparent 55%)",
            "radial-gradient(circle at 50% 90%, rgba(201,169,97,0.14) 0%, transparent 60%)",
          ].join(", "),
        }}
      />

      {/* Hero band */}
      <section className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-5 pb-16 pt-12 sm:pt-20 lg:grid-cols-[5fr_7fr] lg:px-8 lg:pb-24">
        <div>
          <span className="text-overline text-[color:var(--color-gold-700)]">
            How PRAXIS works
          </span>
          <h1 className="mt-3 font-serif text-[clamp(36px,5.4vw,64px)] font-medium leading-[1.04] tracking-tight text-[color:var(--color-ink)]">
            One capsule.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, #1B3A5C 0%, #1B3A5C 25%, #A37A14 60%, #E8B931 100%)",
              }}
            >
              Every brief
            </span>{" "}
            you ship.
          </h1>
          <p className="mt-5 max-w-[58ch] text-[16px] leading-relaxed text-[color:var(--color-ink)]/72">
            A diplomatic-grade workspace for policy, mediation, and humanitarian
            work. Type analyst intent — get a typed, citable, composable output
            you can ship, archive, and hand over.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login?mode=signup"
              prefetch={false}
              className="btn-capsule-primary inline-flex h-12 items-center justify-center rounded-full px-7 font-serif text-[16px] font-semibold tracking-tight"
            >
              Open a capsule
            </Link>
            <Link
              href="/"
              prefetch={false}
              className="btn-capsule-ghost inline-flex h-12 items-center justify-center rounded-full pl-5 pr-4 font-serif text-[15px] font-medium"
            >
              Back to cockpit
            </Link>
          </div>

          {/* Specimen line — fine type, museum-label feel */}
          <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.24em] text-[color:var(--color-ink)]/45">
            12 cores · 14 outputs · 20 connectors · 1 capsule
          </p>
        </div>

        <div className="relative">
          {/* Soft gold halo behind capsule */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(232,185,49,0.16) 0%, transparent 60%)",
              filter: "blur(20px)",
            }}
          />
          <CoreCapsuleHero />
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-5 lg:px-8">
        <div className="divider-rose-gold" />
      </div>

      {/* Identity sections — paper section with section-rhythm spacing */}
      <div className="section-rhythm relative z-10 py-20 sm:py-28 lg:py-32">
        <CapsuleAnatomyHoneycomb />
        <OutputCatalogCarousel />
        <ComposeCapsulesShowcase />
        <PersonaCards />
        <ConnectorStrip />
      </div>

      {/* Footer call-to-action */}
      <section className="relative z-10 mx-auto w-full max-w-[1280px] px-5 pb-24 lg:px-8">
        <div className="surface-glass relative overflow-hidden rounded-3xl border border-[color:var(--color-rose-gold)]/30 p-8 shadow-capsule-lg sm:p-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(27,58,92,0.06) 0%, rgba(232,185,49,0.10) 100%)",
            }}
          />
          <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[42ch]">
              <span className="text-overline text-[color:var(--color-gold-700)]">
                Start a capsule
              </span>
              <h2 className="mt-2 font-serif text-[clamp(24px,3.2vw,34px)] font-medium leading-tight tracking-tight text-[color:var(--color-ink)]">
                Type your situation. PRAXIS does the rest.
              </h2>
            </div>
            <Link
              href="/login?mode=signup"
              prefetch={false}
              className="btn-capsule-primary inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 font-serif text-[16px] font-semibold tracking-tight"
            >
              Open a capsule
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
