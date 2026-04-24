"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// --- Word-by-word reveal ---

const headlineWords = [
  "From",
  "Raw",
  "Sources",
  "to",
  "Credible",
  "Intelligence.",
  "In",
  "Minutes,",
  "Not",
  "Weeks.",
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// --- Practitioner backgrounds (aspirational fit, not endorsements) ---
const practitionerBackgrounds = [
  "Multilateral Missions",
  "Foreign Ministries",
  "Conflict Research Institutes",
  "Mediation Teams",
  "Humanitarian Leadership",
  "Policy Think Tanks",
];

// ---- Animated Conflict Graph SVG ----
// 7 nodes: 3 state actors, 2 armed groups, 1 institution, 1 norm
const NODES = [
  { id: 0, x: 50, y: 50, r: 14, color: "#4E79A7", label: "State A", type: "state" },
  { id: 1, x: 82, y: 30, r: 10, color: "#E15759", label: "Armed Group", type: "armed_group" },
  { id: 2, x: 82, y: 72, r: 10, color: "#4E79A7", label: "State B", type: "state" },
  { id: 3, x: 20, y: 22, r: 8, color: "#76B7B2", label: "UN Mission", type: "institution" },
  { id: 4, x: 22, y: 76, r: 8, color: "#F28E2B", label: "Claim", type: "claim" },
  { id: 5, x: 65, y: 85, r: 7, color: "#FF9DA7", label: "Narrative", type: "narrative" },
  { id: 6, x: 65, y: 15, r: 7, color: "#EDC948", label: "Leverage", type: "leverage" },
];

const EDGES = [
  { from: 0, to: 1, type: "antagonistic" },
  { from: 0, to: 2, type: "cooperative" },
  { from: 0, to: 3, type: "cooperative" },
  { from: 0, to: 4, type: "structural" },
  { from: 1, to: 5, type: "structural" },
  { from: 2, to: 5, type: "causal" },
  { from: 3, to: 6, type: "cooperative" },
  { from: 1, to: 6, type: "antagonistic" },
];

function edgeColor(type: string) {
  if (type === "antagonistic") return "#E15759";
  if (type === "cooperative") return "#59A14F";
  if (type === "causal") return "#EDC948";
  return "#94A3B8";
}

function ConflictGraphSVG({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      aria-hidden="true"
      role="img"
    >
      {/* Edges */}
      {EDGES.map((edge, i) => {
        const from = NODES[edge.from];
        const to = NODES[edge.to];
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={edgeColor(edge.type)}
            strokeWidth={0.8}
            strokeOpacity={0.5}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map((node, i) => (
        <g key={node.id}>
          {/* Pulse ring — only if motion not reduced */}
          {!shouldReduceMotion && (
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r + 4}
              fill="none"
              stroke={node.color}
              strokeWidth={0.6}
              opacity={0}
              style={{
                animation: `pulse-ring ${2 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.35}s`,
              }}
            />
          )}
          {/* Node circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill={node.color}
            fillOpacity={0.85}
          />
          {/* Label */}
          <text
            x={node.x}
            y={node.y + node.r + 4.5}
            textAnchor="middle"
            fontSize={3.5}
            fill="#1B3A5C"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            opacity={0.7}
          >
            {node.label}
          </text>
        </g>
      ))}

      <style>{`
        @keyframes pulse-ring {
          0% { opacity: 0.6; r: ${0}; transform-origin: center; }
          70% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </svg>
  );
}

function AnimatedTicker({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const events = [
    { time: "08:14", text: "Ceasefire violation reported — Northern Mali", color: "#E15759" },
    { time: "09:02", text: "ACLED: 3 new incidents flagged in Sahel", color: "#EDC948" },
    { time: "09:47", text: "GDELT: Escalatory rhetoric detected — media", color: "#F28E2B" },
    { time: "10:30", text: "PRAXIS: Risk score updated — Glasl Stage 7", color: "#E15759" },
  ];

  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldReduceMotion || !tickerRef.current) return;
    // Simple CSS animation handled by tailwind / inline style
  }, [shouldReduceMotion]);

  return (
    <div className="flex flex-col gap-1.5 overflow-hidden">
      {events.map((ev, i) => (
        <motion.div
          key={i}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.2 + i * 0.4, duration: 0.4 }}
          className="flex items-start gap-2 rounded-md border border-cream-300/60 bg-white/80 px-2.5 py-1.5"
        >
          <span
            className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: ev.color }}
          />
          <span className="font-mono text-[9px] text-navy-400 shrink-0">{ev.time}</span>
          <span className="text-[9px] leading-snug text-navy-600">{ev.text}</span>
        </motion.div>
      ))}
    </div>
  );
}

function ProductGlimpse() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3, duration: 0.8 }}
      className="relative w-full max-w-md lg:max-w-none"
      aria-hidden="true"
    >
      {/* Outer card */}
      <div className="rounded-2xl border border-diplomatic-blue/12 bg-white/70 shadow-xl shadow-navy-950/5 backdrop-blur-sm overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-cream-200/60 bg-cream-50/80 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-crimson/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-sage/40" />
          <span className="ml-3 font-mono text-[9px] text-navy-400 truncate">
            praxis.tacitus.me · Northern Mali Situation
          </span>
        </div>

        <div className="grid grid-cols-2 gap-0 divide-x divide-cream-200/60">
          {/* Left: conflict graph */}
          <div className="flex flex-col gap-2 p-4">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-400">
              Conflict Graph · ACO v2.0
            </span>
            <div className="aspect-square w-full max-w-[140px] mx-auto">
              <ConflictGraphSVG shouldReduceMotion={shouldReduceMotion} />
            </div>
            {/* Legend strip */}
            <div className="mt-1 flex flex-wrap gap-1">
              {[
                { label: "State", color: "#4E79A7" },
                { label: "Armed", color: "#E15759" },
                { label: "Commit.", color: "#76B7B2" },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[8px] text-navy-400">{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Right: risk gauge + event ticker */}
          <div className="flex flex-col gap-3 p-4">
            {/* Risk gauge */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-400">
                Risk Assessment
              </span>
              <div className="mt-2 flex items-center gap-2">
                {/* Gauge bar */}
                <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-cream-200">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{ delay: 1.6, duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 to-crimson"
                  />
                </div>
                <span className="shrink-0 font-mono text-[10px] font-bold text-crimson">78</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-crimson/5 border border-crimson/15 px-2 py-1">
                <span className={cn("h-1.5 w-1.5 rounded-full bg-crimson", !shouldReduceMotion && "animate-pulse")} />
                <span className="text-[9px] font-semibold text-crimson">Glasl 7 · Critical</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-cream-200/60" />

            {/* Event ticker */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-400">
                Live Updates
              </span>
              <div className="mt-2">
                <AnimatedTicker shouldReduceMotion={shouldReduceMotion} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom data bar */}
        <div className="border-t border-cream-200/60 bg-cream-50/60 px-4 py-2 flex items-center gap-3">
          <span className="text-[9px] text-navy-400">Grounded in</span>
          {["ACLED", "GDELT", "ReliefWeb", "UCDP"].map((s) => (
            <span
              key={s}
              className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-diplomatic-blue bg-diplomatic-blue/6 border border-diplomatic-blue/15"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24">
      {/* Background mesh gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(232,185,49,0.06) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(75,146,219,0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(27,58,92,0.03) 0%, transparent 50%)",
        }}
      />

      {/* Subtle dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1B3A5C 0.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Two-column layout on large screens */}
      <div className="relative z-10 mx-auto flex max-w-6xl w-full flex-col items-center gap-16 lg:flex-row lg:items-center lg:gap-12">
        {/* LEFT: headline + CTAs */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:flex-1">
          {/* Trust badge */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-diplomatic-blue/10 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm"
          >
            <Shield className="h-3.5 w-3.5 text-gold-600" />
            <span className="text-xs font-medium tracking-wide text-navy-700">
              Built by practitioners with careers in multilateral and bilateral diplomacy
            </span>
          </motion.div>

          {/* Animated headline */}
          <motion.h1
            variants={shouldReduceMotion ? {} : containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-8 font-serif text-5xl leading-[1.08] font-normal tracking-tight text-navy-950 sm:text-6xl lg:text-[68px]"
          >
            {headlineWords.map((word, i) => (
              <motion.span
                key={i}
                variants={shouldReduceMotion ? {} : wordVariants}
                className={cn(
                  "mr-[0.25em] inline-block",
                  word === "Credible" && "text-gold-600",
                  word === "Intelligence." && "text-gold-600"
                )}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            className="mb-6 max-w-2xl text-lg leading-relaxed text-navy-500 sm:text-xl"
          >
            The intelligence workspace for peace and security professionals.
            Bring your sources and context — PRAXIS structures them into credible
            assessments for diplomats, analysts, and multilateral organizations.
          </motion.p>

          {/* Data sources tagline */}
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="mb-10 text-sm text-navy-400 italic"
          >
            Powered by ACLED, GDELT, ReliefWeb, UCDP — grounded in AI you can cite.
          </motion.p>

          {/* Single CTA — all paths go through /login */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="flex flex-col items-center gap-3 lg:items-start"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-gold-600 px-10 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-gold-500 hover:shadow-xl hover:shadow-gold-600/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
              >
                Access PRAXIS
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-diplomatic-blue/20 px-8 py-4 text-base font-semibold text-diplomatic-blue transition-all duration-200 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40"
              >
                Explore Demo
              </Link>
            </div>
            <p className="text-xs text-navy-400">
              Sign in for full access · Demo requires no account
            </p>
          </motion.div>

          {/* Demo notice */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.7 }}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-600/20 bg-gold-600/5 px-5 py-2"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full bg-gold-500", !shouldReduceMotion && "animate-pulse")} />
            <span className="text-xs font-medium text-gold-700">
              Early Demo — exploring how we can serve practitioners like you
            </span>
          </motion.div>
        </div>

        {/* RIGHT: animated product glimpse */}
        <div className="w-full max-w-md lg:flex-1 lg:max-w-none">
          <ProductGlimpse />
        </div>
      </div>

      {/* Social proof strip */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="relative z-10 mt-16 w-full max-w-6xl"
      >
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.12em] text-navy-400">
          Built for practitioners across
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {practitionerBackgrounds.map((name) => (
            <span
              key={name}
              className="text-xs font-semibold uppercase tracking-wider text-navy-300/60"
            >
              {name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.8 }}
        className="relative z-10 mt-12 mb-8"
      >
        <a
          href="#how-it-works"
          className="flex flex-col items-center gap-2 text-navy-400 transition-colors hover:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 rounded"
          aria-label="Scroll to How PRAXIS Works"
        >
          <span className="text-[10px] font-medium uppercase tracking-widest text-navy-400">
            Discover
          </span>
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </a>
      </motion.div>
    </section>
  );
}
