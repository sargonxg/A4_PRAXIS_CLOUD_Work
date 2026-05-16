"use client";

import { TaskletPraxisWorkbench } from "@/components/praxis/tasklet-praxis-workbench";
import { OutputCatalogCarousel } from "@/components/landing/output-catalog-carousel";
import { ComposeCapsulesDemo } from "@/components/landing/compose-capsules-demo";

export function Phase8WowLanding() {
  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#111827]">
      <TaskletPraxisWorkbench
        mode="public"
        activeCapsuleName="Middle East policy analysis"
      />

      {/* PRAXIS visual identity sections — additive, below cockpit */}
      <div className="section-rhythm bg-[var(--color-cream-100)] py-20 sm:py-28 lg:py-32">
        <OutputCatalogCarousel />
        <ComposeCapsulesDemo />
      </div>
    </main>
  );
}
