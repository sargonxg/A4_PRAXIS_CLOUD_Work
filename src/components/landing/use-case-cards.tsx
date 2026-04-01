"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Handshake,
  HeartHandshake,
  BookOpen,
  Users,
} from "lucide-react";

const useCases = [
  {
    icon: Globe,
    role: "UN Political Affairs Officer",
    tagline: "Monitor a peace process in real time",
    description:
      "Track ceasefire compliance, commitment implementation, and actor positions across a live peace process. PRAXIS synthesizes ACLED events, UN reporting, and media intelligence into a single dashboard — with SG report drafts ready for review in minutes.",
    color: "text-diplomatic-blue",
    bgColor: "bg-diplomatic-blue/5",
    borderHover: "hover:border-diplomatic-blue/30",
  },
  {
    icon: BookOpen,
    role: "Think Tank Analyst",
    tagline: "Produce a conflict assessment backed by data",
    description:
      "Run structured escalation scoring, actor network analysis, and scenario simulations grounded in ACLED, GDELT, and UCDP data. Export publication-ready assessments with full source citations and analytical methodology.",
    color: "text-gold-600",
    bgColor: "bg-gold-600/5",
    borderHover: "hover:border-gold-600/30",
  },
  {
    icon: HeartHandshake,
    role: "NGO Field Coordinator",
    tagline: "Track humanitarian access conditions on the ground",
    description:
      "Monitor access constraints, displacement trends, and protection incidents across operational areas. PRAXIS cross-references HDX, UNHCR, and ReliefWeb feeds — giving field teams the intelligence to negotiate access and prioritize response.",
    color: "text-teal",
    bgColor: "bg-teal/5",
    borderHover: "hover:border-teal/30",
  },
  {
    icon: Users,
    role: "Academic Researcher",
    tagline: "Study conflict dynamics with structured data tools",
    description:
      "Build longitudinal conflict timelines, extract entity relationships from primary documents, and run comparative analysis across cases. PRAXIS applies Glasl, Galtung, and Zartman frameworks to structure your research systematically.",
    color: "text-sage",
    bgColor: "bg-sage/5",
    borderHover: "hover:border-sage/30",
  },
  {
    icon: Handshake,
    role: "Diplomat",
    tagline: "Prepare for Security Council consultations",
    description:
      "Build comprehensive briefing packages in minutes: political context, actor positions, key resolutions, talking points, and anticipated objections — structured for closed Security Council consultations or bilateral preparation.",
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

        {/* Cards Grid */}
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
