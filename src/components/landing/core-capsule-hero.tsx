"use client";

/**
 * CoreCapsuleHero — Concept A: Core Forge → Hybrid Mesh.
 *
 * Animated hero illustration for the landing page. A single SVG island
 * runs a seamless ~9.6s loop on a manual requestAnimationFrame clock so
 * every phase is precisely choreographed:
 *
 *   t ∈ [0.00, 0.36)   storm of raw input motes drifts toward the hex
 *                      forge chamber.
 *   t ∈ [0.30, 0.52)   six core prisms crystallise into the hex slots.
 *   t ∈ [0.50, 0.62)   gold filaments stitch the cores into a single
 *                      Capsule silhouette and the camera pulls back.
 *   t ∈ [0.60, 0.78)   ring of three humans + three agents lights up
 *                      around the Capsule.
 *   t ∈ [0.74, 0.86)   source-receipt pulse flows from a human node
 *                      into the Source stratum then radiates back to
 *                      every node in the mesh.
 *   t ∈ [0.84, 0.96)   an agent node proposes a graph patch — Graph
 *                      stratum glows amber until a human node taps it
 *                      green, then a green ripple closes the loop.
 *   t ∈ [0.95, 1.00)   Capsule heartbeats once and motes re-spawn at
 *                      the edges so the next cycle is invisible.
 *
 * Reduced-motion + `?staticHero=1` (used by E2E tests) collapse the
 * island to the choreographed end frame so the page stays inspectable
 * without the timeline running.
 */

import { useEffect, useMemo, useReducer, useRef, useState } from "react";

const CYCLE_MS = 9600;
const VIEW_W = 800;
const VIEW_H = 680;
const CENTER_X = VIEW_W / 2;
const CENTER_Y = VIEW_H / 2 + 4;

const NAVY = "#0B1220";
const NAVY_DEEP = "#070C16";
const GOLD = "#E8B931";
const GOLD_SOFT = "#F1D170";
const CREAM = "#F4ECD8";
const AMBER = "#D6863A";
const APPROVED = "#5FB082";

const svgNumber = (value: number) => Number(value.toFixed(3));

type CoreId = "user" | "situation" | "source" | "graph" | "time" | "output";

interface CoreSlot {
  id: CoreId;
  label: string;
  short: string;
  tint: string;
  tintSoft: string;
  angleDeg: number;
}

const CORE_RADIUS = 158;
const PRISM_RX = 74;
const PRISM_RY = 58;

const CORES: CoreSlot[] = [
  { id: "user", label: "User Core", short: "Persona, mandate, lenses", tint: "#3A5A7A", tintSoft: "#6F8BAA", angleDeg: -90 },
  { id: "situation", label: "Situation Core", short: "Frame, actors, domain", tint: "#3F7A66", tintSoft: "#74AB95", angleDeg: -30 },
  { id: "source", label: "Source Core", short: "Receipts, page-spans", tint: "#C9A86A", tintSoft: "#E5D49E", angleDeg: 30 },
  { id: "graph", label: "Graph Core", short: "Claims, relations", tint: "#5B6B8C", tintSoft: "#8B9AB8", angleDeg: 90 },
  { id: "time", label: "Time Core", short: "Horizon, bitemporal", tint: "#A06A3C", tintSoft: "#C99975", angleDeg: 150 },
  { id: "output", label: "Output Core", short: "Cited memo, handover", tint: "#E6E2D6", tintSoft: "#FFFFFF", angleDeg: 210 },
];

const RING_RADIUS = 282;
const RING_NODES = [
  { kind: "human", angleDeg: -90 },
  { kind: "agent", angleDeg: -30 },
  { kind: "human", angleDeg: 30 },
  { kind: "agent", angleDeg: 90 },
  { kind: "human", angleDeg: 150 },
  { kind: "agent", angleDeg: 210 },
] as const;

const FACT_SOURCE_NODE_INDEX = 0; // human, top
const PATCH_AGENT_INDEX = 3; // agent, opposite a human approver
const PATCH_APPROVER_INDEX = 2; // human at 30°

// Pre-computed positions for cores + ring nodes ----------------------------

const corePositions = CORES.map((c) => {
  const a = (c.angleDeg * Math.PI) / 180;
  return { ...c, x: CENTER_X + Math.cos(a) * CORE_RADIUS, y: CENTER_Y + Math.sin(a) * CORE_RADIUS };
});

const ringPositions = RING_NODES.map((n) => {
  const a = (n.angleDeg * Math.PI) / 180;
  return { ...n, x: CENTER_X + Math.cos(a) * RING_RADIUS, y: CENTER_Y + Math.sin(a) * RING_RADIUS };
});

// ----- timing helpers -----------------------------------------------------

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function phaseProgress(t: number, start: number, end: number) {
  return clamp01((t - start) / (end - start));
}

// ----- mote storm ---------------------------------------------------------

interface Mote {
  seed: number;
  label: string;
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  delay: number;
  duration: number;
}

const MOTE_LABELS = [
  "Sources",
  "Documents",
  "Notes",
  "Receipts",
  "Actors",
  "Claims",
];

function buildMotes(): Mote[] {
  const m: Mote[] = [];
  for (let i = 0; i < 14; i += 1) {
    const side = i % 4; // 0 left, 1 right, 2 top, 3 bottom
    let startX = 0;
    let startY = 0;
    const rnd = (i * 9301 + 49297) % 233280 / 233280;
    const rnd2 = (i * 12345 + 6789) % 233280 / 233280;
    if (side === 0) { startX = -40 - rnd * 80; startY = rnd2 * VIEW_H; }
    if (side === 1) { startX = VIEW_W + 40 + rnd * 80; startY = rnd2 * VIEW_H; }
    if (side === 2) { startX = rnd * VIEW_W; startY = -40 - rnd2 * 80; }
    if (side === 3) { startX = rnd * VIEW_W; startY = VIEW_H + 40 + rnd2 * 80; }
    const cx = CENTER_X + (rnd - 0.5) * 200;
    const cy = CENTER_Y + (rnd2 - 0.5) * 160;
    m.push({
      seed: i,
      label: MOTE_LABELS[i % MOTE_LABELS.length],
      startX,
      startY,
      controlX: cx,
      controlY: cy,
      delay: rnd * 0.18,
      duration: 0.22 + rnd2 * 0.10,
    });
  }
  return m;
}

function quad(p0: number, p1: number, p2: number, t: number) {
  const it = 1 - t;
  return it * it * p0 + 2 * it * t * p1 + t * t * p2;
}

// ----- the component ------------------------------------------------------

export interface CoreCapsuleHeroProps {
  staticMode?: boolean;
  className?: string;
}

export function CoreCapsuleHero({ staticMode = false, className }: CoreCapsuleHeroProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [forcedStatic, setForcedStatic] = useState(false);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    const smallMq = window.matchMedia("(max-width: 768px)");
    setIsSmall(smallMq.matches);
    const smallHandler = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    smallMq.addEventListener("change", smallHandler);
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("staticHero") === "1") setForcedStatic(true);
    } catch {
      // ignore
    }
    return () => {
      mq.removeEventListener("change", handler);
      smallMq.removeEventListener("change", smallHandler);
    };
  }, []);

  const isStatic = staticMode || reducedMotion || forcedStatic;
  // Start animation mid-cycle so SSR/first paint shows a composed frame
  // (cores crystallised, mesh forming) instead of an empty storm intro.
  const tRef = useRef(isStatic ? 0.72 : 0.62);
  const rafRef = useRef<number | null>(null);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const motes = useMemo(() => buildMotes(), []);

  useEffect(() => {
    if (isStatic) {
      tRef.current = 0.72;
      force();
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      tRef.current = (tRef.current + dt / CYCLE_MS) % 1;
      force();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isStatic]);

  const t = tRef.current;

  // ---- timeline derived state ----
  const stormFade = 1 - phaseProgress(t, 0.30, 0.50);
  const forgeReveal = phaseProgress(t, 0.06, 0.32);
  const ribbonFlow = phaseProgress(t, 0.04, 0.48);
  const eyeScan = phaseProgress(t, 0.12, 0.34);
  const coreCrystal = phaseProgress(t, 0.30, 0.52);
  const filamentDraw = phaseProgress(t, 0.50, 0.64);
  const capsuleSettle = phaseProgress(t, 0.55, 0.68);
  const groundingBeam = phaseProgress(t, 0.62, 0.78);
  const ringReveal = phaseProgress(t, 0.60, 0.78);
  const factPulse = phaseProgress(t, 0.74, 0.86);
  const patchPulse = phaseProgress(t, 0.84, 0.96);
  const heartbeat = phaseProgress(t, 0.93, 1.0);

  // The laminate strata accumulate over the whole cycle and only reset
  // at the heartbeat — visually communicating that knowledge keeps
  // layering up as work moves through the capsule.
  const laminateFill = easeInOut(clamp01((t < 0.96 ? t / 0.96 : 1) - 0.05));

  // overall capsule scale: zooms out slightly after filaments form
  const capsuleScale = 0.92 + 0.06 * easeInOut(capsuleSettle) - 0.02 * heartbeat;

  return (
    <div
      className={[
        "relative aspect-[800/680] w-full overflow-hidden rounded-2xl ring-1 ring-amber-200/20",
        "shadow-[0_20px_80px_-30px_rgba(7,12,22,0.55),0_4px_24px_-12px_rgba(7,12,22,0.35)]",
        className ?? "",
      ].join(" ")}
      aria-label="Animated illustration: uploaded knowledge becomes six context cores, then Ask PRAXIS answers from the active capsule."
      role="img"
    >
      <svg
        viewBox={isSmall ? `100 60 600 560` : `0 0 ${VIEW_W} ${VIEW_H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Background gradient — deep operations-room navy */}
          <radialGradient id="bg-glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#142036" />
            <stop offset="55%" stopColor={NAVY} />
            <stop offset="100%" stopColor={NAVY_DEEP} />
          </radialGradient>
          {/* Grain pattern — subtle noise */}
          <pattern id="grain" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="transparent" />
            <circle cx="0.4" cy="0.4" r="0.4" fill="#1b2840" opacity="0.55" />
          </pattern>
          {/* Hex chamber stroke gradient */}
          <linearGradient id="hex-stroke" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.55" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0.10" />
          </linearGradient>
          {/* Filament gradient */}
          <linearGradient id="filament" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0" />
            <stop offset="50%" stopColor={GOLD_SOFT} stopOpacity="1" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
          {/* Per-prism gradients */}
          {CORES.map((c) => (
            <radialGradient key={c.id} id={`prism-${c.id}`} cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor={c.tintSoft} stopOpacity="0.95" />
              <stop offset="60%" stopColor={c.tint} stopOpacity="0.85" />
              <stop offset="100%" stopColor={NAVY_DEEP} stopOpacity="0.9" />
            </radialGradient>
          ))}
          {/* Capsule halo */}
          <radialGradient id="capsule-halo" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={GOLD_SOFT} stopOpacity="0.18" />
            <stop offset="60%" stopColor={GOLD} stopOpacity="0.06" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
          {/* Mote text */}
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
          {/* Top + bottom vignette gradients */}
          <linearGradient id="vignette-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={NAVY_DEEP} stopOpacity="0.9" />
            <stop offset="100%" stopColor={NAVY_DEEP} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="vignette-bot" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={NAVY_DEEP} stopOpacity="0.9" />
            <stop offset="100%" stopColor={NAVY_DEEP} stopOpacity="0" />
          </linearGradient>
          {/* Data ribbon — gold ink flowing inward */}
          <linearGradient id="ribbon-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0" />
            <stop offset="40%" stopColor={GOLD_SOFT} stopOpacity="0.95" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
          {/* Expert-eye scan line gradient */}
          <linearGradient id="scan-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0" />
            <stop offset="50%" stopColor={GOLD_SOFT} stopOpacity="0.85" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
          {/* Grounding beam — vertical column of light */}
          <linearGradient id="grounding-beam" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={GOLD_SOFT} stopOpacity="0" />
            <stop offset="60%" stopColor={GOLD_SOFT} stopOpacity="0.55" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0.9" />
          </linearGradient>
          {/* Iris glow for the organic chamber */}
          <radialGradient id="iris-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD_SOFT} stopOpacity="0.05" />
            <stop offset="70%" stopColor={GOLD} stopOpacity="0.02" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#bg-glow)" />
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#grain)" opacity="0.35" />

        {/* Vignette frame — top + bottom soft fades for cinematic feel */}
        <rect x="0" y="0" width={VIEW_W} height={120} fill="url(#vignette-top)" />
        <rect x="0" y={VIEW_H - 120} width={VIEW_W} height={120} fill="url(#vignette-bot)" />

        {/* Architectural corner brackets — gold, very subtle */}
        <CornerBrackets />

        {/* Receipt ticker — faint stamp at the top edge */}
        <g opacity={0.55}>
          <line x1={36} y1={28} x2={VIEW_W - 36} y2={28} stroke={GOLD} strokeOpacity={0.18} strokeWidth={0.6} />
          <text x={36} y={20} fontSize={8} fontFamily="ui-monospace, monospace" fill={CREAM} fillOpacity={0.55} letterSpacing="0.24em">
            PRAXIS · CONTEXT CAPSULE FORGE
          </text>
          <text x={VIEW_W - 36} y={20} fontSize={8} fontFamily="ui-monospace, monospace" fill={CREAM} fillOpacity={0.55} letterSpacing="0.24em" textAnchor="end">
            REV 2026.05 · LIVE
          </text>
        </g>

        {/* Concentric chamber rings */}
        <g opacity={0.55 * (forgeReveal + capsuleSettle * 0.5)}>
          {[330, 280, 230].map((r, i) => (
            <circle
              key={r}
              cx={CENTER_X}
              cy={CENTER_Y}
              r={r}
              fill="none"
              stroke={GOLD}
              strokeOpacity={0.08 - i * 0.015}
              strokeWidth={1}
            />
          ))}
        </g>

        {/* Capsule halo */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={240}
          fill="url(#capsule-halo)"
          opacity={0.4 + 0.6 * capsuleSettle - 0.2 * heartbeat}
        />

        {/* Forge chamber — organic rounded 12-point outline (squircle feel) */}
        <OrganicChamber
          cx={CENTER_X}
          cy={CENTER_Y}
          r={216}
          stroke="url(#hex-stroke)"
          strokeWidth={1.4}
          opacity={0.78 * forgeReveal * (1 - 0.35 * capsuleSettle)}
          t={t}
        />
        {/* Inner iris glow */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={180}
          fill="url(#iris-glow)"
          opacity={0.7 * forgeReveal}
        />

        {/* Data ribbons — elegant gold ink streams flowing inward */}
        <DataRibbons t={t} flow={ribbonFlow} />

        {/* Expert-eye scan — horizontal sweep highlighting what's coming in */}
        <ExpertEyeScan progress={eyeScan} />

        {/* Knowledge laminate — sediment strata at the left edge, growing
            over the cycle. The bottom band is the bedrock of tacit
            judgement; each band above is a successive layer of structured
            context this capsule has captured. */}
        <KnowledgeLaminate fill={laminateFill} t={t} />

        {/* Mote storm */}
        <g opacity={stormFade}>
          {(isSmall ? motes.slice(0, 10) : motes).map((m) => {
            const local = phaseProgress(t, m.delay, m.delay + m.duration);
            if (local <= 0 || local >= 1) return null;
            const e = easeInOut(local);
            const px = quad(m.startX, m.controlX, CENTER_X, e);
            const py = quad(m.startY, m.controlY, CENTER_Y, e);
            const opacity = Math.sin(local * Math.PI);
            return (
              <g key={m.seed} transform={`translate(${px}, ${py})`} opacity={opacity}>
                <rect
                  x={-22}
                  y={-7}
                  width={44}
                  height={14}
                  rx={2}
                  fill={NAVY_DEEP}
                  stroke={GOLD}
                  strokeOpacity={0.45}
                  strokeWidth={0.6}
                />
                <text
                  x={0}
                  y={2}
                  textAnchor="middle"
                  fontSize={6.5}
                  fontFamily="ui-monospace, monospace"
                  fill={CREAM}
                  fillOpacity={0.85}
                  filter="url(#soft)"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Filaments connecting cores into the capsule silhouette */}
        <g opacity={0.85 * filamentDraw}>
          {corePositions.map((a, i) => {
            const b = corePositions[(i + 1) % corePositions.length];
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            const drawn = clamp01((filamentDraw - i * 0.05) * 1.6);
            const dash = len * drawn;
            return (
              <line
                key={`fil-${a.id}-${b.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="url(#filament)"
                strokeWidth={1.4}
                strokeDasharray={`${dash} ${len}`}
                strokeLinecap="round"
              />
            );
          })}
          {/* Inner spokes from center to each prism */}
          {corePositions.map((c) => (
            <line
              key={`spoke-${c.id}`}
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={c.x}
              y2={c.y}
              stroke={GOLD}
              strokeOpacity={0.18 * filamentDraw}
              strokeWidth={0.6}
              strokeDasharray="2 4"
            />
          ))}
        </g>

        {/* Camera pull-back wrapper: scale around center */}
        <g transform={`translate(${CENTER_X}, ${CENTER_Y}) scale(${capsuleScale}) translate(${-CENTER_X}, ${-CENTER_Y})`}>
          {/* The six core prisms */}
          {corePositions.map((c, idx) => {
            const local = clamp01((coreCrystal - idx * 0.04) * 1.6);
            const e = easeInOut(local);
            const scale = 0.2 + 0.8 * e;
            const op = e;
            return (
              <g key={c.id} transform={`translate(${c.x}, ${c.y}) scale(${scale})`} opacity={op}>
                <CorePrism core={c} t={t} />
              </g>
            );
          })}

          {/* Source stratum receipt pulse marker (anchored at source prism) */}
          <SourcePulseGlow active={factPulse} sourcePos={corePositions[2]} />
          {/* Graph patch overlay (anchored at graph prism) */}
          <GraphPatchGlow patch={patchPulse} graphPos={corePositions[3]} />
          {/* Grounding beam — a single claim descends and anchors to a
              cited receipt at the bottom of the capsule. This is the
              "PRAXIS grounds answers in receipts" beat. */}
          <GroundingBeam progress={groundingBeam} />
        </g>

        {/* Hybrid team ring — humans + agents */}
        <g opacity={ringReveal}>
          {ringPositions.map((n, i) => {
            const local = clamp01((ringReveal - i * 0.04) * 1.6);
            const pulse =
              factPulse > 0.0 && factPulse < 1.0
                ? 1 + 0.18 * Math.sin(factPulse * Math.PI)
                : 1;
            const agentPulse =
              n.kind === "agent" && patchPulse > 0 && patchPulse < 0.5
                ? 1 + 0.22 * Math.sin(patchPulse * 2 * Math.PI)
                : 1;
            const approverPulse =
              i === PATCH_APPROVER_INDEX && patchPulse > 0.4 && patchPulse < 0.7
                ? 1 + 0.25 * Math.sin((patchPulse - 0.4) / 0.3 * Math.PI)
                : 1;
            const ringScale = local * pulse * agentPulse * approverPulse;
            return (
              <g key={`ring-${i}`} transform={`translate(${n.x}, ${n.y}) scale(${ringScale})`}>
                <RingNode kind={n.kind} />
                {i === FACT_SOURCE_NODE_INDEX && (
                  <SourceFactBubble visible={factPulse > 0 && factPulse < 0.45} />
                )}
                {i === PATCH_AGENT_INDEX && (
                  <PatchProposalBubble
                    visible={patchPulse > 0 && patchPulse < 0.45}
                  />
                )}
                {i === PATCH_APPROVER_INDEX && (
                  <ApprovedBubble visible={patchPulse > 0.45 && patchPulse < 0.85} />
                )}
              </g>
            );
          })}
        </g>

        {/* Fact pulse: human node → capsule centre → all nodes */}
        <FactPulse t={factPulse} />

        {/* Patch pulse: agent → graph core (amber) → approver → green ripple */}
        <PatchPulse t={patchPulse} />

        {/* Heartbeat ring on capsule */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={210 + 18 * heartbeat}
          fill="none"
          stroke={GOLD}
          strokeOpacity={0.5 * (1 - heartbeat)}
          strokeWidth={1.2}
        />

        {/* Capsule label band */}
        <g opacity={0.8 * capsuleSettle}>
          <rect
            x={CENTER_X - 84}
            y={CENTER_Y + 320}
            width={168}
            height={26}
            rx={13}
            fill={NAVY_DEEP}
            stroke={GOLD}
            strokeOpacity={0.45}
          />
          <text
            x={CENTER_X}
            y={CENTER_Y + 337}
            textAnchor="middle"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={CREAM}
            letterSpacing="0.18em"
          >
            CONTEXT CAPSULE
          </text>
        </g>
      </svg>

      {/* Subtitle layer overlaid in normal flow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <p className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#F4ECD8]/85 backdrop-blur">
          One stack · many minds · same posture
        </p>
      </div>
    </div>
  );
}

// =========================================================================
// Sub-components
// =========================================================================

function OrganicChamber({
  cx,
  cy,
  r,
  t,
  ...rest
}: { cx: number; cy: number; r: number; t: number } & React.SVGProps<SVGPathElement>) {
  // 24-point soft-rounded shape — petal-like, breathing slightly with t.
  const points: Array<[number, number]> = [];
  const segs = 24;
  for (let i = 0; i < segs; i += 1) {
    const a = (i / segs) * Math.PI * 2 - Math.PI / 2;
    const wobble = 1 + 0.022 * Math.sin(t * Math.PI * 2 * 0.6 + i * 0.4);
    const rr = r * wobble;
    points.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  // Catmull–Rom to bezier conversion for super-smooth closed path.
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < segs; i += 1) {
    const p0 = points[(i - 1 + segs) % segs];
    const p1 = points[i];
    const p2 = points[(i + 1) % segs];
    const p3 = points[(i + 2) % segs];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  d += " Z";
  return <path d={d} fill="none" {...rest} />;
}

function DataRibbons({ t, flow }: { t: number; flow: number }) {
  // Five elegant ribbons flowing in from cardinal directions. Each is
  // a stretched cubic Bezier that animates its strokeDashoffset to
  // simulate ink running toward the centre.
  if (flow <= 0) return null;
  const ribbons = [
    { sx: 60, sy: 110, c1x: 230, c1y: 120, c2x: 260, c2y: 320, label: "GDELT · 04-22" },
    { sx: VIEW_W - 60, sy: 130, c1x: 580, c1y: 160, c2x: 520, c2y: 300, label: "UCDP · CY-2026" },
    { sx: 80, sy: VIEW_H - 110, c1x: 220, c1y: VIEW_H - 100, c2x: 280, c2y: 420, label: "tacit · red lines" },
    { sx: VIEW_W - 80, sy: VIEW_H - 130, c1x: 600, c1y: VIEW_H - 110, c2x: 520, c2y: 420, label: "ICG · 2026" },
    { sx: VIEW_W / 2, sy: 60, c1x: VIEW_W / 2 - 80, c1y: 220, c2x: VIEW_W / 2 + 40, c2y: 280, label: "cable · 03" },
  ];
  return (
    <g opacity={Math.min(1, flow * 1.2)}>
      {ribbons.map((r, i) => {
        // Stagger each ribbon
        const local = clamp01((flow - i * 0.06) * 1.4);
        if (local <= 0) return null;
        const len = 480;
        const dash = len * local;
        const labelOpacity = local > 0.5 ? (1 - local) * 2 : local * 2;
        // Find midpoint of bezier for label
        const tm = 0.45;
        const mx =
          (1 - tm) ** 3 * r.sx +
          3 * (1 - tm) ** 2 * tm * r.c1x +
          3 * (1 - tm) * tm ** 2 * r.c2x +
          tm ** 3 * CENTER_X;
        const my =
          (1 - tm) ** 3 * r.sy +
          3 * (1 - tm) ** 2 * tm * r.c1y +
          3 * (1 - tm) * tm ** 2 * r.c2y +
          tm ** 3 * CENTER_Y;
        return (
          <g key={i}>
            <path
              d={`M ${r.sx} ${r.sy} C ${r.c1x} ${r.c1y}, ${r.c2x} ${r.c2y}, ${CENTER_X} ${CENTER_Y}`}
              fill="none"
              stroke="url(#ribbon-flow)"
              strokeWidth={1.4}
              strokeDasharray={`${dash} ${len}`}
              strokeLinecap="round"
              opacity={0.85 - 0.3 * Math.sin(t * Math.PI * 4 + i)}
            />
            {labelOpacity > 0.15 && (
              <text
                x={mx}
                y={my - 6}
                fontSize={7}
                fontFamily="ui-monospace, monospace"
                fill={CREAM}
                fillOpacity={0.7 * labelOpacity}
                letterSpacing="0.1em"
                textAnchor="middle"
              >
                {r.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function ExpertEyeScan({ progress }: { progress: number }) {
  if (progress <= 0 || progress >= 1) return null;
  const e = easeInOut(progress);
  const x = 40 + e * (VIEW_W - 80);
  const op = Math.sin(progress * Math.PI);
  return (
    <g opacity={op * 0.9}>
      {/* Vertical sweeping beam */}
      <rect x={x - 1.5} y={40} width={3} height={VIEW_H - 80} fill="url(#scan-gradient)" />
      <rect x={x - 24} y={40} width={48} height={VIEW_H - 80} fill="url(#scan-gradient)" opacity={0.15} />
      {/* Eye glyph at the head of the scan */}
      <g transform={`translate(${x}, ${52})`} opacity={0.95}>
        <ellipse cx={0} cy={0} rx={10} ry={5.5} fill="none" stroke={GOLD_SOFT} strokeWidth={1} />
        <circle cx={0} cy={0} r={2.6} fill={GOLD_SOFT} />
        <line x1={-12} y1={0} x2={-15} y2={0} stroke={GOLD_SOFT} strokeWidth={0.8} />
        <line x1={12} y1={0} x2={15} y2={0} stroke={GOLD_SOFT} strokeWidth={0.8} />
      </g>
      {/* "EXPERT EYES" stamp following the beam */}
      <text
        x={x}
        y={VIEW_H - 50}
        fontSize={7}
        fontFamily="ui-monospace, monospace"
        fill={CREAM}
        fillOpacity={0.65}
        letterSpacing="0.32em"
        textAnchor="middle"
      >
        EXPERT EYES
      </text>
    </g>
  );
}

function KnowledgeLaminate({ fill, t }: { fill: number; t: number }) {
  // Vertical stack at the left edge — 6 strata representing accumulated
  // layers of knowledge. Each stratum reveals progressively over the
  // cycle.
  const baseX = 28;
  const baseY = VIEW_H / 2 - 100;
  const w = 38;
  const stratumH = 22;
  const labels = ["TACIT", "SOURCES", "GRAPH", "TIME", "PERSONA", "OUTPUT"];
  const tints = ["#7A3F4F", "#C9A86A", "#5B6B8C", "#A06A3C", "#3A5A7A", "#E6E2D6"];
  return (
    <g>
      {/* Outer frame */}
      <rect
        x={baseX - 6}
        y={baseY - 10}
        width={w + 18}
        height={stratumH * 6 + 20}
        rx={4}
        fill={NAVY_DEEP}
        fillOpacity={0.45}
        stroke={GOLD}
        strokeOpacity={0.22}
        strokeWidth={0.7}
      />
      {/* Header label */}
      <text
        x={baseX - 6 + (w + 18) / 2}
        y={baseY - 16}
        fontSize={7}
        fontFamily="ui-monospace, monospace"
        fill={CREAM}
        fillOpacity={0.55}
        letterSpacing="0.22em"
        textAnchor="middle"
      >
        LAMINATE
      </text>
      {labels.map((lbl, i) => {
        const stratumProgress = clamp01((fill - i * 0.12) * 1.6);
        const fillH = stratumH * stratumProgress;
        const y = baseY + i * stratumH;
        const pulse = 0.85 + 0.15 * Math.sin(t * Math.PI * 4 + i);
        return (
          <g key={lbl}>
            <rect
              x={baseX}
              y={y}
              width={w}
              height={stratumH - 2}
              rx={2}
              fill={NAVY}
              stroke={tints[i]}
              strokeOpacity={0.4}
              strokeWidth={0.6}
            />
            <rect
              x={baseX}
              y={y + (stratumH - 2 - fillH)}
              width={w}
              height={fillH}
              rx={2}
              fill={tints[i]}
              fillOpacity={0.65 * pulse}
            />
            {/* receipt ticks */}
            <line
              x1={baseX + 4}
              y1={y + (stratumH - 2) / 2}
              x2={baseX + w - 4}
              y2={y + (stratumH - 2) / 2}
              stroke={CREAM}
              strokeOpacity={0.12}
              strokeWidth={0.4}
            />
            <text
              x={baseX + w + 6}
              y={y + 14}
              fontSize={6.5}
              fontFamily="ui-monospace, monospace"
              fill={CREAM}
              fillOpacity={0.55}
              letterSpacing="0.16em"
            >
              {lbl}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function GroundingBeam({ progress }: { progress: number }) {
  if (progress <= 0 || progress >= 1) return null;
  const e = easeInOut(progress);
  // Beam descends from capsule top to a citation slip at the bottom.
  const topY = CENTER_Y - 110;
  const bottomY = CENTER_Y + 120;
  const x = CENTER_X + 38;
  const beamY = topY + (bottomY - topY) * e;
  const beamH = Math.max(8, beamY - topY);
  const op = Math.sin(progress * Math.PI);
  return (
    <g opacity={op}>
      {/* Beam column */}
      <rect x={x - 4} y={topY} width={8} height={beamH} fill="url(#grounding-beam)" opacity={0.85} />
      <rect x={x - 12} y={topY} width={24} height={beamH} fill="url(#grounding-beam)" opacity={0.25} />
      {/* Anchor receipt at base when beam fully descended */}
      {progress > 0.55 && (
        <g transform={`translate(${x}, ${bottomY})`}>
          <rect x={-38} y={-10} width={76} height={20} rx={3} fill={NAVY_DEEP} stroke={GOLD_SOFT} strokeWidth={0.9} />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            fontSize={7}
            fontFamily="ui-monospace, monospace"
            fill={GOLD_SOFT}
            letterSpacing="0.12em"
          >
            CLAIM · [§4, p.12]
          </text>
          <circle cx={-44} cy={0} r={2} fill={GOLD} />
        </g>
      )}
      {/* Tracer dot at beam head */}
      <circle cx={x} cy={beamY} r={3.4} fill={GOLD_SOFT} />
    </g>
  );
}

function CornerBrackets() {
  const pad = 18;
  const len = 22;
  const stroke = GOLD;
  const op = 0.45;
  const sw = 1;
  return (
    <g>
      {/* TL */}
      <line x1={pad} y1={pad} x2={pad + len} y2={pad} stroke={stroke} strokeOpacity={op} strokeWidth={sw} />
      <line x1={pad} y1={pad} x2={pad} y2={pad + len} stroke={stroke} strokeOpacity={op} strokeWidth={sw} />
      {/* TR */}
      <line x1={VIEW_W - pad} y1={pad} x2={VIEW_W - pad - len} y2={pad} stroke={stroke} strokeOpacity={op} strokeWidth={sw} />
      <line x1={VIEW_W - pad} y1={pad} x2={VIEW_W - pad} y2={pad + len} stroke={stroke} strokeOpacity={op} strokeWidth={sw} />
      {/* BL */}
      <line x1={pad} y1={VIEW_H - pad} x2={pad + len} y2={VIEW_H - pad} stroke={stroke} strokeOpacity={op} strokeWidth={sw} />
      <line x1={pad} y1={VIEW_H - pad} x2={pad} y2={VIEW_H - pad - len} stroke={stroke} strokeOpacity={op} strokeWidth={sw} />
      {/* BR */}
      <line x1={VIEW_W - pad} y1={VIEW_H - pad} x2={VIEW_W - pad - len} y2={VIEW_H - pad} stroke={stroke} strokeOpacity={op} strokeWidth={sw} />
      <line x1={VIEW_W - pad} y1={VIEW_H - pad} x2={VIEW_W - pad} y2={VIEW_H - pad - len} stroke={stroke} strokeOpacity={op} strokeWidth={sw} />
    </g>
  );
}

function Hex({ cx, cy, r, ...rest }: { cx: number; cy: number; r: number } & React.SVGProps<SVGPolygonElement>) {
  const points: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    points.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return <polygon points={points.join(" ")} fill="none" {...rest} />;
}

function CorePrism({ core, t }: { core: CoreSlot; t: number }) {
  const pulse = 1 + 0.04 * Math.sin(t * Math.PI * 4 + core.angleDeg);
  return (
    <g transform={`scale(${pulse})`}>
      {/* Outer prism shell — hexagonal */}
      <Hex cx={0} cy={0} r={PRISM_RX} fill={`url(#prism-${core.id})`} stroke={GOLD} strokeOpacity={0.55} strokeWidth={1.2} />
      <Hex cx={0} cy={0} r={PRISM_RX - 10} stroke={core.tintSoft} strokeOpacity={0.35} strokeWidth={0.6} />
      {/* Inner micro-visual per core */}
      <g>
        {core.id === "user" && <UserInner tint={core.tintSoft} />}
        {core.id === "situation" && <SituationInner tint={core.tintSoft} />}
        {core.id === "source" && <SourceInner tint={core.tintSoft} />}
        {core.id === "graph" && <GraphInner tint={core.tintSoft} t={t} />}
        {core.id === "time" && <TimeInner tint={core.tintSoft} t={t} />}
        {core.id === "output" && <OutputInner tint={core.tintSoft} />}
      </g>
      {/* Label band */}
      <rect x={-PRISM_RX + 12} y={PRISM_RY - 18} width={(PRISM_RX - 12) * 2} height={14} rx={3} fill={NAVY_DEEP} opacity={0.7} />
      <text x={0} y={PRISM_RY - 8} textAnchor="middle" fontSize={8.5} fontFamily="ui-sans-serif, system-ui" fill={CREAM} letterSpacing="0.12em">
        {core.label.toUpperCase()}
      </text>
    </g>
  );
}

function UserInner({ tint }: { tint: string }) {
  return (
    <g>
      {/* Concentric persona arcs */}
      {[34, 26, 18].map((r, i) => (
        <circle key={r} cx={0} cy={-2} r={r} fill="none" stroke={tint} strokeOpacity={0.8 - i * 0.2} strokeWidth={0.8} />
      ))}
      {/* Persona dot */}
      <circle cx={0} cy={-2} r={5} fill={tint} />
      {/* Lens ticks */}
      {[-60, 0, 60].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const x1 = Math.cos(a) * 34;
        const y1 = -2 + Math.sin(a) * 34;
        const x2 = Math.cos(a) * 40;
        const y2 = -2 + Math.sin(a) * 40;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD_SOFT} strokeWidth={1} />;
      })}
    </g>
  );
}

function SituationInner({ tint }: { tint: string }) {
  // Small actor graph: 5 nodes
  const nodes = [
    { x: 0, y: -14 },
    { x: -22, y: 0 },
    { x: 22, y: 0 },
    { x: -12, y: 18 },
    { x: 12, y: 18 },
  ];
  const edges: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 2]];
  return (
    <g>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={tint} strokeOpacity={0.55} strokeWidth={0.8} />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={i === 0 ? 4 : 3} fill={tint} />
      ))}
    </g>
  );
}

function SourceInner({ tint }: { tint: string }) {
  // Stack of receipt slips with stamped page-spans
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${-22 + i * 2}, ${-18 + i * 9})`}>
          <rect width={44} height={10} rx={1} fill={NAVY_DEEP} stroke={tint} strokeOpacity={0.7} strokeWidth={0.6} />
          <line x1={4} y1={5} x2={26} y2={5} stroke={tint} strokeOpacity={0.5} strokeWidth={0.6} />
          <rect x={30} y={2} width={11} height={6} fill={GOLD_SOFT} fillOpacity={0.7} />
        </g>
      ))}
    </g>
  );
}

function GraphInner({ tint, t }: { tint: string; t: number }) {
  // Mini lattice — 7 nodes
  const nodes = [
    { x: 0, y: -22 },
    { x: -20, y: -8 },
    { x: 20, y: -8 },
    { x: -22, y: 12 },
    { x: 22, y: 12 },
    { x: 0, y: 22 },
    { x: 0, y: 2 },
  ];
  const edges: Array<[number, number]> = [
    [0, 1], [0, 2], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [3, 5], [4, 5], [1, 3], [2, 4],
  ];
  return (
    <g>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke={tint}
          strokeOpacity={0.4 + 0.2 * Math.sin(t * Math.PI * 2 + i)}
          strokeWidth={0.7}
        />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={i === 6 ? 3.4 : 2.4} fill={i === 6 ? GOLD_SOFT : tint} />
      ))}
    </g>
  );
}

function TimeInner({ tint, t }: { tint: string; t: number }) {
  const angle1 = (t * 360 * 0.6) % 360;
  const angle2 = (t * 360 * 0.18 + 80) % 360;
  return (
    <g>
      {[36, 28, 20, 12].map((r, i) => (
        <circle key={r} cx={0} cy={0} r={r} fill="none" stroke={tint} strokeOpacity={0.45 - i * 0.07} strokeWidth={0.6} />
      ))}
      {/* Tick marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={svgNumber(Math.cos(a) * 32)}
            y1={svgNumber(Math.sin(a) * 32)}
            x2={svgNumber(Math.cos(a) * 36)}
            y2={svgNumber(Math.sin(a) * 36)}
            stroke={tint}
            strokeOpacity={0.7}
            strokeWidth={0.6}
          />
        );
      })}
      <line
        x1={0}
        y1={0}
        x2={svgNumber(Math.cos((angle1 - 90) * Math.PI / 180) * 30)}
        y2={svgNumber(Math.sin((angle1 - 90) * Math.PI / 180) * 30)}
        stroke={GOLD_SOFT}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <line
        x1={0}
        y1={0}
        x2={svgNumber(Math.cos((angle2 - 90) * Math.PI / 180) * 20)}
        y2={svgNumber(Math.sin((angle2 - 90) * Math.PI / 180) * 20)}
        stroke={tint}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <circle cx={0} cy={0} r={2} fill={GOLD} />
    </g>
  );
}

function OutputInner({ tint }: { tint: string }) {
  return (
    <g>
      {/* Folded memo */}
      <rect x={-22} y={-24} width={44} height={48} rx={2} fill={NAVY_DEEP} stroke={tint} strokeOpacity={0.7} strokeWidth={0.6} />
      <polygon points="22,-24 22,-12 10,-24" fill={tint} fillOpacity={0.5} />
      {/* Lines with cited brackets */}
      {[-12, -4, 4, 12].map((y, i) => (
        <g key={y}>
          <line x1={-16} y1={y} x2={i === 1 ? 8 : 14} y2={y} stroke={tint} strokeOpacity={0.7} strokeWidth={0.7} />
          {i === 1 && (
            <text x={11} y={y + 2} fontSize={5.5} fill={GOLD_SOFT} fontFamily="ui-monospace, monospace">
              [3]
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

function RingNode({ kind }: { kind: "human" | "agent" }) {
  return (
    <g>
      {/* Halo */}
      {kind === "human" ? (
        <circle r={26} fill="none" stroke={CREAM} strokeOpacity={0.18} strokeWidth={1.6} />
      ) : (
        <circle r={26} fill="none" stroke={CREAM} strokeOpacity={0.22} strokeWidth={1.6} strokeDasharray="3 4" />
      )}
      <circle r={18} fill={NAVY_DEEP} stroke={CREAM} strokeOpacity={0.55} strokeWidth={1} />
      {kind === "human" ? (
        <>
          {/* Head + shoulders */}
          <circle cx={0} cy={-4} r={5.5} fill={CREAM} fillOpacity={0.9} />
          <path d="M -8 9 Q 0 0 8 9" fill="none" stroke={CREAM} strokeOpacity={0.9} strokeWidth={1.8} strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Agent: hex chip with internal dot grid */}
          <Hex cx={0} cy={0} r={9} stroke={CREAM} strokeOpacity={0.85} strokeWidth={1.2} />
          {[-3, 0, 3].map((y) => (
            <g key={y}>
              <circle cx={-3} cy={y} r={0.9} fill={CREAM} fillOpacity={0.85} />
              <circle cx={0} cy={y} r={0.9} fill={CREAM} fillOpacity={0.85} />
              <circle cx={3} cy={y} r={0.9} fill={CREAM} fillOpacity={0.85} />
            </g>
          ))}
        </>
      )}
    </g>
  );
}

function SourceFactBubble({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <g transform="translate(0, -42)">
      <rect x={-46} y={-9} width={92} height={18} rx={3} fill={GOLD} opacity={0.95} />
      <text x={0} y={3} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={NAVY_DEEP} letterSpacing="0.06em">
        ICG · 2026-04-22
      </text>
    </g>
  );
}

function PatchProposalBubble({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <g transform="translate(0, -42)">
      <rect x={-52} y={-9} width={104} height={18} rx={3} fill={AMBER} opacity={0.95} />
      <text x={0} y={3} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={NAVY_DEEP} letterSpacing="0.06em">
        proposed · graph patch
      </text>
    </g>
  );
}

function ApprovedBubble({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <g transform="translate(0, -42)">
      <rect x={-40} y={-9} width={80} height={18} rx={3} fill={APPROVED} opacity={0.95} />
      <text x={0} y={3} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={NAVY_DEEP} letterSpacing="0.06em">
        approved
      </text>
    </g>
  );
}

function SourcePulseGlow({ active, sourcePos }: { active: number; sourcePos: { x: number; y: number } }) {
  if (active <= 0 || active >= 1) return null;
  const r = 70 + 60 * active;
  return (
    <circle
      cx={sourcePos.x}
      cy={sourcePos.y}
      r={r}
      fill="none"
      stroke={GOLD_SOFT}
      strokeOpacity={0.65 * (1 - active)}
      strokeWidth={2}
    />
  );
}

function GraphPatchGlow({ patch, graphPos }: { patch: number; graphPos: { x: number; y: number } }) {
  if (patch <= 0 || patch >= 1) return null;
  const phase = patch < 0.55 ? patch / 0.55 : 1; // amber growing
  const goingGreen = patch >= 0.55;
  const r = 50 + 60 * (goingGreen ? (patch - 0.55) / 0.45 : phase);
  const color = goingGreen ? APPROVED : AMBER;
  const op = goingGreen ? 0.5 * (1 - (patch - 0.55) / 0.45) : 0.6 * (1 - Math.abs(phase - 0.7));
  return (
    <g>
      <circle cx={graphPos.x} cy={graphPos.y} r={48} fill={color} fillOpacity={0.18 * (goingGreen ? 1 - (patch - 0.55) / 0.45 : phase)} />
      <circle cx={graphPos.x} cy={graphPos.y} r={r} fill="none" stroke={color} strokeOpacity={op} strokeWidth={2} />
    </g>
  );
}

function FactPulse({ t }: { t: number }) {
  if (t <= 0 || t >= 1) return null;
  const human = ringPositions[FACT_SOURCE_NODE_INDEX];
  // Phase 1: human → centre (0..0.45)
  // Phase 2: centre → all ring nodes (0.45..1.0)
  if (t < 0.45) {
    const p = easeInOut(t / 0.45);
    const x = human.x + (CENTER_X - human.x) * p;
    const y = human.y + (CENTER_Y - human.y) * p;
    return (
      <g>
        <circle cx={x} cy={y} r={6} fill={GOLD_SOFT} />
        <circle cx={x} cy={y} r={12} fill={GOLD} fillOpacity={0.3} />
      </g>
    );
  }
  const p = easeInOut((t - 0.45) / 0.55);
  return (
    <g>
      {ringPositions.map((n, i) => {
        const x = CENTER_X + (n.x - CENTER_X) * p;
        const y = CENTER_Y + (n.y - CENTER_Y) * p;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill={GOLD_SOFT} opacity={1 - p * 0.4} />
          </g>
        );
      })}
      <circle cx={CENTER_X} cy={CENTER_Y} r={20 + 80 * p} fill="none" stroke={GOLD} strokeOpacity={0.25 * (1 - p)} strokeWidth={1.4} />
    </g>
  );
}

function PatchPulse({ t }: { t: number }) {
  if (t <= 0 || t >= 1) return null;
  const agent = ringPositions[PATCH_AGENT_INDEX];
  const approver = ringPositions[PATCH_APPROVER_INDEX];
  const graph = corePositions[3];

  if (t < 0.45) {
    // agent → graph core
    const p = easeInOut(t / 0.45);
    const x = agent.x + (graph.x - agent.x) * p;
    const y = agent.y + (graph.y - agent.y) * p;
    return (
      <g>
        <circle cx={x} cy={y} r={5} fill={AMBER} />
        <circle cx={x} cy={y} r={11} fill={AMBER} fillOpacity={0.3} />
      </g>
    );
  }
  if (t < 0.7) {
    // graph → approver
    const p = easeInOut((t - 0.45) / 0.25);
    const x = graph.x + (approver.x - graph.x) * p;
    const y = graph.y + (approver.y - graph.y) * p;
    return (
      <g>
        <circle cx={x} cy={y} r={5} fill={AMBER} />
      </g>
    );
  }
  // approver → ripple back into mesh as green
  const p = easeInOut((t - 0.7) / 0.3);
  return (
    <g>
      <circle cx={approver.x} cy={approver.y} r={6 + 30 * p} fill="none" stroke={APPROVED} strokeOpacity={0.6 * (1 - p)} strokeWidth={2} />
      {ringPositions.map((n, i) => {
        const x = approver.x + (n.x - approver.x) * p;
        const y = approver.y + (n.y - approver.y) * p;
        return <circle key={i} cx={x} cy={y} r={3} fill={APPROVED} opacity={(1 - p) * 0.9} />;
      })}
    </g>
  );
}
