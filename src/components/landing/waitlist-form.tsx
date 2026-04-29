"use client";

/**
 * "Talk to TACITUS" — replaces the old waitlist form.
 *
 * The product is now in early access without a queue. Visitors who want
 * to engage commercially or institutionally write to hello@tacitus.me;
 * everyone else can spin up the live workspace or the demo from /login.
 *
 * The section also positions TACITUS itself: PRAXIS is the first surface
 * of an AI-native stack we are building for statecraft.
 */

import { motion, useReducedMotion } from "framer-motion";
import { Mail, ArrowUpRight, Sparkles } from "lucide-react";

const PILLARS = [
  {
    label: "Today",
    title: "PRAXIS",
    body: "Policy and conflict-intelligence workspace for diplomats, conflict analysts, mediators, and policy officers. Live now.",
  },
  {
    label: "Next",
    title: "Calibrated agents",
    body: "Mandate-aware agents for monitoring, briefing, and negotiation prep, governed by the same source and review constraints as PRAXIS.",
  },
  {
    label: "Building",
    title: "Institutional graph",
    body: "Shared knowledge graph for ministries, missions, and research institutes — your sources, your taxonomy, your doctrine.",
  },
];

export function WaitlistForm() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section id="contact" className="relative overflow-hidden px-6 py-28 lg:py-36">
      {/* Warm gradient background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-cream-100 via-cream-200/40 to-cream-100"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(232,185,49,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(75,146,219,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Eyebrow */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-5 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-600/20 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-gold-600" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">
              TACITUS · AI-native stack for statecraft
            </span>
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-5 text-center font-serif text-4xl leading-[1.1] tracking-tight text-navy-950 sm:text-5xl"
        >
          Talk to <span className="text-gold-600">TACITUS</span>.
        </motion.h2>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mx-auto mb-12 max-w-2xl text-center text-lg leading-relaxed text-navy-500"
        >
          PRAXIS is the first surface of an AI-native stack TACITUS is
          building for statecraft: software that keeps policy analysis tied
          to sources, methods, institutional context, and human review.
          Pilots, partnerships, and institutional access start with one email.
        </motion.p>

        {/* CTA pair */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mb-14 flex max-w-3xl flex-col items-stretch justify-center gap-3 sm:flex-row"
        >
          <a
            href="mailto:hello@tacitus.me?subject=PRAXIS%20%E2%80%94%20introduction"
            className="group inline-flex flex-1 items-center justify-center gap-3 rounded-md bg-navy-950 px-7 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-navy-900 hover:shadow-xl hover:shadow-navy-950/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
          >
            <Mail className="h-4 w-4 text-gold-400" />
            <span>hello@tacitus.me</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="https://tacitus.me"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex flex-1 items-center justify-center gap-3 rounded-md border border-diplomatic-blue/25 bg-white/80 px-7 py-4 text-base font-semibold text-diplomatic-blue transition-all duration-200 hover:border-diplomatic-blue/45 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40"
          >
            <span>Visit tacitus.me</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>

        {/* What TACITUS is building */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-6 text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-500">
            What TACITUS is building
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: 0.25 + i * 0.06 }}
              className="rounded-2xl border border-diplomatic-blue/12 bg-white/85 p-5 shadow-sm shadow-navy-950/5 backdrop-blur-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-700">
                  {p.label}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500/70" />
              </div>
              <h3 className="font-serif text-xl text-navy-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{p.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Closing line */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-12 text-center text-xs text-navy-400"
        >
          Built by practitioners with statecraft careers · Deployed on Google Cloud · Source-grounded workspace per tenant
        </motion.p>
      </div>
    </section>
  );
}
