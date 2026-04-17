"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  Target,
  Users,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

export function MethodologySection() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1B3A5C 0.5px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-600"
          >
            Analytical Rigour
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl font-normal tracking-tight text-navy-950 sm:text-4xl"
          >
            Built on 15 Peer-Reviewed Frameworks
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base leading-relaxed text-navy-500"
          >
            Every assessment in PRAXIS is grounded in established conflict
            analysis methodology. Not black-box AI — transparent, auditable
            analytical reasoning that practitioners trust.
          </motion.p>
        </div>

        {/* Framework grid — top 5 */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_FRAMEWORKS.map((fw, i) => (
            <motion.div
              key={fw.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="group rounded-xl border border-navy-100 bg-white p-5 transition-all hover:border-navy-200 hover:shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    fw.bg
                  )}
                >
                  <fw.icon className={cn("h-4 w-4", fw.color)} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-navy-900">
                    {fw.name}
                  </h4>
                  <p className="text-[10px] text-navy-400">{fw.author}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-navy-500">
                {fw.description}
              </p>
            </motion.div>
          ))}

          {/* "+10 more" callout card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: FEATURED_FRAMEWORKS.length * 0.07 }}
            className="flex items-center justify-center rounded-xl border border-dashed border-navy-200 bg-navy-50/40 p-5"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-diplomatic-blue">+10</p>
              <p className="mt-1 text-sm font-medium text-navy-700">
                more frameworks built in
              </p>
              <p className="mt-2 text-xs text-navy-400">
                Stedman · Lederach · Galtung · Putnam · Berghof · Fearon · and more
              </p>
            </div>
          </motion.div>
        </div>

        {/* Methodology transparency note */}
        <motion.div
          initial={{ opacity: 0 }}
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
