"use client";

import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Compass,
  GitBranch,
  Building2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const features = [
  {
    title: "Report Studio",
    icon: FileText,
    color: "text-gold-500",
    borderColor: "group-hover:border-gold-500/40",
    glowColor: "group-hover:shadow-gold-500/10",
    description:
      "AI-powered generation of diplomatic products — from Secretary-General reports to political cables.",
  },
  {
    title: "Diplomatic Assistant",
    icon: MessageSquare,
    color: "text-teal",
    borderColor: "group-hover:border-teal/40",
    glowColor: "group-hover:shadow-teal/10",
    description:
      "Context-aware AI specialized in peace, security, and conflict analysis writing.",
  },
  {
    title: "Media Compass",
    icon: Compass,
    color: "text-terracotta",
    borderColor: "group-hover:border-terracotta/40",
    glowColor: "group-hover:shadow-terracotta/10",
    description:
      "Map news sources on political orientation and reliability axes for conflict coverage.",
  },
  {
    title: "Conflict Intelligence Graph",
    icon: GitBranch,
    color: "text-sage",
    borderColor: "group-hover:border-sage/40",
    glowColor: "group-hover:shadow-sage/10",
    description:
      "Temporal knowledge graph of disputes, actors, and their relationships.",
  },
  {
    title: "UN Toolkit",
    icon: Building2,
    color: "text-steel",
    borderColor: "group-hover:border-steel/40",
    glowColor: "group-hover:shadow-steel/10",
    description:
      "Specialized tools for UN document standards, terminology, and resolution drafting.",
  },
  {
    title: "Document Vault",
    icon: FolderOpen,
    color: "text-purple",
    borderColor: "group-hover:border-purple/40",
    glowColor: "group-hover:shadow-purple/10",
    description:
      "Secure upload, AI extraction, and cross-reference of conflict documents.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export function Features() {
  return (
    <section id="features" className="relative bg-navy-950 px-6 py-28 lg:py-36">
      {/* Subtle top fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy-950 to-transparent" />

      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center lg:mb-20"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-50 sm:text-4xl lg:text-5xl">
            Intelligence Tools for Complex Conflicts
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-400">
            A comprehensive suite designed for the unique demands of peace,
            security, and diplomatic analysis.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group"
              >
                <div
                  className={cn(
                    "relative h-full rounded-xl border border-navy-700/50 bg-navy-800/50 p-7 transition-all duration-300",
                    "hover:-translate-y-1 hover:shadow-xl",
                    feature.borderColor,
                    feature.glowColor
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "mb-5 inline-flex rounded-lg border border-navy-700/50 bg-navy-900/80 p-3",
                      feature.color
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-lg font-semibold tracking-tight text-navy-50">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-navy-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
