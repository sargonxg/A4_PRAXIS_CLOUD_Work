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
  // Real Sahel actor map — Northern Mali post-MINUSMA
  const nodes = [
    { id: 'mali', cx: 50, cy: 50, r: 8, fill: '#4E79A7', label: 'Mali (Junta)', type: 'state' },
    { id: 'jnim', cx: 78, cy: 28, r: 7, fill: '#E15759', label: 'JNIM', type: 'armed' },
    { id: 'isgs', cx: 86, cy: 56, r: 6, fill: '#E15759', label: 'IS-Sahel', type: 'armed' },
    { id: 'cma', cx: 22, cy: 22, r: 6, fill: '#E15759', label: 'CMA / FLA', type: 'armed' },
    { id: 'wagner', cx: 60, cy: 78, r: 6, fill: '#9C755F', label: 'Africa Corps', type: 'pmc' },
    { id: 'aes', cx: 35, cy: 78, r: 7, fill: '#4E79A7', label: 'AES', type: 'state' },
    { id: 'ecowas', cx: 14, cy: 50, r: 6, fill: '#76B7B2', label: 'ECOWAS', type: 'institution' },
    { id: 'minusma', cx: 86, cy: 80, r: 5, fill: '#BAB0AC', label: 'MINUSMA †', type: 'institution' },
    { id: 'algeria', cx: 50, cy: 12, r: 5, fill: '#4E79A7', label: 'Algeria', type: 'state' },
    { id: 'france', cx: 22, cy: 92, r: 5, fill: '#4E79A7', label: 'France', type: 'state' },
    { id: 'algiers', cx: 32, cy: 38, r: 4, fill: '#76B7B2', label: 'Algiers Accord', type: 'commitment' },
    { id: 'idps', cx: 70, cy: 92, r: 5, fill: '#F28E2B', label: 'IDPs · 354k', type: 'population' },
    { id: 'ipi', cx: 92, cy: 38, r: 4, fill: '#EDC948', label: 'Uranium', type: 'leverage' },
    { id: 'narr', cx: 8, cy: 30, r: 4, fill: '#FF9DA7', label: 'Sovereignty', type: 'narrative' },
  ];
  const edges = [
    { from: 'mali', to: 'jnim', color: '#E15759', kind: 'antagonistic' },
    { from: 'mali', to: 'isgs', color: '#E15759', kind: 'antagonistic' },
    { from: 'mali', to: 'cma', color: '#E15759', kind: 'antagonistic' },
    { from: 'mali', to: 'wagner', color: '#59A14F', kind: 'cooperative' },
    { from: 'mali', to: 'aes', color: '#59A14F', kind: 'cooperative' },
    { from: 'aes', to: 'ecowas', color: '#E15759', kind: 'antagonistic' },
    { from: 'jnim', to: 'isgs', color: '#E15759', kind: 'antagonistic' },
    { from: 'cma', to: 'algiers', color: '#76B7B2', kind: 'commitment' },
    { from: 'mali', to: 'algiers', color: '#76B7B2', kind: 'commitment' },
    { from: 'algeria', to: 'algiers', color: '#76B7B2', kind: 'commitment' },
    { from: 'minusma', to: 'mali', color: '#BAB0AC', kind: 'historical' },
    { from: 'france', to: 'mali', color: '#BAB0AC', kind: 'historical' },
    { from: 'jnim', to: 'idps', color: '#EDC948', kind: 'causal' },
    { from: 'isgs', to: 'idps', color: '#EDC948', kind: 'causal' },
    { from: 'mali', to: 'narr', color: '#FF9DA7', kind: 'structural' },
    { from: 'mali', to: 'ipi', color: '#EDC948', kind: 'leverage' },
  ];
  function nodeById(id: string) {
    return nodes.find((n) => n.id === id)!;
  }
  return (
    <Card title="ACO v2.0 · Conflict Graph" subtitle="praxis.tacitus.me · Northern Mali · 14 entities · 16 edges">
      <div className="grid h-full grid-cols-[1.4fr_1fr] gap-3 p-3">
        <div className="relative overflow-hidden rounded-lg border border-cream-200/60 bg-gradient-to-br from-white/85 via-white/60 to-cream-50/60 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
              Glasl 7 · Critical
            </span>
            <span className="font-mono text-[8.5px] text-navy-500">
              risk 78 · density 0.18
            </span>
          </div>
          <svg viewBox="0 0 100 100" className="mt-1 h-full w-full" aria-hidden="true">
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
                    initial={{ r: n.r, opacity: 0.45 }}
                    animate={{ r: [n.r, n.r + 4, n.r], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 2.4 + (i % 4) * 0.4, repeat: Infinity, ease: 'easeInOut', delay: (i % 5) * 0.2 }}
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
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <div className="rounded-md border border-crimson/20 bg-crimson/5 px-2 py-1">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-crimson">
              Pivot actors
            </div>
            <div className="mt-0.5 text-[10px] font-semibold text-navy-800 leading-tight">
              JNIM · Africa Corps · CMA-FLA
            </div>
          </div>
          <div className="rounded-md border border-cream-200/60 bg-white/70 px-2 py-1">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
              Hidden linkage
            </div>
            <div className="mt-0.5 text-[9.5px] text-navy-700 leading-snug">
              JNIM ↔ Algiers Accord (broken)
            </div>
          </div>
          <Pill color="#4E79A7" label="States · AES" count={4} />
          <Pill color="#E15759" label="Armed · jihadi+CMA" count={3} />
          <Pill color="#9C755F" label="PMC · Africa Corps" count={1} />
          <Pill color="#76B7B2" label="Commitments" count={1} />
          <Pill color="#F28E2B" label="Civ · IDPs 354k" count={1} />
          <div className="mt-auto rounded-md border border-emerald-200 bg-emerald-50/80 px-2 py-1">
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-emerald-700">
              GDELT/UCDP 7d · 142 signals
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
  // Realistic frame divergence on Sahel coverage — Western mainstream (A)
  // versus state/affiliated outlets (B). Scores are illustrative but
  // mirror what frame-divergence audits actually surface.
  const frames = [
    { label: 'Problem', a: 78, b: 92 },
    { label: 'Cause', a: 64, b: 88 },
    { label: 'Actor', a: 72, b: 41 },
    { label: 'Moral', a: 81, b: 35 },
    { label: 'Threat', a: 58, b: 90 },
    { label: 'Remedy', a: 55, b: 70 },
  ];
  const sources = [
    { name: 'Reuters', dot: '#4E79A7', tone: 'neutral', signals: 14, drift: '+2σ' },
    { name: 'AFP', dot: '#4E79A7', tone: 'neutral', signals: 11, drift: '+1σ' },
    { name: 'Le Monde', dot: '#F28E2B', tone: 'analytical', signals: 9, drift: '−' },
    { name: 'Al Jazeera', dot: '#76B7B2', tone: 'critical', signals: 8, drift: '+1σ' },
    { name: 'RFI', dot: '#F28E2B', tone: 'analytical', signals: 7, drift: '−' },
    { name: 'Crisis Group', dot: '#59A14F', tone: 'expert', signals: 4, drift: '−' },
    { name: 'UCDP', dot: '#59A14F', tone: 'data', signals: 6, drift: '−' },
    { name: 'TASS', dot: '#E15759', tone: 'state · RU', signals: 5, drift: '+3σ' },
    { name: 'Anadolu', dot: '#E15759', tone: 'state · TR', signals: 4, drift: '+2σ' },
    { name: 'Africa Confid.', dot: '#9C755F', tone: 'expert', signals: 3, drift: '−' },
  ];
  return (
    <Card title="Media Monitor · 24h" subtitle="praxis.tacitus.me · Sahel · narrative diff · 71 articles">
      <div className="flex h-full flex-col gap-2 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-navy-500">
            Entman frame divergence
          </span>
          <span className="font-mono text-[8.5px] text-navy-500">
            Δ frame = 0.42 · GDELT-grounded
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
                Western frame
              </div>
              <div className="mt-0.5 text-[9px] leading-snug text-navy-700">
                JNIM advance · MINUSMA gap · civilian deaths cited
              </div>
            </div>
            <div className="rounded-md border border-crimson/20 bg-crimson/5 px-2 py-1">
              <div className="text-[8.5px] font-semibold uppercase tracking-wider text-crimson">
                State-aligned frame
              </div>
              <div className="mt-0.5 text-[9px] leading-snug text-navy-700">
                Sovereignty · &ldquo;neo-colonial&rdquo; framing · Wagner success
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
          Compare the post-MINUSMA security gap in Gao vs Kidal — civilian
          protection and humanitarian access. Use my saved corpus.
        </>
      ),
    },
    {
      role: 'praxis',
      text: (
        <>
          Reasoning over 142 GDELT/UCDP signals (last 7d), 9 OCHA situation
          reports and 3 Crisis Group briefings.
          <br />
          <span className="font-semibold text-navy-900">Gao</span>:
          authority is split between FAMa, Africa Corps and JNIM-aligned
          cells; source triangulation flags 38 violence-against-civilians signals in
          7d, OCHA flags &ldquo;severe&rdquo; access on 4 of 6 cercles
          <span className="text-diplomatic-blue/80"> [OCHA · 2026-04-22]</span>.
          <br />
          <span className="font-semibold text-navy-900">Kidal</span>:
          since the Nov-2023 takeover, FAMa holds the town but the CMA-FLA
          coalition contests the periphery; Crisis Group assesses the
          Algiers Accord as &ldquo;de facto void&rdquo;
          <span className="text-diplomatic-blue/80"> [ICG · Briefing 198]</span>.
          <br />
          Glasl stage 7 in both, but driver mix differs. Want a 2-page
          comparative brief calibrated to your humanitarian-lead profile?
        </>
      ),
    },
    {
      role: 'user',
      text: <>Yes — neutral tone, IHL framing, no targeting language.</>,
    },
  ];

  return (
    <Card title="Ask PRAXIS · Calibrated" subtitle="agent · profile v3 · Sahel situation · 14 sources cited">
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
                {msg.role === 'praxis' ? 'PRAXIS · senior-analyst tone' : 'Sara K. · Humanitarian Lead'}
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
              {['GDELT', 'OCHA', 'ICG', 'UCDP', 'ReliefWeb'].map((s) => (
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
  // Real-looking EU FAC briefing section structure with one-line abstracts.
  const sections = [
    {
      label: 'Executive summary',
      body: 'Sahel security has deteriorated in Q1; AES exit from ECOWAS now structural.',
    },
    {
      label: 'Situation · 7d',
      body: '142 GDELT/UCDP signals · 354k IDPs · 4/6 Gao cercles severe access (OCHA).',
    },
    {
      label: 'Stakeholder map',
      body: 'Mali junta · AES · Africa Corps · JNIM · IS-Sahel · CMA-FLA · ECOWAS.',
    },
    {
      label: 'Risk assessment',
      body: 'Glasl 7 · INFORM 7.8 · escalation index +0.34 vs 30d baseline.',
    },
    {
      label: 'Options',
      body: 'Track 1: humanitarian corridor via Algeria · Track 2: ICRC IHL training.',
    },
    {
      label: 'Recommendation',
      body: 'Decouple humanitarian dialogue from sanctions track; protect Algiers backchannel.',
    },
  ];
  return (
    <Card title="Drafting Studio · Brief 04-26" subtitle="EU FAC · Sahel · v4 locked · 23 inline citations">
      <div className="flex h-full flex-col gap-2 p-3">
        <div className="grid grid-cols-[1fr_auto] gap-1.5">
          <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
              v4 · locked · IHL-clean · diff +18/−6
            </span>
            <span className="font-mono text-[8.5px] text-emerald-600">2026-04-26 11:42</span>
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
          {['UCDP', 'GDELT', 'OCHA', 'ReliefWeb', 'ICG', 'World Bank', 'UN News', 'Google Search'].map((s) => (
            <span
              key={s}
              className="rounded px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wide text-diplomatic-blue bg-diplomatic-blue/8 border border-diplomatic-blue/15"
            >
              {s}
            </span>
          ))}
          <span className="ml-auto font-mono text-[8.5px] text-navy-500">
            export → DOCX · PDF · UNDP-template
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
org:         OCHA · West Africa
seniority:   senior · 12y
audience:    cluster leads · donors · ERC
language:    en · fr backup
lenses:      protection > IPC >
             displacement > IHL
domains:     humanitarian + sec
red-lines:   no targeting advice
             no off-record sources`}
            </pre>
          </div>
          <div className="rounded-md border border-cream-200/60 bg-white/80 p-2">
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
              &lt;situation-frame&gt;
            </span>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[8.5px] leading-snug text-navy-700">
{`name:    Sahel · Northern Mali
phase:   Glasl 7 · INFORM 7.8
actors:  14 · edges 16
since:   2024-09-12 · update 12m`}
            </pre>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="rounded-md border border-cream-200/60 bg-white/80 px-2 py-1">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-navy-500">
              Frameworks active
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {['Glasl', 'INFORM', 'Fisher-Ury', 'Lederach', 'OCHA', 'IPC', 'IHL'].map((f) => (
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
          <ContextChip label="Corpus" value="217 sources" />
          <ContextChip label="Memory" value="48 facts · 9 trace" />
          <ContextChip label="SKC vector" value="768d · KNN" />
          <div className="mt-auto flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
            <span className={cn('h-1.5 w-1.5 rounded-full bg-emerald-500', !shouldReduceMotion && 'animate-pulse')} />
            <span className="text-[8.5px] font-semibold leading-tight text-emerald-700">
              Calibration injected · 38 tools live
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
