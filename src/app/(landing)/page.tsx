import { headers } from 'next/headers';
import dynamic from 'next/dynamic';
import { Hero } from "@/components/landing/hero";
import { SixSteps } from "@/components/landing/six-steps";
import { AgenticAppSection } from "@/components/landing/agentic-app-section";
import { ExampleCasesGallery } from "@/components/landing/example-cases-gallery";
import { Dialectica } from "@/components/landing/dialectica";
import { LiveDemo } from "@/components/landing/live-demo";

// Below-fold sections stay split while remaining crawler-visible through SSR.
const BuiltFor = dynamic(() =>
  import("@/components/landing/built-for").then((m) => m.BuiltFor),
);
const Trust = dynamic(() =>
  import("@/components/landing/trust").then((m) => m.Trust),
);
const PricingCTA = dynamic(() =>
  import("@/components/landing/pricing-cta").then((m) => m.PricingCTA),
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
  applicationSubCategory: "Policy Workbench & Conflict Intelligence",
  operatingSystem: "Web",
  description:
    "PRAXIS is a policy workbench: every user opens a live Situation, asks PRAXIS what matters, reviews trust-marked sources and claims, and produces handovers, briefs, memos, drafts, and exports. Example cases including Syria, Nordalia, Sahel, US housing, workplace mediation, and sanctions are available as guest sessions before login.",
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
      description: "Guest-session example cases (Syria, Nordalia, Sahel, US housing, workplace mediation, sanctions) for evaluating the real PRAXIS workspace, graph workflows, DIALECTICA reasoning, and briefing exports",
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
    "Home, Ask PRAXIS, Situation Model, Sources, Outputs, and Advanced areas",
    "Guided workflows for understanding a Situation, improving context, updating briefs, and generating handovers",
    "Mobile-first navigation for Home, Ask, Sources, Outputs, and More",
    "Source receipts and provenance manifests on exported work products",
    "Example cases as guest sessions before login: Syria, Nordalia, Sahel, US housing, workplace mediation, and sanctions",
    "Boardroom-deliberated policy options with human review",
    "Trust posture for graph support, source quality, reliability, and consensus",
    "Google Cloud, Firebase, and graph projection architecture",
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
    "TACITUS is building the AI-native stack for statecraft: policy and conflict-intelligence software that keeps analysis tied to sources, methods, institutional context, and human review.",
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
      <SixSteps />
      <AgenticAppSection />
      <ExampleCasesGallery />
      <Dialectica />
      <LiveDemo />
      <BuiltFor />
      <Trust />
      <PricingCTA />
      <WaitlistForm />
      <Footer />
    </>
  );
}
