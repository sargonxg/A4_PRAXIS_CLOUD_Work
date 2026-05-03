"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp, BarChart3, Target, Users, Scale } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ---- Annotated text demo ----

interface AnnotatedSegment {
  text: string;
  label?: string;
  bgColor?: string;
  textColor?: string;
  legendColor?: string;
}

const segments: AnnotatedSegment[] = [
  {
    text: "The Syrian transitional authorities",
    label: "Actor",
    bgColor: "bg-[#1A2332]",
    textColor: "text-white",
    legendColor: "#1A2332",
  },
  { text: " " },
  {
    text: "announced",
    label: "Event (Escalatory)",
    bgColor: "bg-[#A63D40]",
    textColor: "text-white",
    legendColor: "#A63D40",
  },
  { text: " " },
  {
    text: "a northeast integration track with the SDF",
    label: "Claim",
    bgColor: "bg-[#C8961E]",
    textColor: "text-white",
    legendColor: "#C8961E",
  },
  { text: ", conditioned by " },
  {
    text: "rights guarantees and security sequencing",
    label: "Constraint",
    bgColor: "bg-[#6B7280]",
    textColor: "text-white",
    legendColor: "#6B7280",
  },
  { text: ". " },
  {
    text: "Local civil society warned",
    label: "Narrative",
    bgColor: "bg-[#4B92DB]",
    textColor: "text-white",
    legendColor: "#4B92DB",
  },
  { text: " that trust will erode if " },
  {
    text: "the 30 January agreement",
    label: "Commitment",
    bgColor: "bg-[#5B8C5A]",
    textColor: "text-white",
    legendColor: "#5B8C5A",
  },
  { text: " is not implemented rights-protectively. Meanwhile, regional actors retain " },
  {
    text: "border, sanctions, and reconstruction leverage",
    label: "Leverage",
    bgColor: "bg-[#2563EB]",
    textColor: "text-white",
    legendColor: "#2563EB",
  },
  { text: ", shaping the recovery window." },
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

function getAnnotatedIndex(segmentIndex: number): number {
  let count = 0;
  for (let i = 0; i < segmentIndex; i++) {
    if (segments[i].label) count++;
  }
  return count;
}

// ---- Analytical Frameworks ----

const FEATURED_FRAMEWORKS = [
  {
    name: "Glasl Escalation Model",
    author: "Friedrich Glasl (1982)",
    icon: TrendingUp,
    color: "text-amber-600",
    bg: "bg-amber-50",
    description:
      "9-stage escalation model mapping conflict intensity from hardening to abyss. Three zones: Win-Win, Win-Lose, Lose-Lose.",
  },
  {
    name: "INFORM Risk Index",
    author: "IASC/EC Joint Research Centre",
    icon: BarChart3,
    color: "text-red-600",
    bg: "bg-red-50",
    description:
      "Composite risk index measuring Hazard & Exposure, Vulnerability, and Lack of Coping Capacity across 191 countries.",
  },
  {
    name: "Fisher-Ury Principled Negotiation",
    author: "Fisher, Ury & Patton (1981)",
    icon: Target,
    color: "text-diplomatic-blue",
    bg: "bg-diplomatic-blue/10",
    description:
      "Interest-based negotiation separating positions from interests. Foundation of the Harvard Program on Negotiation.",
  },
  {
    name: "Mitchell-Agle-Wood Stakeholder Theory",
    author: "Mitchell, Agle & Wood (1997)",
    icon: Users,
    color: "text-sky-600",
    bg: "bg-sky-50",
    description:
      "Power-Legitimacy-Urgency taxonomy classifying stakeholder salience. 7 types from dormant to definitive.",
  },
  {
    name: "Zartman Ripeness Theory",
    author: "I. William Zartman (2000)",
    icon: Scale,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    description:
      "Identifies Mutually Hurting Stalemate + Way Out as preconditions for negotiation. Guides timing of mediation.",
  },
];

export function ConflictGrammarHighlight() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="methodology"
      className="relative overflow-hidden px-6 py-24 lg:py-32"
    >
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-navy-950/[0.02] to-transparent" />

      <div className="mx-auto max-w-4xl">
        {/* ---- ACO Conflict Grammar Section ---- */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">
            ACO v2.0 — Conflict Grammar in Action
          </span>
        </motion.div>

        <motion.h2
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-4 text-center font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl"
        >
          See the Structure Behind the News
        </motion.h2>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-12 max-w-2xl text-center text-lg text-navy-500"
        >
          PRAXIS automatically recognizes and tags conflict entities in any text,
          surfacing the underlying grammar of every dispute. 14 entity types.
          72 typed relationships. No black boxes.
        </motion.p>

        {/* Original text block */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-3"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Original Text
          </p>
          <div className="rounded-xl border border-cream-300/60 bg-white/70 px-6 py-5 text-sm leading-relaxed text-navy-600">
            The Syrian transitional authorities announced a northeast integration
            track with the SDF, conditioned by rights guarantees and security
            sequencing. Local civil society warned that trust will erode if the
            30 January agreement is not implemented rights-protectively. Meanwhile,
            regional actors retain border, sanctions, and reconstruction leverage,
            shaping the recovery window.
          </div>
        </motion.div>

        {/* Arrow indicator */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex justify-center py-3"
        >
          <div className="flex flex-col items-center gap-1 text-diplomatic-blue/60">
            <div className="h-5 w-px bg-diplomatic-blue/30" />
            <svg
              className="h-4 w-4 fill-diplomatic-blue/40"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M8 12L2 6h12z" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-navy-400">
              PRAXIS Analysis
            </span>
          </div>
        </motion.div>

        {/* Annotated text block */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-3"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Annotated — Conflict Grammar Entities Detected
          </p>
          <div className="rounded-xl border border-diplomatic-blue/15 bg-white/80 px-6 py-5 text-sm leading-[2.2] shadow-sm">
            {segments.map((seg, i) => {
              if (!seg.label) {
                return (
                  <span key={i} className="text-navy-700">
                    {seg.text}
                  </span>
                );
              }
              const annotatedIdx = getAnnotatedIndex(i);
              return (
                <motion.span
                  key={i}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.35,
                    delay: shouldReduceMotion ? 0 : 0.6 + annotatedIdx * 0.18,
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
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
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
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 0.6 + i * 0.07 }}
                className="flex items-center gap-2 rounded-full border border-navy-100/60 bg-white/80 px-3 py-1.5 shadow-sm"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-navy-700">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-6 text-center text-xs text-navy-400"
        >
          Static demonstration. PRAXIS applies Conflict Grammar recognition
          automatically to any ingested document, article, or field report.
        </motion.p>

        {/* ---- Divider ---- */}
        <div className="my-20 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream-300 to-transparent" />
          <span className="text-xs font-semibold uppercase tracking-widest text-navy-300">
            Methodology
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream-300 to-transparent" />
        </div>

        {/* ---- Methodology Frameworks Section ---- */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-600"
          >
            Analytical Rigour
          </motion.p>
          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl font-normal tracking-tight text-navy-950 sm:text-4xl"
          >
            Built on 15 Peer-Reviewed Frameworks
          </motion.h2>
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base leading-relaxed text-navy-500"
          >
            Every assessment in PRAXIS is grounded in established conflict
            analysis methodology — transparent, auditable analytical reasoning
            that practitioners trust.
          </motion.p>
        </div>

        {/* Framework grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_FRAMEWORKS.map((fw, i) => (
            <motion.div
              key={fw.name}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: shouldReduceMotion ? 0 : i * 0.07 }}
              className="group rounded-xl border border-navy-100 bg-white p-5 transition-all hover:border-navy-200 hover:shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    fw.bg
                  )}
                >
                  <fw.icon className={cn("h-4 w-4", fw.color)} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-navy-900">{fw.name}</h4>
                  <p className="text-[10px] text-navy-400">{fw.author}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-navy-500">
                {fw.description}
              </p>
            </motion.div>
          ))}

          {/* "+10 more" callout */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: shouldReduceMotion ? 0 : FEATURED_FRAMEWORKS.length * 0.07 }}
            className="flex items-center justify-center rounded-xl border border-dashed border-navy-200 bg-navy-50/40 p-5"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-diplomatic-blue">+10</p>
              <p className="mt-1 text-sm font-medium text-navy-700">
                more frameworks built in
              </p>
              <p className="mt-2 text-xs text-navy-400">
                Stedman · Lederach · Galtung · Putnam · Berghof · Fearon
              </p>
            </div>
          </motion.div>
        </div>

        {/* Transparency note */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 rounded-xl border border-gold-500/20 bg-gold-500/5 px-6 py-4 text-center"
        >
          <p className="text-sm text-navy-600">
            <span className="font-semibold text-navy-900">
              Methodology transparency
            </span>{" "}
            — Every tool page in PRAXIS includes an expandable &ldquo;About this
            tool&rdquo; panel documenting the exact frameworks, data sources, and
            analytical methods used. No black boxes.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
