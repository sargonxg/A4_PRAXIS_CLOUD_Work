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
 * representational, not pixel-perfect screenshots. Auto-cycles every 5.2s.
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

const PANEL_INTERVAL_MS = 5200;

export function HeroQuadrantTour() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % PANELS.length), PANEL_INTERVAL_MS);
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
      <div className="relative aspect-[16/11] min-h-[500px] w-full sm:min-h-[430px] lg:min-h-[470px] xl:min-h-[520px]">
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
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {PANELS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIndex(i)}
            aria-label={`Show ${p.label}`}
            className={cn(
              'group relative inline-flex items-center gap-1 overflow-hidden rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide transition',
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
      <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded-full bg-navy-900/8">
        <motion.div
          key={active.id}
          className="h-full origin-left rounded-full bg-gradient-to-r from-diplomatic-blue via-gold-500 to-sage"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: PANEL_INTERVAL_MS / 1000, ease: "linear" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel 1 — Conflict Graph (uses the existing ProductGlimpse SVG vibe)
// ---------------------------------------------------------------------------

function PanelGraph() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  // Syria transition case map, aligned with the shared app workspace.
  const nodes = [
    { id: 'damascus', cx: 50, cy: 48, r: 8, fill: '#4E79A7', label: 'Damascus', type: 'state' },
    { id: 'sdf', cx: 78, cy: 30, r: 7, fill: '#E15759', label: 'SDF', type: 'armed' },
    { id: 'kurdish', cx: 83, cy: 58, r: 6, fill: '#FF9DA7', label: 'Kurdish rights', type: 'claim' },
    { id: 'un', cx: 20, cy: 26, r: 6, fill: '#76B7B2', label: 'UN Envoy', type: 'institution' },
    { id: 'ocha', cx: 18, cy: 68, r: 6, fill: '#F28E2B', label: 'OCHA', type: 'institution' },
    { id: 'agreement', cx: 50, cy: 18, r: 6, fill: '#59A14F', label: '30 Jan deal', type: 'commitment' },
    { id: 'returns', cx: 55, cy: 82, r: 6, fill: '#F28E2B', label: 'Returns', type: 'population' },
    { id: 'spillover', cx: 84, cy: 84, r: 5, fill: '#E15759', label: 'Spillover', type: 'risk' },
    { id: 'south', cx: 13, cy: 48, r: 5, fill: '#E15759', label: 'South', type: 'risk' },
    { id: 'media', cx: 91, cy: 42, r: 4, fill: '#EDC948', label: 'Media', type: 'narrative' },
    { id: 'hlp', cx: 35, cy: 90, r: 4, fill: '#9C755F', label: 'HLP', type: 'constraint' },
    { id: 'aid', cx: 35, cy: 66, r: 5, fill: '#F28E2B', label: 'Aid strain', type: 'constraint' },
  ];
  const edges = [
    { from: 'damascus', to: 'agreement', color: '#59A14F', kind: 'commitment' },
    { from: 'sdf', to: 'agreement', color: '#59A14F', kind: 'commitment' },
    { from: 'un', to: 'agreement', color: '#76B7B2', kind: 'cooperative' },
    { from: 'agreement', to: 'kurdish', color: '#76B7B2', kind: 'commitment' },
    { from: 'agreement', to: 'returns', color: '#EDC948', kind: 'causal' },
    { from: 'ocha', to: 'aid', color: '#F28E2B', kind: 'causal' },
    { from: 'aid', to: 'returns', color: '#EDC948', kind: 'causal' },
    { from: 'spillover', to: 'returns', color: '#E15759', kind: 'antagonistic' },
    { from: 'south', to: 'spillover', color: '#E15759', kind: 'antagonistic' },
    { from: 'media', to: 'kurdish', color: '#FF9DA7', kind: 'structural' },
    { from: 'hlp', to: 'returns', color: '#9C755F', kind: 'constraint' },
    { from: 'damascus', to: 'media', color: '#EDC948', kind: 'structural' },
  ];
  function nodeById(id: string) {
    return nodes.find((n) => n.id === id)!;
  }
  return (
    <Card title="ACO v2.0 · Conflict Graph" subtitle="praxis.tacitus.me · Syria case · 30 entities · 42 edges">
      <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3 p-3 sm:grid-cols-[1.55fr_0.95fr] sm:grid-rows-none sm:gap-4 sm:p-4">
        <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-cream-200/60 bg-gradient-to-br from-white/90 via-white/65 to-cream-50/70 p-3 sm:min-h-[235px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
              Transition risk · High
            </span>
            <span className="font-mono text-[8.5px] text-navy-500">
              risk 78 · provenance 91%
            </span>
          </div>
          <svg viewBox="0 0 100 100" className="mt-1 h-[calc(100%-22px)] w-full" aria-hidden="true">
            <defs>
              <radialGradient id="hero-graph-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(232,185,49,0.18)" />
                <stop offset="100%" stopColor="rgba(232,185,49,0)" />
              </radialGradient>
              <linearGradient id="hero-edge-anti" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#E15759" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#E15759" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#hero-graph-glow)" />
            {edges.map((e, i) => {
              const a = nodeById(e.from);
              const b = nodeById(e.to);
              return (
                <motion.line
                  key={i}
                  x1={a.cx}
                  y1={a.cy}
                  x2={b.cx}
                  y2={b.cy}
                  stroke={e.color}
                  strokeWidth={e.kind === 'antagonistic' ? 0.9 : 0.65}
                  strokeOpacity={e.kind === 'historical' ? 0.35 : 0.6}
                  strokeDasharray={e.kind === 'historical' ? '1.5 1.5' : undefined}
                  initial={shouldReduceMotion ? false : { pathLength: 0 }}
                  animate={shouldReduceMotion ? undefined : { pathLength: 1 }}
                  transition={shouldReduceMotion ? undefined : { duration: 1.1, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
                />
              );
            })}
            {!shouldReduceMotion &&
              edges.slice(0, 5).map((e, i) => {
                const a = nodeById(e.from);
                const b = nodeById(e.to);
                return (
                  <motion.circle
                    key={`${e.from}-${e.to}-packet`}
                    r={i === 0 ? 1.75 : 1.2}
                    fill={i === 0 ? '#E8B931' : e.color}
                    initial={{ cx: a.cx, cy: a.cy, opacity: 0 }}
                    animate={{
                      cx: [a.cx, b.cx],
                      cy: [a.cy, b.cy],
                      opacity: [0, 0.95, 0],
                    }}
                    transition={{
                      duration: 2.3 + i * 0.22,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.32,
                    }}
                  />
                );
              })}
            {nodes.map((n, i) => (
              <g key={n.id}>
                {!shouldReduceMotion && n.type !== 'historical' && (
                  <motion.circle
                    cx={n.cx}
                    cy={n.cy}
                    r={n.r}
                    fill="none"
                    stroke={n.fill}
                    strokeWidth={0.5}
                    initial={{ scale: 1, opacity: 0.45 }}
                    animate={{ scale: [1, 1.55, 1], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 2.4 + (i % 4) * 0.4, repeat: Infinity, ease: 'easeInOut', delay: (i % 5) * 0.2 }}
                    style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                  />
                )}
                <motion.circle
                  cx={n.cx}
                  cy={n.cy}
                  r={n.r}
                  fill={n.fill}
                  fillOpacity={0.9}
                  initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                  animate={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
                  transition={shouldReduceMotion ? undefined : { duration: 0.4, delay: 0.35 + i * 0.05, ease: 'backOut' }}
                  style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                />
                <text
                  x={n.cx}
                  y={n.cy + n.r + 3.2}
                  textAnchor="middle"
                  fontSize={2.6}
                  fill="#1B3A5C"
                  fontFamily="Inter, sans-serif"
                  fontWeight="600"
                  opacity={0.78}
                >
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-hidden sm:flex sm:flex-col">
          <div className="rounded-lg border border-crimson/20 bg-crimson/5 px-2.5 py-2 sm:px-3">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-crimson">
              Pivot actors
            </div>
            <div className="mt-0.5 text-[10px] font-semibold text-navy-800 leading-tight">
              Damascus · SDF · UN Envoy
            </div>
          </div>
          <div className="rounded-lg border border-cream-200/60 bg-white/75 px-2.5 py-2 sm:px-3">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
              Hidden linkage
            </div>
            <div className="mt-0.5 text-[9.5px] text-navy-700 leading-snug">
              Agreement → returns → aid access
            </div>
          </div>
          <Pill color="#4E79A7" label="State actors" count={4} />
          <Pill color="#E15759" label="Security risks" count={5} />
          <Pill color="#9C755F" label="HLP constraints" count={3} />
          <Pill color="#76B7B2" label="Commitments" count={6} />
          <Pill color="#F28E2B" label="Humanitarian" count={7} />
          <div className="col-span-2 hidden rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-2 sm:mt-auto sm:block sm:px-3">
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-emerald-700">
              GraphOps · 18 repairs cleared
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Panel 2 — Media Monitor
// ---------------------------------------------------------------------------

function PanelMedia() {
  // Syria media layer from the real app: local, official, monitoring,
  // economic, and global frames are intentionally separated.
  const frames = [
    { label: 'Problem', a: 78, b: 92 },
    { label: 'Cause', a: 64, b: 88 },
    { label: 'Actor', a: 72, b: 41 },
    { label: 'Moral', a: 81, b: 35 },
    { label: 'Threat', a: 58, b: 90 },
    { label: 'Remedy', a: 55, b: 70 },
  ];
  const sources = [
    { name: 'Enab Baladi', dot: '#0F766E', tone: 'local', signals: 18, drift: '+2σ' },
    { name: 'Syria Direct', dot: '#7C3AED', tone: 'diaspora', signals: 9, drift: '+1σ' },
    { name: 'North Press', dot: '#0F766E', tone: 'northeast', signals: 16, drift: '+3σ' },
    { name: 'Syria Report', dot: '#B45309', tone: 'economy', signals: 7, drift: '−' },
    { name: 'SyriaUntold', dot: '#7C3AED', tone: 'civic', signals: 5, drift: '−' },
    { name: 'SANA', dot: '#E15759', tone: 'official', signals: 14, drift: '+2σ' },
    { name: 'SOHR', dot: '#DC2626', tone: 'monitoring', signals: 11, drift: '+1σ' },
    { name: 'Reuters', dot: '#4E79A7', tone: 'wire', signals: 12, drift: '−' },
    { name: 'UN News', dot: '#59A14F', tone: 'UN', signals: 6, drift: '−' },
    { name: 'ReliefWeb', dot: '#59A14F', tone: 'humanitarian', signals: 8, drift: '+1σ' },
  ];
  return (
    <Card title="Media Compass · Syria" subtitle="praxis.tacitus.me · local media · narrative lanes · 8 source profiles">
      <div className="flex h-full flex-col gap-2 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
            Entman frame divergence
          </span>
          <span className="font-mono text-[8.5px] text-navy-500">
            Δ frame = 0.39 · local + UN receipts
          </span>
        </div>
        <div className="grid flex-1 grid-cols-[1.3fr_1fr] gap-2">
          <div className="flex items-end gap-1.5 rounded-md border border-cream-200/60 bg-white/70 p-2">
            {frames.map((bar, i) => (
              <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="flex h-[80%] w-full items-end gap-0.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.a}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07 }}
                    className="w-1/2 rounded-t-sm bg-gradient-to-t from-diplomatic-blue to-diplomatic-blue/55"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.b}%` }}
                    transition={{ duration: 0.8, delay: 0.05 + i * 0.07 }}
                    className="w-1/2 rounded-t-sm bg-gradient-to-t from-crimson to-crimson/55"
                  />
                </div>
                <span className="text-[7.5px] font-medium uppercase tracking-wider text-navy-400">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-rows-2 gap-1.5">
            <div className="rounded-md border border-diplomatic-blue/15 bg-diplomatic-blue/5 px-2 py-1">
              <div className="text-[8.5px] font-semibold uppercase tracking-wider text-diplomatic-blue">
                Local / civil frame
              </div>
              <div className="mt-0.5 text-[9px] leading-snug text-navy-700">
                Rights, returns, services, checkpoints, implementation gaps
              </div>
            </div>
            <div className="rounded-md border border-crimson/20 bg-crimson/5 px-2 py-1">
              <div className="text-[8.5px] font-semibold uppercase tracking-wider text-crimson">
                Official / regional frame
              </div>
              <div className="mt-0.5 text-[9px] leading-snug text-navy-700">
                Transition stability, territorial integrity, external pressure
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {sources.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-md border border-cream-200/60 bg-white/75 px-1.5 py-0.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                <span className="text-[8.5px] font-semibold text-navy-700">{s.name}</span>
              </div>
              <span className="font-mono text-[8px] text-navy-500">
                {s.signals} · {s.tone} <span className="text-crimson/80">{s.drift}</span>
              </span>
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
  // Sophisticated, role-calibrated exchange. PRAXIS speaks like a senior
  // analyst: cites sources inline, names the framework, flags uncertainty,
  // and proposes the next concrete artefact.
  const messages: { role: 'user' | 'praxis'; text: React.ReactNode }[] = [
    {
      role: 'user',
      text: (
        <>
          Is the Syria northeast integration track still the stabilizing
          center of gravity? Separate facts, assessment, and gaps.
        </>
      ),
    },
    {
      role: 'praxis',
      text: (
        <>
          Reasoning over the Syria source pack: UN Geneva, OCHA, UNFPA,
          UNHCR, local media profiles, and the current conflict graph.
          <br />
          <span className="font-semibold text-navy-900">Fact</span>:
          public UN reporting frames the 30 January agreement as potentially
          transformative, but not self-implementing
          <span className="text-diplomatic-blue/80"> [UN Geneva · 2026-02-13]</span>.
          <br />
          <span className="font-semibold text-navy-900">Assessment</span>:
          humanitarian access, rights implementation, southern incidents,
          and regional spillover are the red triggers
          <span className="text-diplomatic-blue/80"> [OCHA/UNFPA]</span>.
          <br />
          I recommend an implementation-first brief with visible evidence
          limits and a local media/source refresh. Open the memo studio?
        </>
      ),
    },
    {
      role: 'user',
      text: <>Yes — neutral tone, rights-protective language, no overclaiming.</>,
    },
  ];

  return (
    <Card title="Ask PRAXIS · Calibrated" subtitle="agent · Syria case · graph + sources cited">
      <div className="grid h-full grid-rows-[1fr_auto] gap-2 p-3">
        <div className="space-y-1.5 overflow-hidden">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className={cn(
                'max-w-[92%] rounded-lg border px-2.5 py-1.5 text-[9.5px] leading-snug',
                msg.role === 'praxis'
                  ? 'border-diplomatic-blue/15 bg-diplomatic-blue/6 text-navy-700'
                  : 'ml-auto border-cream-200 bg-white/80 text-navy-700',
              )}
            >
              <span className="mb-0.5 block text-[7.5px] font-semibold uppercase tracking-wider text-navy-400">
                {msg.role === 'praxis' ? 'PRAXIS · senior-analyst tone' : 'Maya R. · Envoy Team'}
              </span>
              {msg.text}
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[8.5px] font-semibold uppercase tracking-wider text-emerald-700">
                Agent actions
              </span>
              <span className="font-mono text-[8.5px] text-emerald-700">4 ready</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {['Draft brief', 'Update graph', 'Open dossier', 'Save sources'].map((a) => (
                <span key={a} className="rounded border border-emerald-200 bg-white/70 px-1.5 py-[1px] text-[7.5px] font-semibold text-emerald-800">
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-cream-200/60 bg-white/80 px-2 py-1">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
              Sources used
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {['UN Geneva', 'OCHA', 'UNFPA', 'Enab Baladi', 'North Press'].map((s) => (
                <span
                  key={s}
                  className="rounded px-1.5 py-[1px] text-[7.5px] font-semibold uppercase tracking-wide text-diplomatic-blue bg-diplomatic-blue/8 border border-diplomatic-blue/15"
                >
                  {s}
                </span>
              ))}
            </div>
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
  const sections = [
    {
      label: 'Executive summary',
      body: 'The northeast agreement is the opportunity; implementation evidence remains the risk.',
    },
    {
      label: 'Situation · 7d',
      body: 'UN receipts, local media lanes, humanitarian indicators, and graph health reviewed.',
    },
    {
      label: 'Stakeholder map',
      body: 'Damascus · SDF · UN Envoy · OCHA · Kurdish civil authorities · regional actors.',
    },
    {
      label: 'Risk assessment',
      body: 'Risk 78/100 · humanitarian, rights, southern, and spillover triggers.',
    },
    {
      label: 'Options',
      body: 'Implementation-first brief · risk-first brief · hold for local verification.',
    },
    {
      label: 'Recommendation',
      body: 'Protect the track, but brief red triggers and collection gaps visibly.',
    },
  ];
  return (
    <Card title="Document Studio · Syria memo" subtitle="policy memo · DOCX-ready · 18 inline citations">
      <div className="flex h-full flex-col gap-2 p-3">
        <div className="grid grid-cols-[1fr_auto] gap-1.5">
          <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
              v4 · source-audited · diff +22/−8
            </span>
            <span className="font-mono text-[8.5px] text-emerald-600">2026-05-03 09:00</span>
          </div>
          <div className="rounded-md border border-diplomatic-blue/20 bg-diplomatic-blue/6 px-2 py-1 text-[8.5px] font-semibold uppercase tracking-wider text-diplomatic-blue">
            ICD-203 ✓
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          {sections.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="flex flex-col gap-0.5 rounded-md border border-cream-200/60 bg-white/80 p-1.5"
            >
              <span className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
                {s.label}
              </span>
              <span className="text-[9px] leading-snug text-navy-700">
                {s.body}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-cream-200/60 bg-cream-50/60 px-2 py-1">
          <span className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
            Sources
          </span>
          {['UN Geneva', 'OCHA', 'UNFPA', 'UNHCR', 'Enab Baladi', 'North Press', 'Syria Report', 'Google Search'].map((s) => (
            <span
              key={s}
              className="rounded px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wide text-diplomatic-blue bg-diplomatic-blue/8 border border-diplomatic-blue/15"
            >
              {s}
            </span>
          ))}
          <span className="ml-auto font-mono text-[8.5px] text-navy-500">
            export → DOCX · PDF · briefing deck
          </span>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Panel 4 — User Context Card
// ---------------------------------------------------------------------------

function PanelContext() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  return (
    <Card title="Calibration spine · agentic context" subtitle="profile v3 · 4 layers · injected into every tool">
      <div className="grid h-full grid-cols-[1.4fr_1fr] gap-2 p-3">
        <div className="flex flex-col gap-2">
          <div className="rounded-md border border-diplomatic-blue/15 bg-diplomatic-blue/6 p-2">
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-diplomatic-blue">
              &lt;analyst-profile&gt;
            </span>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[8.5px] leading-snug text-navy-700">
{`role:        humanitarian_lead
org:         Syria Transition Cell
seniority:   senior · 12y
audience:    envoy · principals
language:    en · ar sources
lenses:      diplomatic > rights >
             humanitarian > media
domains:     peace-security + gov
red-lines:   no classified claims
             no off-record sources`}
            </pre>
          </div>
          <div className="rounded-md border border-cream-200/60 bg-white/80 p-2">
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
              &lt;situation-frame&gt;
            </span>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[8.5px] leading-snug text-navy-700">
{`name:    Syria transition
phase:   monitoring · risk 78
actors:  30 · edges 42
since:   2026-01-30 · live case`}
            </pre>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="rounded-md border border-cream-200/60 bg-white/80 px-2 py-1">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
              Frameworks active
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {['ACO v2', 'ICD-203', 'INFORM', 'OCHA', 'IHL', 'Media', 'GraphOps'].map((f) => (
                <span
                  key={f}
                  className="rounded px-1.5 py-[1px] text-[7.5px] font-semibold uppercase tracking-wide text-diplomatic-blue bg-diplomatic-blue/8 border border-diplomatic-blue/15"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
          <ContextChip label="Profile" value="v3 · 12 edits" />
          <ContextChip label="Corpus" value="8 local + 5 UN" />
          <ContextChip label="Memory" value="62 facts · 14 trace" />
          <ContextChip label="SKC vector" value="768d · KNN" />
          <div className="mt-auto flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
            <span className={cn('h-1.5 w-1.5 rounded-full bg-emerald-500', !shouldReduceMotion && 'animate-pulse')} />
            <span className="text-[8.5px] font-semibold leading-tight text-emerald-700">
              Calibration injected · 10 core tools live
            </span>
          </div>
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
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-diplomatic-blue/15 bg-gradient-to-br from-white/88 via-white/78 to-cream-50/72 shadow-2xl shadow-navy-950/12 backdrop-blur-md">
      <div className="flex items-center gap-1.5 border-b border-cream-200/60 bg-gradient-to-r from-cream-50/90 via-white/80 to-cream-50/90 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-crimson/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-sage/50" />
        <span className="ml-3 flex items-center gap-1.5 font-mono text-[9px] text-navy-500 truncate">
          <span className={cn("h-1 w-1 rounded-full bg-emerald-500", !shouldReduceMotion && "animate-pulse")} />
          {subtitle}
        </span>
        <span className="ml-auto hidden whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider text-navy-700 sm:block">
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
