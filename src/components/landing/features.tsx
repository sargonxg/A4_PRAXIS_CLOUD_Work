"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Compass,
  GitBranch,
  MessageCircle,
  Users,
  Calendar,
  Shield,
  AlertTriangle,
  Lock,
  Handshake,
  Languages,
  Search,
  Smartphone,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tier1 = [
  {
    title: "Report Studio",
    icon: FileText,
    color: "text-gold-600",
    bgColor: "bg-gold-600/5",
    borderHover: "hover:border-gold-600/30",
    description:
      "AI-generated diplomatic products \u2014 SG reports, cables, SITREPs, briefing notes \u2014 with source citations and UN formatting.",
  },
  {
    title: "Conflict Intelligence Graph",
    icon: GitBranch,
    color: "text-sage",
    bgColor: "bg-sage/5",
    borderHover: "hover:border-sage/30",
    description:
      "Temporal knowledge graph built on 8 Conflict Grammar\u2122 primitives. Map actors, claims, interests, and commitments over time.",
  },
  {
    title: "PRAXIS Assistant",
    icon: MessageSquare,
    color: "text-teal",
    bgColor: "bg-teal/5",
    borderHover: "hover:border-teal/30",
    description:
      "Context-aware AI specialized in peace & security analysis. Ask questions, get structured assessments with sourced evidence.",
  },
  {
    title: "Media Compass",
    icon: Compass,
    color: "text-terracotta",
    bgColor: "bg-terracotta/5",
    borderHover: "hover:border-terracotta/30",
    description:
      "Source reliability \u00D7 political orientation mapping with real-time monitoring across 45+ global media outlets.",
  },
];

const tier2 = [
  {
    title: "Talking Points Generator",
    icon: MessageCircle,
    description:
      "Auto-generate structured talking points from any brief, with sourced references and rhetorical framing options.",
  },
  {
    title: "Stakeholder Mapper",
    icon: Users,
    description:
      "Visual network analysis of actors, alliances, and influence pathways \u2014 auto-populated from ingested documents.",
  },
  {
    title: "Calendar Monitor",
    icon: Calendar,
    description:
      "Track UNSC, General Assembly, AU PSC, EU Parliament, and regional body schedules with AI-powered agenda previews.",
  },
  {
    title: "Sanctions & Resolutions Tracker",
    icon: Shield,
    description:
      "Live database of UNSC resolutions, sanctions regimes, and arms embargoes with compliance alerts.",
  },
  {
    title: "Early Warning Dashboard",
    icon: AlertTriangle,
    description:
      "Risk scoring across monitored situations using predictive indicators and ACLED-integrated analysis.",
  },
  {
    title: "Secure Document Vault",
    icon: Lock,
    description:
      "End-to-end encrypted document storage with AI extraction, cross-referencing, and version control.",
  },
];

const tier3 = [
  {
    title: "Negotiation Prep Kit",
    icon: Handshake,
    description: "BATNA/ZOPA analysis, concession tracking, precedent lookup for mediation sessions.",
  },
  {
    title: "Multi-Language Brief Translator",
    icon: Languages,
    description: "Diplomatic-grade translation preserving UN terminology and political nuance.",
  },
  {
    title: "Comparative Precedent Engine",
    icon: Search,
    description: "Search historical peace agreements, resolutions, and frameworks for similar situations.",
  },
  {
    title: "Field Reporting Companion",
    icon: Smartphone,
    description: "Mobile-optimized quick reporting with offline capability, GPS tagging, and secure sync.",
  },
  {
    title: "Delegation Briefing Builder",
    icon: Briefcase,
    description: "Auto-compile country briefing packages: political context, key contacts, talking points, protocol notes.",
  },
];

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

type TabKey = "core" | "workflow" | "advanced";

export function Features() {
  const [activeTab, setActiveTab] = useState<TabKey>("core");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "core", label: "Core Intelligence", count: 4 },
    { key: "workflow", label: "Daily Workflow", count: 6 },
    { key: "advanced", label: "Advanced", count: 5 },
  ];

  return (
    <section id="features" className="relative px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Platform</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 text-center"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            15 Tools. One Workspace. Zero Switching.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            Not another chatbot. Not another dashboard. The first platform
            purpose-built for the daily work of conflict analysis and diplomatic
            reporting.
          </p>
        </motion.div>

        {/* Tab selector */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-lg border border-cream-300 bg-white/60 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  activeTab === tab.key
                    ? "bg-diplomatic-blue text-white shadow-sm"
                    : "text-navy-600 hover:text-navy-900 hover:bg-cream-200/50"
                )}
              >
                {tab.label}
                <span className={cn(
                  "ml-2 rounded-full px-1.5 py-0.5 text-[10px]",
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-cream-200 text-navy-500"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Core Intelligence - hero cards */}
        {activeTab === "core" && (
          <motion.div
            key="core"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {tier1.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={cardVariants}
                  className="group"
                >
                  <div
                    className={cn(
                      "relative h-full rounded-xl border border-cream-300/60 bg-white/70 p-8 transition-all duration-300",
                      "hover:-translate-y-1 hover:shadow-lg hover:shadow-navy-950/5",
                      feature.borderHover
                    )}
                  >
                    <div
                      className={cn(
                        "mb-5 inline-flex rounded-xl p-3",
                        feature.bgColor,
                        feature.color
                      )}
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold tracking-tight text-navy-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-navy-500">
                      {feature.description}
                    </p>
                    <div className="mt-5 flex items-center gap-1 text-sm font-medium text-gold-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      Explore <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Daily Workflow - 3-column grid */}
        {activeTab === "workflow" && (
          <motion.div
            key="workflow"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {tier2.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={cardVariants}
                  className="group"
                >
                  <div className="relative h-full rounded-xl border border-cream-300/60 bg-white/70 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-navy-950/5 hover:border-diplomatic-blue/20">
                    <div className="mb-4 inline-flex rounded-lg bg-diplomatic-blue/5 p-2.5 text-diplomatic-blue">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-2 text-base font-semibold tracking-tight text-navy-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-navy-500">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Advanced - compact list */}
        {activeTab === "advanced" && (
          <motion.div
            key="advanced"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="mx-auto max-w-3xl space-y-3"
          >
            {tier3.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={cardVariants}
                  className="group flex items-start gap-4 rounded-xl border border-cream-300/60 bg-white/70 p-5 transition-all duration-200 hover:border-diplomatic-blue/20 hover:shadow-sm"
                >
                  <div className="shrink-0 rounded-lg bg-diplomatic-blue/5 p-2.5 text-diplomatic-blue">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-navy-900">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-navy-500">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
