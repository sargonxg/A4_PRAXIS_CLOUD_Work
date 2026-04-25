"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  AlertTriangle,
  Search,
  Scale,
  HeartPulse,
  FileText,
} from "lucide-react";

const capabilities = [
  {
    icon: Building2,
    title: "Policy Officer",
    color: "text-diplomatic-blue",
    bgColor: "bg-diplomatic-blue/8",
    borderHover: "hover:border-diplomatic-blue/25",
    description:
      "Dashboard, Daily Brief, Policy Memo, Actor Profiles, and Source Monitor convert live sources into decision-ready policy options.",
  },
  {
    icon: AlertTriangle,
    title: "Political Affairs Desk",
    color: "text-crimson",
    bgColor: "bg-crimson/8",
    borderHover: "hover:border-crimson/20",
    description:
      "Early Warning, Risk Monitor, Timeline, Conflict Graph, and Commitment Tracker expose escalation shifts and diplomatic windows.",
  },
  {
    icon: Search,
    title: "Research Analyst",
    color: "text-gold-700",
    bgColor: "bg-gold-600/8",
    borderHover: "hover:border-gold-600/20",
    description:
      "Deep Research, ARGUS, Compare, Case Library, and canonical entity checks support cited, reproducible conflict research.",
  },
  {
    icon: Scale,
    title: "Mediator or Envoy Team",
    color: "text-sage",
    bgColor: "bg-sage/8",
    borderHover: "hover:border-sage/20",
    description:
      "Negotiation Prep, Mediation Designer, CONCORDIA, Scenario Planner, and Power Map help design credible process options.",
  },
  {
    icon: HeartPulse,
    title: "Humanitarian Coordinator",
    color: "text-teal",
    bgColor: "bg-teal/8",
    borderHover: "hover:border-teal/20",
    description:
      "Humanitarian Snapshot, Geospatial Monitor, Risk Monitor, ReliefWeb/HDX feeds, and alerts connect protection concerns to operations.",
  },
  {
    icon: FileText,
    title: "Legal and Sanctions Analyst",
    color: "text-navy-600",
    bgColor: "bg-navy-600/8",
    borderHover: "hover:border-navy-200",
    description:
      "Treaty Analyzer, Legal Tracker, Human Rights Monitor, Sanctions Tracker, and UN Toolkit support evidence-aware drafting.",
  },
];

export function UseCaseCards() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section id="capabilities" className="relative px-6 py-24 lg:py-32">
      {/* Subtle gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cream-100/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Buyer Paths</span>
        </motion.div>

        <motion.h2
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-4 text-center font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl"
        >
          Specific Workflows for Specific Practitioners.
        </motion.h2>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center text-lg text-navy-500"
        >
          PRAXIS is organized around the work policy, diplomacy, and political
          professionals actually need to complete.
        </motion.p>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : i * 0.08 }}
                className="group"
              >
                <div
                  className={`relative h-full rounded-xl border border-cream-300/60 bg-white/70 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy-950/5 ${item.borderHover}`}
                >
                  {/* Icon */}
                  <div
                    className={`mb-5 inline-flex rounded-xl p-3 ${item.bgColor} ${item.color}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                  </div>

                  {/* Title */}
                  <h3
                    className={`mb-3 text-base font-semibold leading-snug tracking-tight ${item.color}`}
                  >
                    {item.title}
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
