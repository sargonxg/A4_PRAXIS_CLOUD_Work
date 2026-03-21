import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { Features } from "@/components/landing/features";
import { ConflictGrammarHighlight } from "@/components/landing/conflict-grammar-highlight";
import { AdvisoryCouncil } from "@/components/landing/advisory-council";
import { SecuritySection } from "@/components/landing/security-section";
import { DemoPreview } from "@/components/landing/demo-preview";
import { CalendarPreview } from "@/components/landing/calendar-preview";
import { ConflictGrammarViz } from "@/components/landing/conflict-grammar-viz";
import { UseCaseCards } from "@/components/landing/use-case-cards";
import { BuiltByPractitioners } from "@/components/landing/built-by-practitioners";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Marketplace } from "@/components/landing/marketplace";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { Cta } from "@/components/landing/cta";
import { EcosystemSection } from "@/components/landing/ecosystem-section";
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
      <DemoPreview />
      <CalendarPreview />
      <ConflictGrammarViz />
      <SecuritySection />
      <Pricing />
      <Testimonials />
      <EcosystemSection />
      <Marketplace />
      <WaitlistForm />
      <Cta />
      <Footer />
    </>
  );
}
