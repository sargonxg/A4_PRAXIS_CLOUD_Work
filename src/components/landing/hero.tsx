"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useNarrativeMotion } from "./landing-motion-context";
import { HeroVisual } from "./hero-visual";

// ---- Animated Situation Model SVG ----
// 7 nodes: 3 state actors, 2 armed groups, 1 institution, 1 norm
const NODES = [
  { id: 0, x: 50, y: 50, r: 14, color: "#4E79A7", label: "State A", type: "state" },
  { id: 1, x: 82, y: 30, r: 10, color: "#E15759", label: "Armed Group", type: "armed_group" },
  { id: 2, x: 82, y: 72, r: 10, color: "#4E79A7", label: "State B", type: "state" },
  { id: 3, x: 20, y: 22, r: 8, color: "#76B7B2", label: "Field Mission", type: "institution" },
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
          0% { opacity: 0.6; transform: scale(0.75); transform-origin: center; }
          70% { transform: scale(1.25); }
          70% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </svg>
  );
}

function AnimatedTicker({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const events = [
    { time: "08:14", text: "Source receipt added — official briefing", color: "#59A14F" },
    { time: "09:02", text: "Local media signal flagged — implementation gap", color: "#EDC948" },
    { time: "09:47", text: "Narrative divergence detected — official / local outlets", color: "#F28E2B" },
    { time: "10:30", text: "PRAXIS: case risk score updated — 78/100", color: "#E15759" },
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

export function ProductGlimpse() {
  const shouldReduceMotion = !useNarrativeMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8 }}
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
            praxis.tacitus.me · Active policy workbench
          </span>
        </div>

        <div className="grid grid-cols-2 gap-0 divide-x divide-cream-200/60">
          {/* Left: conflict graph */}
          <div className="flex flex-col gap-2 p-4">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-400">
              Situation model
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
                    whileInView={{ width: "78%" }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
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
          {["GDELT", "UCDP", "ReliefWeb", "HDX"].map((s) => (
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
  const narrativeMotion = useNarrativeMotion();
  const animateText = narrativeMotion;
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-8 pt-24 sm:px-6 lg:px-8">
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
      <div className="relative z-10 mx-auto grid w-full max-w-[1520px] grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(540px,1.18fr)] lg:gap-10 xl:grid-cols-[minmax(0,0.76fr)_minmax(720px,1.24fr)]">
        {/* LEFT: headline + CTAs */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* Eyebrow */}
          <motion.div
            initial={animateText ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-8 inline-flex max-w-xl items-center rounded-full border border-diplomatic-blue/10 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm"
          >
            <span className="text-xs font-medium tracking-wide text-navy-700">
              PRAXIS by TACITUS · Built from practitioner experience in multilateral diplomacy.
            </span>
          </motion.div>

          <motion.h1
            initial={animateText ? { opacity: 0, y: 18 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.58 }}
            className="mb-8 max-w-4xl font-serif text-5xl leading-[1.06] font-normal tracking-tight text-navy-950 sm:text-6xl lg:text-[64px] xl:text-[72px]"
          >
            Open a Situation. Ask <span className="text-gold-600">PRAXIS.</span>
            <br />
            Produce the handover.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={false}
            className="mb-6 max-w-2xl text-lg leading-relaxed text-navy-500 sm:text-xl"
          >
            PRAXIS turns tacit desk context into a guided app: choose the Situation, ask what matters, review sources and confidence, then export a trusted brief, memo, or successor handover.
          </motion.p>

          <motion.div
            initial={animateText ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            className="flex flex-col items-center gap-3 lg:items-start"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/login"
                prefetch={false}
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-gold-600 px-10 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-gold-500 hover:shadow-xl hover:shadow-gold-600/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
              >
                Start your workspace
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/app/assistant"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-md border border-diplomatic-blue/20 px-8 py-4 text-base font-semibold text-diplomatic-blue transition-all duration-200 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40"
              >
                Open Ask workspace
              </Link>
              <Link
                href="/app/write"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-md px-3 py-4 text-base font-semibold text-navy-600 underline-offset-4 transition hover:text-navy-900 hover:underline"
              >
                See PRAXIS write a memo
              </Link>
            </div>
            <p className="text-xs text-navy-400">30 seconds to a real memo with citations.</p>
          </motion.div>
        </div>

        {/* RIGHT: hero visual (video loop with ProductGlimpse fallback) */}
        <div className="relative w-full max-w-[760px] justify-self-center lg:max-w-none xl:-mr-4">
          <HeroVisual narrativeMotion={narrativeMotion} />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={animateText ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="relative z-10 mt-12 mb-8"
      >
        <a
          href="#six-steps"
          className="flex flex-col items-center gap-2 text-navy-400 transition-colors hover:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 rounded"
          aria-label="Scroll to the six steps"
        >
          <span className="text-[10px] font-medium uppercase tracking-widest text-navy-400">
            Discover
          </span>
          <motion.div
            animate={narrativeMotion ? { y: [0, 6, 0] } : {}}
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
