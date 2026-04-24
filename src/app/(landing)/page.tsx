import { headers } from 'next/headers';
import dynamic from 'next/dynamic';
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProblemSection } from "@/components/landing/problem-section";
import { ConflictGrammarHighlight } from "@/components/landing/conflict-grammar-highlight";

// Below-fold sections: server-render on demand but keep them out of the
// initial synchronous bundle so Hero + HowItWorks + ProblemSection dominate
// the LCP path. `ssr: true` (default) so crawlers still see the content.
const DomainCatalogue = dynamic(() =>
  import("@/components/landing/domain-catalogue").then((m) => m.DomainCatalogue),
);
const LivePlatformPreview = dynamic(() =>
  import("@/components/landing/live-platform-preview").then((m) => m.LivePlatformPreview),
);
const UseCaseCards = dynamic(() =>
  import("@/components/landing/use-case-cards").then((m) => m.UseCaseCards),
);
const AdvisoryCouncil = dynamic(() =>
  import("@/components/landing/advisory-council").then((m) => m.AdvisoryCouncil),
);
const SecuritySection = dynamic(() =>
  import("@/components/landing/security-section").then((m) => m.SecuritySection),
);
const PricingTeaser = dynamic(() =>
  import("@/components/landing/pricing-teaser").then((m) => m.PricingTeaser),
);
const Testimonials = dynamic(() =>
  import("@/components/landing/testimonials").then((m) => m.Testimonials),
);
const WaitlistForm = dynamic(() =>
  import("@/components/landing/waitlist-form").then((m) => m.WaitlistForm),
);
const Footer = dynamic(() =>
  import("@/components/landing/footer").then((m) => m.Footer),
);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praxis.tacitus.me';

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PRAXIS by TACITUS",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "The AI-native workspace for peace and security professionals. Turn raw conflict data into decisive intelligence in minutes, not weeks.",
  url: siteUrl,
  offers: [
    {
      "@type": "Offer",
      name: "Analyst",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier with 25 TACITUS Credits per month",
    },
    {
      "@type": "Offer",
      name: "Diplomat",
      price: "29.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
      description: "500 TACITUS Credits per month with priority AI",
    },
    {
      "@type": "Offer",
      name: "Ambassador",
      price: "99.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
      description: "Unlimited TACITUS Credits with all premium features",
    },
  ],
  creator: {
    "@type": "Organization",
    name: "TACITUS",
    url: "https://tacitus.me",
  },
  featureList: [
    "AI-powered conflict analysis",
    "Glasl escalation model",
    "ACO v2.0 Conflict Grammar knowledge graph",
    "40+ analytical tools",
    "Real-time data feeds (ACLED, GDELT, ReliefWeb, UCDP)",
    "Advisory council simulation",
    "Game theory analysis",
    "Geospatial monitoring",
  ],
};

export default async function LandingPage() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <HowItWorks />
      <ProblemSection />
      <ConflictGrammarHighlight />
      <DomainCatalogue />
      <LivePlatformPreview />
      <UseCaseCards />
      <AdvisoryCouncil />
      <SecuritySection />
      <Testimonials />
      <PricingTeaser />
      <WaitlistForm />
      <Footer />
    </>
  );
}
