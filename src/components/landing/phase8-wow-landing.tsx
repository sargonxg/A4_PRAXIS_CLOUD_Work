"use client";

import { TaskletPraxisWorkbench } from "@/components/praxis/tasklet-praxis-workbench";
import { CapsuleAnatomyHoneycomb } from "@/components/landing/capsule-anatomy-honeycomb";
import { OutputCatalogCarousel } from "@/components/landing/output-catalog-carousel";
import { ComposeCapsulesShowcase } from "@/components/landing/compose-capsules-demo";
import { PersonaCards } from "@/components/landing/persona-cards";
import { ConnectorStrip } from "@/components/landing/connector-strip";

export function Phase8WowLanding() {
  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#111827]">
      <TaskletPraxisWorkbench
        mode="public"
        activeCapsuleName="Middle East policy analysis"
      />

      {/* PRAXIS visual identity sections — additive, below cockpit */}
      <div className="section-rhythm bg-[var(--color-cream-100)] py-20 sm:py-28 lg:py-32">
        <CapsuleAnatomyHoneycomb />
        <OutputCatalogCarousel />
        <ComposeCapsulesShowcase />
        <PersonaCards />
        <ConnectorStrip />
      </div>
    </main>
  );
}
