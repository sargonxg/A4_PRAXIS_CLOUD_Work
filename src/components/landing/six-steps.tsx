"use client";

import { motion } from "framer-motion";
import { useNarrativeMotion } from "./landing-motion-context";
import {
  BriefIcon,
  CompareIcon,
  IngestIcon,
  InheritIcon,
  QueryIcon,
  StructureIcon,
} from "./six-steps-icons";

const steps = [
  {
    number: "1",
    title: "Ingest",
    copy: "Drop sources, documents, and feeds into a Situation.",
    delay: 0,
    Icon: IngestIcon,
  },
  {
    number: "2",
    title: "Structure",
    copy: "Gemini extracts ACO primitives. You approve them into the graph.",
    delay: 0.5,
    Icon: StructureIcon,
  },
  {
    number: "3",
    title: "Query",
    copy: "Cypher and Cypher-derived recipes run reasoning over the graph.",
    delay: 1,
    Icon: QueryIcon,
  },
  {
    number: "4",
    title: "Compare",
    copy: "Discrepancies surface across UN docs, think tanks, local media.",
    delay: 1.5,
    Icon: CompareIcon,
  },
  {
    number: "5",
    title: "Brief",
    copy: "The Boardroom deliberates. The Draft writes itself, paragraph by paragraph.",
    delay: 2,
    Icon: BriefIcon,
  },
  {
    number: "6",
    title: "Inherit",
    copy: "Every export carries provenance. Next analyst inherits the work.",
    delay: 2.5,
    Icon: InheritIcon,
  },
] as const;

export function SixSteps() {
  const narrativeMotion = useNarrativeMotion();

  return (
    <section id="six-steps" className="relative overflow-hidden bg-cream-50/40 px-6 py-16 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #1B3A5C 0.5px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <span className="mb-5 block h-px w-16 bg-gradient-to-r from-gold-600 to-transparent" aria-hidden="true" />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
            Six-step workflow
          </p>
          <h2 className="font-serif text-4xl font-normal tracking-tight text-navy-950 sm:text-5xl">
            From source intake to inherited institutional memory.
          </h2>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-[8%] right-[8%] top-[76px] hidden h-px bg-gradient-to-r from-transparent via-diplomatic-blue/25 to-transparent md:block" />
          {narrativeMotion && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute top-[72px] hidden h-2.5 w-2.5 rounded-full bg-gold-500 shadow-[0_0_18px_rgba(232,185,49,0.8)] md:block"
              initial={{ left: "8%", opacity: 0 }}
              animate={{ left: ["8%", "92%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div className="grid max-h-[calc(100vh-5rem)] snap-y snap-mandatory grid-cols-1 gap-4 overflow-y-auto pr-1 md:max-h-none md:snap-none md:grid-cols-6 md:overflow-visible md:pr-0">
            {steps.map((step) => (
              <StepTile key={step.title} step={step} reducedMotion={!narrativeMotion} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepTile({
  step,
  reducedMotion,
}: {
  step: (typeof steps)[number];
  reducedMotion: boolean;
}) {
  const Icon = step.Icon;

  return (
    <article className="snap-start rounded-lg border border-diplomatic-blue/12 bg-white/78 p-4 shadow-lg shadow-navy-950/5 backdrop-blur-sm md:min-h-[360px] md:p-3">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/40 bg-gold-50 text-sm font-bold text-gold-700">
          {step.number}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-gold-500/35 to-transparent md:hidden" />
      </div>
      <div className="mb-4 aspect-[9/6.4] overflow-hidden rounded-md border border-cream-200/70 bg-gradient-to-br from-white via-cream-50/70 to-diplomatic-blue/5">
        <Icon delay={step.delay} reducedMotion={reducedMotion} />
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-navy-950 md:text-base">
        {step.title}
      </h3>
      <p className="text-sm leading-relaxed text-navy-500 md:text-[13px]">
        {step.copy}
      </p>
    </article>
  );
}
