"use client";

/**
 * Hero quadrant tour — round 5 brick #45.
 *
 * Cycles through four product surfaces in the right column of the hero so
 * a first-time visitor sees the breadth of PRAXIS without having to scroll:
 *
 *   1. Conflict Graph (ACO v2.0 nodes + edges)
 *   2. Media Monitor (sources, frame divergence, signal velocity)
 *   3. Drafting Studio (briefing slides + locked version + diff)
 *   4. User Context Card (analyst profile + situation + lenses)
 *
 * Each panel renders a deliberately simplified, animated SVG/HTML card —
 * representational, not pixel-perfect screenshots. Auto-cycles every 4.2s.
 * Honours `prefers-reduced-motion` (no auto-cycle, all four panels stack
 * vertically as a static product collage).
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageSquareText, Network, Newspaper, FileText, UserCog } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const PANELS = [
  { id: 'graph', label: 'Conflict Graph', icon: Network },
  { id: 'media', label: 'Media Monitor', icon: Newspaper },
  { id: 'assistant', label: 'Ask PRAXIS', icon: MessageSquareText },
  { id: 'drafting', label: 'Drafting Studio', icon: FileText },
  { id: 'context', label: 'User Context', icon: UserCog },
] as const;

export function HeroQuadrantTour() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % PANELS.length), 4200);
    return () => clearInterval(t);
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <div className="grid grid-cols-1 gap-3">
        <PanelGraph />
        <PanelMedia />
        <PanelAssistant />
        <PanelDrafting />
        <PanelContext />
      </div>
    );
  }

  const active = PANELS[index];
  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 0.92, rotateY: 8, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, rotateY: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.96, rotateY: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {active.id === 'graph' && <PanelGraph />}
            {active.id === 'media' && <PanelMedia />}
            {active.id === 'assistant' && <PanelAssistant />}
            {active.id === 'drafting' && <PanelDrafting />}
            {active.id === 'context' && <PanelContext />}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Step indicator pills */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {PANELS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIndex(i)}
            aria-label={`Show ${p.label}`}
            className={cn(
              'group relative inline-flex items-center gap-1 overflow-hidden rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition',
              i === index
                ? 'border-gold-500 bg-gold-50 text-gold-800 shadow-sm shadow-gold-500/30'
                : 'border-cream-300 bg-white/70 text-navy-500 hover:border-diplomatic-blue/40 hover:text-diplomatic-blue'
            )}
          >
            {i === index && !shouldReduceMotion && (
              <motion.span
                aria-hidden="true"
                layoutId="hero-tour-active"
                className="absolute inset-0 -z-0 rounded-full bg-gradient-to-r from-gold-100 via-gold-50 to-cream-100"
                transition={{ type: 'spring', stiffness: 240, damping: 26 }}
              />
            )}
            <p.icon className="relative z-10 h-3 w-3" />
            <span className="relative z-10">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel 1 — Conflict Graph (uses the existing ProductGlimpse SVG vibe)
// ---------------------------------------------------------------------------

function PanelGraph() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const edges = [
    { x1: 50, y1: 50, x2: 82, y2: 30, color: '#E15759' },
    { x1: 50, y1: 50, x2: 82, y2: 72, color: '#59A14F' },
    { x1: 50, y1: 50, x2: 20, y2: 22, color: '#59A14F' },
    { x1: 82, y1: 30, x2: 65, y2: 15, color: '#E15759' },
    { x1: 82, y1: 72, x2: 65, y2: 85, color: '#EDC948' },
  ];
  const nodes = [
    { cx: 50, cy: 50, r: 14, fill: '#4E79A7' },
    { cx: 82, cy: 30, r: 10, fill: '#E15759' },
    { cx: 82, cy: 72, r: 10, fill: '#4E79A7' },
    { cx: 20, cy: 22, r: 8, fill: '#76B7B2' },
    { cx: 20, cy: 76, r: 8, fill: '#F28E2B' },
    { cx: 65, cy: 85, r: 7, fill: '#FF9DA7' },
    { cx: 65, cy: 15, r: 7, fill: '#EDC948' },
  ];
  return (
    <Card title="Conflict Graph · ACO v2.0" subtitle="praxis.tacitus.me · Northern Mali">
      <div className="grid h-full grid-cols-2 gap-3 p-4">
        <div className="relative overflow-hidden rounded-lg border border-cream-200/60 bg-gradient-to-br from-white/80 via-white/60 to-cream-50/60 p-3">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
            Nodes (7) · Edges (8)
          </span>
          <svg viewBox="0 0 100 100" className="mt-2 h-full w-full" aria-hidden="true">
            <defs>
              <radialGradient id="hero-graph-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(232,185,49,0.18)" />
                <stop offset="100%" stopColor="rgba(232,185,49,0)" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#hero-graph-glow)" />
            {edges.map((e, i) => (
              <motion.line
                key={i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={e.color}
                strokeWidth={0.8}
                strokeOpacity={0.55}
                initial={shouldReduceMotion ? false : { pathLength: 0 }}
                animate={shouldReduceMotion ? undefined : { pathLength: 1 }}
                transition={shouldReduceMotion ? undefined : { duration: 1.2, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
              />
            ))}
            {nodes.map((n, i) => (
              <g key={i}>
                {!shouldReduceMotion && (
                  <motion.circle
                    cx={n.cx}
                    cy={n.cy}
                    r={n.r}
                    fill="none"
                    stroke={n.fill}
                    strokeWidth={0.6}
                    initial={{ r: n.r, opacity: 0.5 }}
                    animate={{ r: [n.r, n.r + 5, n.r], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
                  />
                )}
                <motion.circle
                  cx={n.cx}
                  cy={n.cy}
                  r={n.r}
                  fill={n.fill}
                  fillOpacity={0.88}
                  initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                  animate={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
                  transition={shouldReduceMotion ? undefined : { duration: 0.45, delay: 0.4 + i * 0.07, ease: 'backOut' }}
                  style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                />
              </g>
            ))}
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <Pill color="#4E79A7" label="State actors" count={3} />
          <Pill color="#E15759" label="Armed groups" count={1} />
          <Pill color="#76B7B2" label="Institutions" count={1} />
          <Pill color="#F28E2B" label="Claims" count={1} />
          <Pill color="#FF9DA7" label="Narratives" count={1} />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Panel 2 — Media Monitor
// ---------------------------------------------------------------------------

function PanelMedia() {
  const sources = [
    { name: 'Reuters', dot: '#4E79A7', tone: 'neutral', signals: 7 },
    { name: 'Al Jazeera', dot: '#76B7B2', tone: 'critical', signals: 5 },
    { name: 'Le Monde', dot: '#F28E2B', tone: 'analytical', signals: 4 },
    { name: 'Crisis Group', dot: '#59A14F', tone: 'expert', signals: 3 },
  ];
  return (
    <Card title="Media Monitor · 24h" subtitle="praxis.tacitus.me · narrative diff">
      <div className="flex h-full flex-col gap-2 p-4">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
          Frame divergence — Entman
        </span>
        <div className="flex flex-1 items-end gap-2 rounded-md border border-cream-200/60 bg-white/60 p-2">
          {[
            { label: 'Problem', a: 60, b: 92 },
            { label: 'Cause', a: 48, b: 75 },
            { label: 'Moral', a: 70, b: 35 },
            { label: 'Remedy', a: 55, b: 80 },
          ].map((bar, i) => (
            <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className="flex h-3/4 w-full items-end gap-0.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.a}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08 }}
                  className="w-1/2 rounded-t-sm bg-diplomatic-blue/70"
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.b}%` }}
                  transition={{ duration: 0.7, delay: 0.05 + i * 0.08 }}
                  className="w-1/2 rounded-t-sm bg-crimson/70"
                />
              </div>
              <span className="text-[8px] font-medium uppercase tracking-wider text-navy-400">
                {bar.label}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {sources.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-md border border-cream-200/60 bg-white/70 px-2 py-1"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                <span className="text-[9px] font-semibold text-navy-700">{s.name}</span>
              </div>
              <span className="font-mono text-[9px] text-navy-500">{s.signals} signals · {s.tone}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Panel 3 — Ask PRAXIS operational companion
// ---------------------------------------------------------------------------

function PanelAssistant() {
  const messages = [
    { role: 'user', text: 'What should I prepare before tomorrow\'s donor call?' },
    { role: 'praxis', text: 'I found 3 gaps: displacement figures, access constraints, and counterpart positions. I can draft a two-page brief now.' },
    { role: 'user', text: 'Use my Sahel situation and keep it neutral.' },
  ];

  return (
    <Card title="Ask PRAXIS · Situation-aware" subtitle="assistant · profile + active situation">
      <div className="grid h-full grid-rows-[1fr_auto] gap-2 p-4">
        <div className="space-y-2 overflow-hidden">
          {messages.map((msg, i) => (
            <motion.div
              key={`${msg.role}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className={cn(
                'max-w-[88%] rounded-lg border px-3 py-2 text-[10px] leading-relaxed',
                msg.role === 'praxis'
                  ? 'border-diplomatic-blue/15 bg-diplomatic-blue/6 text-navy-700'
                  : 'ml-auto border-cream-200 bg-white/75 text-navy-600',
              )}
            >
              <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wider text-navy-400">
                {msg.role === 'praxis' ? 'PRAXIS' : 'Analyst'}
              </span>
              {msg.text}
            </motion.div>
          ))}
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
              Ready actions
            </span>
            <span className="font-mono text-[9px] text-emerald-700">3 suggested</span>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {['Draft brief', 'Find sources', 'Create tasks'].map((action) => (
              <span key={action} className="rounded border border-emerald-200 bg-white/70 px-1.5 py-1 text-center text-[8px] font-semibold text-emerald-800">
                {action}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Panel 4 — Drafting Studio
// ---------------------------------------------------------------------------

function PanelDrafting() {
  return (
    <Card title="Drafting Studio · Briefing Room" subtitle="UNSC informal · v3 locked">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            v3 · locked for 10:30 informal
          </span>
          <span className="font-mono text-[9px] text-emerald-600">2026-04-26 09:14</span>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {['Title', 'Summary', 'Map', 'Timeline', 'Risk', 'Actions'].map((slide, i) => (
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="flex flex-col gap-1 rounded-md border border-cream-200/60 bg-white/70 p-2"
            >
              <span className="text-[9px] font-semibold text-navy-700">{slide}</span>
              <div className="h-1 w-3/4 rounded-full bg-diplomatic-blue/15" />
              <div className="h-1 w-1/2 rounded-full bg-diplomatic-blue/10" />
              <div className="h-1 w-2/3 rounded-full bg-diplomatic-blue/10" />
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-md border border-cream-200/60 bg-cream-50/60 px-2 py-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
            Sources cited
          </span>
          <div className="flex gap-1">
            {['UCDP', 'GDELT', 'OCHA', 'UN News'].map((s) => (
              <span
                key={s}
                className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-diplomatic-blue bg-diplomatic-blue/8 border border-diplomatic-blue/15"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Panel 4 — User Context Card
// ---------------------------------------------------------------------------

function PanelContext() {
  return (
    <Card title="Analyst calibration" subtitle="profile v3 · domain: humanitarian">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="rounded-md border border-cream-200/60 bg-white/70 p-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
            &lt;analyst-profile&gt;
          </span>
          <pre className="mt-1 whitespace-pre-wrap font-mono text-[9px] leading-snug text-navy-700">
{`role: humanitarian_lead
seniority: senior
audience: cluster, donors
language: en
lenses: protection > IPC > displacement
red-lines: no-targeting-advice`}
          </pre>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ContextChip label="Profile" value="v3" />
          <ContextChip label="Domain" value="humanitarian" />
          <ContextChip label="Sources" value="42 saved" />
          <ContextChip label="Notes" value="11 facts" />
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-semibold text-emerald-700">
            Calibration applied · Risk Monitor now scoring with humanitarian-domain emphasis
          </span>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-diplomatic-blue/15 bg-gradient-to-br from-white/85 via-white/75 to-cream-50/70 shadow-2xl shadow-navy-950/10 backdrop-blur-md">
      <div className="flex items-center gap-1.5 border-b border-cream-200/60 bg-gradient-to-r from-cream-50/90 via-white/80 to-cream-50/90 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-crimson/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-sage/50" />
        <span className="ml-3 flex items-center gap-1.5 font-mono text-[9px] text-navy-500 truncate">
          <span className={cn("h-1 w-1 rounded-full bg-emerald-500", !shouldReduceMotion && "animate-pulse")} />
          {subtitle}
        </span>
        <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-navy-700">
          {title}
        </span>
      </div>
      {/* Scan line drifting top-to-bottom */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(232,185,49,0.6) 30%, rgba(75,146,219,0.55) 70%, transparent)",
            boxShadow: "0 0 12px rgba(232,185,49,0.45)",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: ["0%", "1800%"], opacity: [0, 0.85, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
        />
      )}
      {children}
    </div>
  );
}

function Pill({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-cream-200/60 bg-white/70 px-2 py-1">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[9px] font-semibold text-navy-700">{label}</span>
      </div>
      <span className="font-mono text-[9px] text-navy-500">{count}</span>
    </div>
  );
}

function ContextChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cream-200/60 bg-white/70 px-2 py-1">
      <div className="text-[8px] font-semibold uppercase tracking-wider text-navy-400">{label}</div>
      <div className="text-[10px] font-semibold text-navy-800">{value}</div>
    </div>
  );
}
