import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { ConflictGrammarViz } from "@/components/landing/conflict-grammar-viz";
import { DemoPreview } from "@/components/landing/demo-preview";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <ConflictGrammarViz />
      <DemoPreview />
      <Cta />
      <Footer />
    </>
  );
}
