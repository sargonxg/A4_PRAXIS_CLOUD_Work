"use client";

/**
 * "AI as a pro" — product-marketing section.
 *
 * Authored 2026-04-26 round 3. Closes the gap the user flagged on the
 * landing page: most policy work is NOT classified, open-source intelligence
 * is enough to do real work, and PRAXIS structures AI into a calibrated
 * team you can train.
 *
 * Three pillars:
 *   1. Open record is enough — what PRAXIS works on without classified inputs.
 *   2. AI as a pro — context, profile memory, situation memory, expert team.
 *   3. General path + specific toolkits — domains served + how the toolkit fits.
 */

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Compass,
  Globe2,
  Layers,
  Lightbulb,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const PILLAR_CARDS = [
  {
    icon: BookOpen,
    title: "Most policy work is open",
    body: "Treaties, UNSC resolutions, OCHA situation reports, GDELT signals, ReliefWeb releases, World Bank indicators, Crisis Group briefings, ICC filings, news wires. Most of what diplomats, mediators, humanitarian leads, and analysts work with sits in the open record. PRAXIS turns it into a structured, defensible workspace.",
  },
  {
    icon: ShieldCheck,
    title: "Sensitive work stays private",
    body: "Your notes, draft positions, red lines, internal cables — everything you upload stays inside your isolated workspace on Google Cloud. PRAXIS never shares data between users or situations. Open intelligence on the outside, your judgment on the inside.",
  },
  {
    icon: Sparkles,
    title: "AI as a pro, not a chatbot",
    body: "Every tool runs against your analyst profile (role, mandate, audience, lenses, working language, red lines), the active situation context, and the corpus you have built. The model is calibrated before it speaks — no generic answers, no orphan citations.",
  },
];

const COMPANION_BENEFITS = [
  {
    icon: Users,
    title: "An expert team, calibrated to you",
    body: "Mediator, humanitarian lead, legal analyst, media analyst, security/risk analyst, red-team critic — six personas reason over your situation corpus and converge on options you can defend. Each persona is anchored on the framework an analyst recognises (Berghof, Fisher-Ury, OCHA, IPC, INFORM, ICD 203).",
  },
  {
    icon: Network,
    title: "Memory that persists",
    body: "Profile memory survives every session. Situation memory survives every tool run. Tool outputs feed back into the corpus so each new run reasons over the last one. PRAXIS gets sharper the more you teach it about your work.",
  },
  {
    icon: Lightbulb,
    title: "A companion you train",
    body: "Drag-reorder your analytical lenses. Edit your red-line phrases. Save sources to your library. Approve graph proposals. Lock briefings you trust. The system absorbs every choice and reflects it on the next output. PRAXIS is not an answer engine — it is a working partner.",
  },
  {
    icon: Compass,
    title: "Source Scout on demand",
    body: "Need five fresh defensible sources you don't already have? Source Scout consults your corpus, then proposes new sources ranked by reliability tier and corroboration, with an explicit list of what is still missing. Built by practitioners for practitioners.",
  },
];

const DOMAINS = [
  { icon: Scale, label: "Diplomacy & negotiation", line: "ZOPA / BATNA editor, mediation simulation, treaty tracker, UN Toolkit." },
  { icon: Globe2, label: "Humanitarian & access", line: "OCHA-grade snapshots, IPC phases, displacement, funding gaps, protection." },
  { icon: BookOpen, label: "Human rights & rule of law", line: "ICC / ICJ trackers, UNSC compliance, IHL obligations, customary law." },
  { icon: Layers, label: "Development & stabilisation", line: "World Bank governance, conflict-sensitive programming, stabilisation maps." },
  { icon: Network, label: "Conflict analysis & early warning", line: "INFORM Risk Index, Glasl 9-stage, ACO graph, escalation forecasting." },
  { icon: Compass, label: "Information & narrative", line: "Entman frames, source diversity, propaganda risk, media compass." },
];

export function AiCompanionSection() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section className="relative px-6 py-24 sm:py-32" id="ai-companion">
      {/* Decorative gradient bands */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(232,185,49,0.06) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(75,146,219,0.05) 0%, transparent 55%)",
        }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Eyebrow */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6 }}
          className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gold-700"
        >
          Why PRAXIS
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7 }}
          className="mb-5 text-center font-serif text-4xl leading-[1.1] tracking-tight text-navy-950 sm:text-5xl"
        >
          Use AI like a pro — with context, memory, and a team that learns.
        </motion.h2>

        {/* Subhead */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mb-16 max-w-3xl text-center text-lg leading-relaxed text-navy-500"
        >
          Generic chatbots forget who you are between turns. PRAXIS does
          not. Every tool reasons over your analyst profile, the active
          situation, your saved sources, your uploaded documents, your
          graph, and the outputs you have already produced — so each
          answer compounds the last one. Built by practitioners with
          policy careers, deployed on Google Cloud, grounded in the open
          record.
        </motion.p>

        {/* Pillars row */}
        <div className="mb-20 grid gap-6 sm:grid-cols-3">
          {PILLAR_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
              className="rounded-2xl border border-diplomatic-blue/10 bg-white/70 p-6 shadow-sm shadow-navy-950/5 backdrop-blur-sm"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold-600/10 text-gold-700">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-serif text-xl text-navy-900">{card.title}</h3>
              <p className="text-sm leading-relaxed text-navy-600">{card.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Companion benefits */}
        <motion.h3
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6 }}
          className="mb-3 text-center font-serif text-3xl text-navy-950"
        >
          A companion you teach. An expert team you direct.
        </motion.h3>
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mb-12 max-w-3xl text-center text-base text-navy-500"
        >
          PRAXIS does not replace your judgment. It compresses the work
          around it — research, drafting, source-checking, structured
          analysis — so you can spend your time on the decisions only
          you can make.
        </motion.p>

        <div className="mb-20 grid gap-6 sm:grid-cols-2">
          {COMPANION_BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: 0.1 + (i % 2) * 0.05 }}
              className="flex gap-4 rounded-2xl border border-diplomatic-blue/10 bg-white/70 p-6 shadow-sm shadow-navy-950/5 backdrop-blur-sm"
            >
              <div className="shrink-0">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-diplomatic-blue/8 text-diplomatic-blue">
                  <benefit.icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <h4 className="mb-1.5 font-serif text-xl text-navy-900">{benefit.title}</h4>
                <p className="text-sm leading-relaxed text-navy-600">{benefit.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Domains */}
        <motion.h3
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6 }}
          className="mb-3 text-center font-serif text-3xl text-navy-950"
        >
          One platform. A general path and specific toolkits.
        </motion.h3>
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mb-10 max-w-3xl text-center text-base text-navy-500"
        >
          Pick the domain you work in. Frameworks, feeds, and tool defaults
          adapt automatically. The same calibration spine, the same expert
          team — but every output speaks the language of your field.
        </motion.p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((d, i) => (
            <motion.div
              key={d.label}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.55, delay: 0.05 + i * 0.04 }}
              className="rounded-xl border border-diplomatic-blue/10 bg-white/60 p-4 shadow-sm shadow-navy-950/5 backdrop-blur-sm"
            >
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-sage/10 text-sage">
                <d.icon className="h-4 w-4" />
              </div>
              <h5 className="text-sm font-semibold text-navy-900">{d.label}</h5>
              <p className="mt-1 text-xs leading-relaxed text-navy-500">{d.line}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
