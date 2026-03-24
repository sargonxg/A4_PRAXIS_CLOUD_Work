"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  GitBranch,
  Calendar,
  ArrowRight,
  Sparkles,
  Globe,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Tab definitions
const tabs = [
  { id: "report", label: "Report Studio", icon: FileText },
  { id: "assistant", label: "Ask TACITUS", icon: MessageSquare },
  { id: "graph", label: "Conflict Graph", icon: GitBranch },
  { id: "calendar", label: "Calendar Monitor", icon: Calendar },
];

// Report Studio typing animation
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
];

function TypingText() {
  const [visibleChars, setVisibleChars] = useState(0);
  const fullText = reportLines.join("\n");

  useEffect(() => {
    if (visibleChars >= fullText.length) return;
    const timer = setTimeout(() => setVisibleChars((c) => c + 1), 18);
    return () => clearTimeout(timer);
  }, [visibleChars, fullText.length]);

  return (
    <pre className="font-serif text-[10px] leading-[1.6] text-navy-300 whitespace-pre-wrap sm:text-xs">
      {fullText.slice(0, visibleChars)}
      <span className="animate-pulse text-gold-500">|</span>
    </pre>
  );
}

// Assistant chat simulation
function AssistantDemo() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-diplomatic-blue/20 text-[8px] flex items-center justify-center text-navy-300">
          U
        </div>
        <div className="rounded-lg rounded-tl-sm bg-navy-800 px-3 py-2">
          <p className="text-[11px] text-navy-200">
            What are the key risks to the Nordalia ceasefire?
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-gold-500/20 text-[8px] flex items-center justify-center text-gold-400">
          P
        </div>
        <div className="rounded-lg rounded-tl-sm bg-navy-800/60 border border-navy-700/30 px-3 py-2">
          <p className="text-[11px] text-navy-200 leading-relaxed">
            Based on current analysis, the three primary risks are:
          </p>
          <ul className="mt-2 space-y-1.5 text-[10px] text-navy-300">
            <li className="flex items-start gap-1.5">
              <span className="text-crimson mt-0.5">1.</span>
              <span><strong className="text-navy-200">Spoiler actors:</strong> DRM hardliners in the Eastern Marches reject the framework</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-gold-400 mt-0.5">2.</span>
              <span><strong className="text-navy-200">Resource competition:</strong> Contested mining concessions in Belara Province</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-teal mt-0.5">3.</span>
              <span><strong className="text-navy-200">External intervention:</strong> Karovia military build-up on the northern border</span>
            </li>
          </ul>
          <p className="mt-2 text-[9px] text-navy-500 italic">
            Sources: UNMISS SITREP #47, ICG Briefing, OCHA Report
          </p>
        </div>
      </div>
    </div>
  );
}

// Graph mini preview
function GraphDemo() {
  const nodes = [
    { x: 50, y: 30, label: "Gov", color: "#4A90A4", r: 14 },
    { x: 20, y: 60, label: "DRM", color: "#A63D40", r: 12 },
    { x: 80, y: 55, label: "UNMN", color: "#4B92DB", r: 11 },
    { x: 35, y: 85, label: "Karovia", color: "#7B6D8D", r: 10 },
    { x: 65, y: 80, label: "CSO", color: "#5B8C5A", r: 9 },
  ];

  const edges = [
    { from: 0, to: 1, type: "adversarial" },
    { from: 0, to: 2, type: "cooperative" },
    { from: 1, to: 3, type: "allied" },
    { from: 2, to: 4, type: "supportive" },
    { from: 0, to: 4, type: "neutral" },
  ];

  return (
    <div className="flex h-full items-center justify-center p-4">
      <svg viewBox="0 0 100 100" className="h-full w-full max-h-[200px]">
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={nodes[edge.from].x}
            y1={nodes[edge.from].y}
            x2={nodes[edge.to].x}
            y2={nodes[edge.to].y}
            stroke={edge.type === "adversarial" ? "#A63D40" : "#334155"}
            strokeWidth={0.5}
            strokeOpacity={0.4}
            strokeDasharray={edge.type === "adversarial" ? "2,2" : undefined}
          />
        ))}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r={node.r / 2} fill={node.color} opacity={0.15} />
            <circle cx={node.x} cy={node.y} r={2} fill={node.color} />
            <text
              x={node.x}
              y={node.y + node.r / 2 + 5}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="3.5"
              fontFamily="var(--font-sans)"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// Calendar preview
function CalendarDemo() {
  const events = [
    { time: "10:00", title: "UNSC Open Debate: Protection of Civilians", inst: "UN Security Council", color: "#4B92DB" },
    { time: "14:30", title: "AU PSC 1187th Meeting: Sahel Situation", inst: "African Union", color: "#E8B931" },
    { time: "16:00", title: "EU FAC: Eastern Partnership Review", inst: "EU Council", color: "#3D5A80" },
  ];

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-3.5 w-3.5 text-gold-500" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-500">
          Today &middot; 2 March 2026
        </p>
      </div>
      {events.map((event, i) => (
        <div key={i} className="rounded-md border border-navy-700/30 bg-navy-800/40 p-2.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: event.color }} />
            <span className="text-[9px] font-mono text-navy-500">{event.time}</span>
            <span className="rounded-full px-1.5 py-0.5 text-[8px] font-medium" style={{ backgroundColor: `${event.color}15`, color: event.color }}>
              {event.inst}
            </span>
          </div>
          <p className="mt-1 text-[10px] font-medium text-navy-300">{event.title}</p>
          <span className="mt-1 inline-block rounded-full bg-gold-500/10 px-1.5 py-0.5 text-[8px] text-gold-400">
            AI Brief Available
          </span>
        </div>
      ))}
    </div>
  );
}

export function DemoPreview() {
  const [activeTab, setActiveTab] = useState("report");
  const [progress, setProgress] = useState(0);

  // Auto-advance tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setActiveTab((current) => {
            const idx = tabs.findIndex((t) => t.id === current);
            return tabs[(idx + 1) % tabs.length].id;
          });
          return 0;
        }
        return p + 100 / 80; // ~8 seconds per tab
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setProgress(0);
  };

  return (
    <section id="demo" className="relative overflow-hidden px-6 py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Live Demo</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            See It in Action
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            From raw intelligence to polished diplomatic products in minutes, not
            days.
          </p>
        </motion.div>

        {/* Tab bar with progress */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg border border-cream-300 bg-white/60 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-navy-900 text-white shadow-sm"
                      : "text-navy-600 hover:text-navy-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {/* Progress bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1 right-1 h-0.5 overflow-hidden rounded-full bg-navy-700">
                      <div
                        className="h-full bg-gold-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mock App Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative overflow-hidden rounded-xl border border-navy-700/50 bg-navy-900/95 shadow-2xl shadow-navy-950/30">
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-navy-700/50 bg-navy-950 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-crimson/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gold-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-sage/60" />
                </div>
                <span className="ml-3 font-mono text-[10px] text-navy-500">
                  praxis.tacitus.ai/{activeTab === "report" ? "studio/report" : activeTab}
                </span>
              </div>
              <span className="font-serif text-xs tracking-wide text-gold-500/60">
                PRAXIS
              </span>
            </div>

            {/* Content */}
            <div className="min-h-[360px] sm:min-h-[400px]">
              {activeTab === "report" && (
                <div className="flex h-full">
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
                    <div className="rounded-lg border border-navy-700/30 bg-navy-950/60 p-4">
                      <TypingText />
                    </div>
                  </div>
                  <div className="hidden w-52 shrink-0 border-l border-navy-700/40 bg-navy-900/40 p-4 lg:block">
                    <div className="mb-4 flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-teal" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-500">Sources</p>
                    </div>
                    {["S/2026/115 - UNMISS Report", "ICG Briefing", "OCHA Report #47"].map((s, i) => (
                      <div key={i} className="mb-2 rounded-md border border-navy-700/30 bg-navy-800/40 p-2">
                        <p className="text-[10px] font-medium text-navy-300">{s}</p>
                      </div>
                    ))}
                    <div className="mt-4 mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-gold-500" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-500">Suggestions</p>
                    </div>
                    {["Add UNSC Res. 2677 reference", "Include displacement data"].map((s, i) => (
                      <div key={i} className="mb-2 flex items-start gap-1.5 rounded-md bg-gold-500/5 p-2 border border-navy-700/20">
                        <ChevronRight className="mt-0.5 h-2.5 w-2.5 shrink-0 text-gold-500/60" />
                        <p className="text-[10px] text-navy-300">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "assistant" && <AssistantDemo />}
              {activeTab === "graph" && <GraphDemo />}
              {activeTab === "calendar" && <CalendarDemo />}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 text-center"
        >
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 text-gold-700 transition-colors hover:text-gold-600"
          >
            <span className="text-sm font-semibold">Try the Full Demo</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
