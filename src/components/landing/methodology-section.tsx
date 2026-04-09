"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  Scale,
  Globe,
  Target,
  Zap,
  BookOpen,
  Layers,
  Network,
  AlertTriangle,
  FileText,
  Radio,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Framework {
  name: string;
  author: string;
  icon: typeof BarChart3;
  color: string;
  bg: string;
  category: "risk" | "escalation" | "negotiation" | "power" | "humanitarian";
  description: string;
}

const FRAMEWORKS: Framework[] = [
  {
    name: "Glasl Escalation Model",
    author: "Friedrich Glasl (1982)",
    icon: TrendingUp,
    color: "text-amber-600",
    bg: "bg-amber-50",
    category: "escalation",
    description:
      "9-stage escalation model mapping conflict intensity from hardening to abyss. Three zones: Win-Win, Win-Lose, Lose-Lose.",
  },
  {
    name: "INFORM Risk Index",
    author: "IASC/EC Joint Research Centre",
    icon: BarChart3,
    color: "text-red-600",
    bg: "bg-red-50",
    category: "risk",
    description:
      "Composite risk index measuring Hazard & Exposure, Vulnerability, and Lack of Coping Capacity across 191 countries.",
  },
  {
    name: "Fisher-Ury Principled Negotiation",
    author: "Fisher, Ury & Patton (1981)",
    icon: Target,
    color: "text-diplomatic-blue",
    bg: "bg-diplomatic-blue/10",
    category: "negotiation",
    description:
      "Interest-based negotiation separating positions from interests. Foundation of the Harvard Program on Negotiation.",
  },
  {
    name: "Barnett-Duvall Power Taxonomy",
    author: "Barnett & Duvall (2005)",
    icon: Zap,
    color: "text-purple-600",
    bg: "bg-purple-50",
    category: "power",
    description:
      "Four faces of power: Compulsory, Institutional, Structural, Productive. Maps asymmetries in conflict dynamics.",
  },
  {
    name: "Zartman Ripeness Theory",
    author: "I. William Zartman (2000)",
    icon: Scale,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    category: "negotiation",
    description:
      "Identifies Mutually Hurting Stalemate + Way Out as preconditions for negotiation. Guides timing of mediation.",
  },
  {
    name: "Mitchell-Agle-Wood Stakeholder Theory",
    author: "Mitchell, Agle & Wood (1997)",
    icon: Users,
    color: "text-sky-600",
    bg: "bg-sky-50",
    category: "power",
    description:
      "Power-Legitimacy-Urgency taxonomy classifying stakeholder salience. 7 types from dormant to definitive.",
  },
  {
    name: "Stedman Spoiler Theory",
    author: "Stephen J. Stedman (1997)",
    icon: Shield,
    color: "text-rose-600",
    bg: "bg-rose-50",
    category: "escalation",
    description:
      "Total, Limited, Greedy spoiler typology. Explains why peace processes fail and how to manage intransigent actors.",
  },
  {
    name: "Lederach Peacebuilding Pyramid",
    author: "John Paul Lederach (1997)",
    icon: Layers,
    color: "text-teal-600",
    bg: "bg-teal-50",
    category: "negotiation",
    description:
      "Track I/II/III multi-level peacebuilding framework connecting top leaders, mid-range, and grassroots.",
  },
  {
    name: "Galtung Violence Triangle",
    author: "Johan Galtung (1969)",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    category: "risk",
    description:
      "Direct, Structural, Cultural violence framework. Reveals invisible violence sustaining visible conflict.",
  },
  {
    name: "NATO STRATCOM 4D Framework",
    author: "Ben Nimmo (2019)",
    icon: Radio,
    color: "text-slate-600",
    bg: "bg-slate-50",
    category: "escalation",
    description:
      "Dismiss, Distort, Distract, Dismay. Detects information operations and narrative manipulation in conflict zones.",
  },
  {
    name: "IPC Food Security Phases",
    author: "IPC Global Partners",
    icon: Globe,
    color: "text-green-600",
    bg: "bg-green-50",
    category: "humanitarian",
    description:
      "5-phase classification from Minimal to Famine. Standard for humanitarian response planning and early warning.",
  },
  {
    name: "Putnam Two-Level Games",
    author: "Robert Putnam (1988)",
    icon: Network,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    category: "negotiation",
    description:
      "Domestic-international negotiation linkage. Explains why leaders accept or reject deals based on domestic win-sets.",
  },
  {
    name: "Berghof Mediation Process",
    author: "Berghof Foundation",
    icon: Compass,
    color: "text-violet-600",
    bg: "bg-violet-50",
    category: "negotiation",
    description:
      "6-phase mediation framework: pre-negotiation through consolidation. Guides sequencing of peace process design.",
  },
  {
    name: "Fearon Rationalist Causes of War",
    author: "James Fearon (1995)",
    icon: BookOpen,
    color: "text-navy-600",
    bg: "bg-navy-50",
    category: "risk",
    description:
      "Information asymmetry, commitment problems, indivisibility. Diagnoses why armed conflict persists despite costs.",
  },
  {
    name: "UN DPPA Analytical Standards",
    author: "UN Department of Political Affairs",
    icon: FileText,
    color: "text-diplomatic-blue",
    bg: "bg-diplomatic-blue/8",
    category: "humanitarian",
    description:
      "Standardized situation report formats, morning brief protocols, and political analysis frameworks used by UN missions worldwide.",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  risk: "Risk Assessment",
  escalation: "Escalation & Early Warning",
  negotiation: "Negotiation & Mediation",
  power: "Power & Stakeholder Analysis",
  humanitarian: "Humanitarian & Institutional",
};

const CATEGORY_ORDER = [
  "risk",
  "escalation",
  "negotiation",
  "power",
  "humanitarian",
];

export function MethodologySection() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      {/* Subtle background */}
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

        {/* Framework grid by category */}
        <div className="mt-16 space-y-12">
          {CATEGORY_ORDER.map((category) => {
            const frameworks = FRAMEWORKS.filter(
              (f) => f.category === category
            );
            return (
              <div key={category}>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-navy-400">
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {frameworks.map((fw, i) => (
                    <motion.div
                      key={fw.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="group rounded-xl border border-navy-100 bg-white p-5 transition-all hover:border-navy-200 hover:shadow-sm"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            fw.bg
                          )}
                        >
                          <fw.icon className={cn("h-4.5 w-4.5", fw.color)} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-navy-900">
                            {fw.name}
                          </h4>
                          <p className="text-[10px] text-navy-400">
                            {fw.author}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-navy-500">
                        {fw.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 rounded-xl border border-gold-500/20 bg-gold-500/5 px-6 py-4 text-center"
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
