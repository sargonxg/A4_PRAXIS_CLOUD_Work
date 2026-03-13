"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Handshake,
  Shield,
  HeartHandshake,
  BarChart2,
  Lightbulb,
} from "lucide-react";

const useCases = [
  {
    icon: Globe,
    role: "UN Political Affairs Officer",
    tagline: "Draft an SG report in hours, not weeks",
    description:
      "Auto-generate Secretary-General reports, background notes, and SITREPs with UN formatting, source citations, and structured analysis — ready for review in minutes.",
    color: "text-diplomatic-blue",
    bgColor: "bg-diplomatic-blue/5",
    borderHover: "hover:border-diplomatic-blue/30",
  },
  {
    icon: Handshake,
    role: "Mediation Team Leader",
    tagline: "Map every party's BATNA before you enter the room",
    description:
      "Build comprehensive negotiation prep kits: actor interests, red lines, BATNA/ZOPA analysis, and historical precedents — structured and ready before your first session.",
    color: "text-sage",
    bgColor: "bg-sage/5",
    borderHover: "hover:border-sage/30",
  },
  {
    icon: Shield,
    role: "Multilateral Analyst",
    tagline: "Synthesize intelligence across sources in minutes",
    description:
      "Rapidly synthesize cross-source intelligence into concise briefings with risk scoring, escalation indicators, and recommended actions — ready for senior decision-makers.",
    color: "text-crimson",
    bgColor: "bg-crimson/5",
    borderHover: "hover:border-crimson/30",
  },
  {
    icon: HeartHandshake,
    role: "Humanitarian Coordinator",
    tagline: "Negotiate access with structured leverage analysis",
    description:
      "Identify leverage points, map party interests, and build structured access negotiation frameworks for complex humanitarian situations.",
    color: "text-gold-600",
    bgColor: "bg-gold-600/5",
    borderHover: "hover:border-gold-600/30",
  },
  {
    icon: BarChart2,
    role: "Conflict Researcher",
    tagline: "Track 50 conflicts with one dashboard",
    description:
      "Monitor multiple conflict situations simultaneously with AI-synthesized updates, entity tracking, and temporal analysis across your entire research portfolio.",
    color: "text-teal",
    bgColor: "bg-teal/5",
    borderHover: "hover:border-teal/30",
  },
  {
    icon: Lightbulb,
    role: "Policy Planner",
    tagline: "Test policy options against AI-simulated actor responses",
    description:
      "Run scenario analysis to stress-test policy options, model actor reactions, and identify second-order consequences before committing to a course of action.",
    color: "text-navy-600",
    bgColor: "bg-navy-600/5",
    borderHover: "hover:border-navy-600/20",
  },
];

export function UseCaseCards() {
  return (
    <section id="use-cases" className="relative px-6 py-24 lg:py-32">
      {/* Subtle gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cream-100/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Who It&apos;s For</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-4 text-center"
        >
          <h2 className="font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Built for the Practitioners Who Shape Peace
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center text-lg text-navy-500"
        >
          From Security Council briefings to field mediation, PRAXIS adapts to
          the workflows that matter most.
        </motion.p>

        {/* 3×2 Card Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <div
                  className={`relative h-full rounded-xl border border-cream-300/60 bg-white/70 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy-950/5 ${item.borderHover}`}
                >
                  {/* Icon */}
                  <div
                    className={`mb-5 inline-flex rounded-xl p-3 ${item.bgColor} ${item.color}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>

                  {/* Role */}
                  <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${item.color}`}>
                    {item.role}
                  </p>

                  {/* Tagline */}
                  <h3 className="mb-3 text-base font-semibold leading-snug tracking-tight text-navy-900">
                    &ldquo;{item.tagline}&rdquo;
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-navy-500">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
