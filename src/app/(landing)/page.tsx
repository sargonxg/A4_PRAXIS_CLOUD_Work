import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { Features } from "@/components/landing/features";
import { AdvisoryCouncil } from "@/components/landing/advisory-council";
import { SecuritySection } from "@/components/landing/security-section";
import { DemoPreview } from "@/components/landing/demo-preview";
import { CalendarPreview } from "@/components/landing/calendar-preview";
import { ConflictGrammarViz } from "@/components/landing/conflict-grammar-viz";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Marketplace } from "@/components/landing/marketplace";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <Features />
      <AdvisoryCouncil />
      <DemoPreview />
      <CalendarPreview />
      <ConflictGrammarViz />
      <SecuritySection />
      <Pricing />
      <Testimonials />
      <Marketplace />
      <Cta />
      <Footer />
    </>
  );
}
