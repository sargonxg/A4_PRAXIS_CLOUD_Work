import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { Features } from "@/components/landing/features";
import { ConflictGrammarHighlight } from "@/components/landing/conflict-grammar-highlight";
import { AdvisoryCouncil } from "@/components/landing/advisory-council";
import { SecuritySection } from "@/components/landing/security-section";
import { UseCaseCards } from "@/components/landing/use-case-cards";
import { BuiltByPractitioners } from "@/components/landing/built-by-practitioners";
import { Testimonials } from "@/components/landing/testimonials";
import { Marketplace } from "@/components/landing/marketplace";
import { EcosystemSection } from "@/components/landing/ecosystem-section";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <Features />
      <ConflictGrammarHighlight />
      <UseCaseCards />
      <BuiltByPractitioners />
      <AdvisoryCouncil />
      <SecuritySection />
      <Testimonials />
      <EcosystemSection />
      <Marketplace />
      <Cta />
      <Footer />
    </>
  );
}
