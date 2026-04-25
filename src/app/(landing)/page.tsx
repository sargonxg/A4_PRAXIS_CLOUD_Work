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
const DataSubstrate = dynamic(() =>
  import("@/components/landing/data-substrate").then((m) => m.DataSubstrate),
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
    "PRAXIS by TACITUS is an AI-native workspace for policy, diplomacy, and political analysis. Structure sources into cited assessments, graphs, and briefings.",
  url: siteUrl,
  offers: [
    {
      "@type": "Offer",
      name: "Demo",
      price: "0",
      priceCurrency: "USD",
      description: "Free Nordalia demo for evaluating PRAXIS workflows with synthetic data",
    },
    {
      "@type": "Offer",
      name: "Analyst",
      price: "49.00",
      priceCurrency: "USD",
      description: "Individual workspace for live situations, grounded research, canonical actor checks, reports, and exports",
    },
    {
      "@type": "Offer",
      name: "Team",
      price: "199.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
      description: "Shared workspace for teams handling multiple live situations, source monitoring, Advisor Council workflows, and graph configuration",
    },
    {
      "@type": "Offer",
      name: "Institution",
      price: "0",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
      description: "Custom institutional deployment and pricing for governance, SSO, audit controls, and private GCP architecture",
    },
  ],
  creator: {
    "@type": "Organization",
    name: "TACITUS",
    url: "https://tacitus.me",
  },
  featureList: [
    "Policy, diplomacy, and political analysis",
    "AI-powered conflict analysis",
    "Glasl escalation model",
    "ACO v2.0 Conflict Grammar knowledge graph",
    "40+ analytical tools",
    "Real-time open data feeds (GDELT BigQuery, UCDP, ReliefWeb, HDX, UNHCR, World Bank, UN News)",
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
      <DataSubstrate />
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
