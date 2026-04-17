import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { Features } from "@/components/landing/features";
import { LivePlatformPreview } from "@/components/landing/live-platform-preview";
import { ConflictGrammarHighlight } from "@/components/landing/conflict-grammar-highlight";
import { AdvisoryCouncil } from "@/components/landing/advisory-council";
import { SecuritySection } from "@/components/landing/security-section";
import { UseCaseCards } from "@/components/landing/use-case-cards";
import { BuiltByPractitioners } from "@/components/landing/built-by-practitioners";
import { Testimonials } from "@/components/landing/testimonials";
import { Marketplace } from "@/components/landing/marketplace";
import { EcosystemSection } from "@/components/landing/ecosystem-section";
import { Cta } from "@/components/landing/cta";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { MethodologySection } from "@/components/landing/methodology-section";
import { Footer } from "@/components/landing/footer";

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
    "Conflict Grammar knowledge graph",
    "40+ analytical tools",
    "Real-time data feeds (ACLED, GDELT, ReliefWeb, UCDP)",
    "Advisory council simulation",
    "Game theory analysis",
    "Geospatial monitoring",
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <ProblemSection />
      <Features />
      <LivePlatformPreview />
      <ConflictGrammarHighlight />
      <MethodologySection />
      <UseCaseCards />
      <BuiltByPractitioners />
      <AdvisoryCouncil />
      <SecuritySection />
      <Testimonials />
      <EcosystemSection />
      <Marketplace />
      <WaitlistForm />
      <Cta />
      <Footer />
    </>
  );
}
