"use client";

import { motion } from "framer-motion";

interface AnnotatedSegment {
  text: string;
  label?: string;
  bgColor?: string;
  textColor?: string;
  legendColor?: string;
}

const segments: AnnotatedSegment[] = [
  {
    text: "The Government of Nordalia",
    label: "Actor",
    bgColor: "bg-[#1A2332]",
    textColor: "text-white",
    legendColor: "#1A2332",
  },
  { text: " " },
  {
    text: "rejected",
    label: "Event (Escalatory)",
    bgColor: "bg-[#A63D40]",
    textColor: "text-white",
    legendColor: "#A63D40",
  },
  { text: " " },
  {
    text: "the DRM's demand for provincial elections",
    label: "Claim",
    bgColor: "bg-[#C8961E]",
    textColor: "text-white",
    legendColor: "#C8961E",
  },
  { text: ", citing " },
  {
    text: "a 2019 constitutional amendment",
    label: "Constraint",
    bgColor: "bg-[#6B7280]",
    textColor: "text-white",
    legendColor: "#6B7280",
  },
  { text: ". " },
  {
    text: "Commander Asante warned",
    label: "Narrative",
    bgColor: "bg-[#4B92DB]",
    textColor: "text-white",
    legendColor: "#4B92DB",
  },
  { text: " that 'all options remain on the table' if " },
  {
    text: "the Framework Agreement",
    label: "Commitment",
    bgColor: "bg-[#5B8C5A]",
    textColor: "text-white",
    legendColor: "#5B8C5A",
  },
  { text: " is not restored by March 15. Meanwhile, Karovia announced " },
  {
    text: "a new $50M military aid package",
    label: "Leverage",
    bgColor: "bg-[#2563EB]",
    textColor: "text-white",
    legendColor: "#2563EB",
  },
  { text: ", drawing condemnation from Westmark." },
];

const legendItems = [
  { label: "Actor", color: "#1A2332" },
  { label: "Event (Escalatory)", color: "#A63D40" },
  { label: "Claim", color: "#C8961E" },
  { label: "Constraint", color: "#6B7280" },
  { label: "Narrative", color: "#4B92DB" },
  { label: "Commitment", color: "#5B8C5A" },
  { label: "Leverage", color: "#2563EB" },
];

// Only annotated segments (with a label) get a staggered index
function getAnnotatedIndex(segmentIndex: number): number {
  let count = 0;
  for (let i = 0; i < segmentIndex; i++) {
    if (segments[i].label) count++;
  }
  return count;
}

export function ConflictGrammarHighlight() {
  return (
    <section id="conflict-grammar-highlight" className="relative px-6 py-24 lg:py-32">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-navy-950/[0.02] to-transparent" />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Conflict Grammar™ in Action</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-4 text-center"
        >
          <h2 className="font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            See the Structure Behind the News
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-12 max-w-2xl text-center text-lg text-navy-500"
        >
          PRAXIS automatically recognizes and tags conflict entities in any text,
          surfacing the underlying grammar of every dispute.
        </motion.p>

        {/* Original text block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2">
            Original Text
          </p>
          <div className="rounded-xl border border-cream-300/60 bg-white/70 px-6 py-5 text-sm leading-relaxed text-navy-600">
            The Government of Nordalia rejected the DRM&apos;s demand for provincial
            elections, citing a 2019 constitutional amendment. Commander Asante warned
            that &apos;all options remain on the table&apos; if the Framework Agreement is not
            restored by March 15. Meanwhile, Karovia announced a new $50M military aid
            package, drawing condemnation from Westmark.
          </div>
        </motion.div>

        {/* Arrow indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex justify-center py-3"
        >
          <div className="flex flex-col items-center gap-1 text-diplomatic-blue/60">
            <div className="h-5 w-px bg-diplomatic-blue/30" />
            <svg className="h-4 w-4 fill-diplomatic-blue/40" viewBox="0 0 16 16">
              <path d="M8 12L2 6h12z" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-navy-400">
              PRAXIS Analysis
            </span>
          </div>
        </motion.div>

        {/* Annotated text block */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2">
            Annotated — Conflict Grammar™ Entities Detected
          </p>
          <div className="rounded-xl border border-diplomatic-blue/15 bg-white/80 px-6 py-5 text-sm leading-[2.2] shadow-sm">
            {segments.map((seg, i) => {
              if (!seg.label) {
                return <span key={i} className="text-navy-700">{seg.text}</span>;
              }
              const annotatedIdx = getAnnotatedIndex(i);
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.35,
                    delay: 0.6 + annotatedIdx * 0.18,
                    ease: "easeOut",
                  }}
                  className={`group relative inline-flex flex-col items-start ${seg.bgColor} ${seg.textColor} rounded px-1.5 py-0.5 mx-0.5 cursor-default`}
                >
                  <span className="relative z-10">{seg.text}</span>
                  {/* Tooltip label */}
                  <span
                    className="absolute -top-6 left-0 z-20 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    style={{ backgroundColor: seg.legendColor, color: "white" }}
                  >
                    {seg.label}
                  </span>
                </motion.span>
              );
            })}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Legend
          </p>
          <div className="flex flex-wrap gap-3">
            {legendItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.07 }}
                className="flex items-center gap-2 rounded-full border border-navy-100/60 bg-white/80 px-3 py-1.5 shadow-sm"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-navy-700">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-6 text-center text-xs text-navy-400"
        >
          This is a static demonstration. PRAXIS applies Conflict Grammar™ recognition
          automatically to any ingested document, article, or field report.
        </motion.p>
      </div>
    </section>
  );
}
