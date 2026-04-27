import { headers } from 'next/headers';
import dynamic from 'next/dynamic';
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProblemSection } from "@/components/landing/problem-section";
import { ConflictGrammarHighlight } from "@/components/landing/conflict-grammar-highlight";
import { AiCompanionSection } from "@/components/landing/ai-companion-section";

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

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PRAXIS by TACITUS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Policy & Statecraft AI",
  operatingSystem: "Web",
  description:
    "PRAXIS by TACITUS is the agentic AI workspace for statecraft — diplomats, conflict analysts, mediators, and policy officers. Calibrated to your mandate, grounded in your sources, reasoning with the frameworks your institution already trusts (Glasl, Fisher-Ury, INFORM, OCHA, IPC, ICD-203, IHL).",
  url: siteUrl,
  image: `${siteUrl}/opengraph-image`,
  inLanguage: "en",
  audience: {
    "@type": "Audience",
    audienceType:
      "Diplomats, conflict analysts, mediators, humanitarian leads, policy officers, foreign-policy researchers, sanctions and compliance teams",
  },
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
      price: "100.00",
      priceCurrency: "USD",
      description: "Single-licence individual workspace for live situations, grounded research, canonical actor checks, reports, and exports",
    },
    {
      "@type": "Offer",
      name: "Team",
      price: "499.00",
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
    "Agentic AI tools calibrated to your mandate and active situation",
    "ACO v2.0 — 14-entity conflict ontology with 72 typed relationships",
    "Glasl 9-stage escalation, Fisher-Ury, INFORM Risk Index, OCHA, IPC",
    "Conflict graph extraction with cited evidence and version history",
    "Drafting Studio with ICD-203 analytic standards and source tracing",
    "Open-data feeds: ACLED, UCDP, GDELT BigQuery, ReliefWeb, OCHA, HDX, UNHCR, World Bank, UN News, Crisis Group, SIPRI",
    "Source-grounded research via Vertex AI with citation discipline",
    "Advisor Council simulation (six expert personas, ICD-203-aligned)",
    "Game-theory and scenario analysis with deep-think reasoning",
    "Geospatial monitoring and risk scoring",
    "Private GCP workspace per tenant; Firebase Auth; isolated Firestore",
  ],
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TACITUS",
  legalName: "TACITUS",
  url: "https://tacitus.me",
  logo: `${siteUrl}/favicon.svg`,
  description:
    "TACITUS is building the AI-native stack for statecraft — agentic software for the institutions that shape policy, peace, and security.",
  sameAs: [
    "https://praxis.tacitus.me",
    "https://tacitus.me",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "hello@tacitus.me",
      areaServed: "Worldwide",
      availableLanguage: ["English", "French"],
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PRAXIS by TACITUS",
  url: siteUrl,
  inLanguage: "en",
  publisher: { "@type": "Organization", name: "TACITUS", url: "https://tacitus.me" },
};

export default async function LandingPage() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Hero />
      <HowItWorks />
      <AiCompanionSection />
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
