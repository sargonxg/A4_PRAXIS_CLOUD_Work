"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Compass,
  GitBranch,
  Building2,
  FolderOpen,
  ChevronRight,
  Sparkles,
  BookOpen,
  Globe,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Typing animation text
const reportLines = [
  "I. Political and Security Situation",
  "",
  "1. The reporting period was marked by a significant",
  "escalation of hostilities in the eastern provinces,",
  "following the collapse of the ceasefire agreement",
  "on 14 February 2026.",
  "",
  "2. The Special Representative undertook a series of",
  "consultations with key stakeholders, including the",
  "Government, armed opposition groups, and regional",
  "mediators, to establish conditions for renewed",
  "dialogue.",
  "",
  "3. The humanitarian situation continued to deteriorate,",
  "with an estimated 2.4 million people displaced since",
];

function TypingText() {
  const [visibleChars, setVisibleChars] = useState(0);
  const fullText = reportLines.join("\n");

  useEffect(() => {
    if (visibleChars >= fullText.length) return;
    const timer = setTimeout(
      () => setVisibleChars((c) => c + 1),
      18
    );
    return () => clearTimeout(timer);
  }, [visibleChars, fullText.length]);

  return (
    <pre className="font-serif text-[10px] leading-[1.6] text-navy-300 whitespace-pre-wrap sm:text-xs">
      {fullText.slice(0, visibleChars)}
      <span className="animate-pulse text-gold-500">|</span>
    </pre>
  );
}

// Sidebar nav items
const sidebarItems = [
  { icon: FileText, label: "Report Studio", active: true },
  { icon: MessageSquare, label: "Diplomat AI", active: false },
  { icon: Compass, label: "Media Compass", active: false },
  { icon: GitBranch, label: "Conflict Graph", active: false },
  { icon: Building2, label: "UN Toolkit", active: false },
  { icon: FolderOpen, label: "Document Vault", active: false },
];

// Right panel source items
const sources = [
  { title: "S/2026/115 - UNMISS Report", type: "UN Document" },
  { title: "ICG Briefing - Eastern Escalation", type: "Analysis" },
  { title: "OCHA Situation Report #47", type: "Humanitarian" },
  { title: "Reuters - Peace talks collapse", type: "Media" },
];

const suggestions = [
  "Add reference to UNSC Resolution 2677",
  "Include displacement figures from OCHA",
  "Consider adding stakeholder mapping",
];

export function DemoPreview() {
  return (
    <section className="relative overflow-hidden bg-navy-950 px-6 py-28 lg:py-36">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-50 sm:text-4xl lg:text-5xl">
            See It in Action
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-400">
            From raw intelligence to polished diplomatic products in minutes, not
            days.
          </p>
        </motion.div>

        {/* Mock App Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-gold-500/10 via-navy-700/20 to-navy-900/0 blur-xl" />

          <div className="relative overflow-hidden rounded-xl border border-navy-700/50 bg-navy-900/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-navy-700/50 bg-navy-900 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-navy-600" />
                  <div className="h-2.5 w-2.5 rounded-full bg-navy-600" />
                  <div className="h-2.5 w-2.5 rounded-full bg-navy-600" />
                </div>
                <span className="ml-3 font-mono text-[10px] text-navy-500">
                  tacitus.app/studio/report
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xs uppercase tracking-[0.15em] text-gold-500/60">
                  Tacitus
                </span>
              </div>
            </div>

            {/* App content */}
            <div className="flex min-h-[400px] sm:min-h-[460px]">
              {/* Sidebar */}
              <div className="hidden w-48 shrink-0 border-r border-navy-700/40 bg-navy-900/60 p-3 md:block">
                <div className="mb-4 px-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-500">
                    Tools
                  </p>
                </div>
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={cn(
                        "mb-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors",
                        item.active
                          ? "bg-navy-800 text-gold-500"
                          : "text-navy-400"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Main content area */}
              <div className="flex-1 p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gold-500" />
                  <h3 className="text-sm font-semibold text-navy-200">
                    Secretary-General Report Draft
                  </h3>
                  <span className="ml-auto rounded-full border border-gold-500/20 bg-gold-500/10 px-2 py-0.5 text-[10px] font-medium text-gold-500">
                    AI Generating
                  </span>
                </div>

                {/* Report content with typing animation */}
                <div className="rounded-lg border border-navy-700/30 bg-navy-950/60 p-4">
                  <TypingText />
                </div>
              </div>

              {/* Right panel */}
              <div className="hidden w-56 shrink-0 border-l border-navy-700/40 bg-navy-900/40 p-4 lg:block">
                {/* Sources */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-teal" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-500">
                      Sources
                    </p>
                  </div>
                  {sources.map((s, i) => (
                    <div
                      key={i}
                      className="mb-2 rounded-md border border-navy-700/30 bg-navy-800/40 p-2"
                    >
                      <p className="text-[10px] font-medium leading-tight text-navy-300">
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-[9px] text-navy-500">
                        {s.type}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI Suggestions */}
                <div>
                  <div className="mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-gold-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-500">
                      Suggestions
                    </p>
                  </div>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="mb-2 flex items-start gap-1.5 rounded-md border border-navy-700/20 bg-gold-500/5 p-2"
                    >
                      <ChevronRight className="mt-0.5 h-2.5 w-2.5 shrink-0 text-gold-500/60" />
                      <p className="text-[10px] leading-tight text-navy-300">
                        {s}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-gold-500 transition-colors hover:text-gold-400"
          >
            <span className="text-sm font-semibold">Explore the Platform</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
