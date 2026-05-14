'use client';

/**
 * PathOperatorOrbit — landing-page complement to CoreCapsuleHero.
 *
 * Brief: Claude Code CC-10 ("CoreCapsuleHero gets the 7th capsule
 * (Path) prominently — distinct color, microcopy 'pick your operator'.
 * Six existing capsules orbit slowly. Hover any capsule → it lifts,
 * reveals top-3 frameworks for that core kind").
 *
 * Implementation notes:
 *   - The 45K SVG choreography in core-capsule-hero.tsx stays
 *     untouched; this component renders a complementary orbit so the
 *     7th-capsule story lands without rewriting that machinery.
 *   - Six core capsules (User/Situation/Source/Graph/Time/Output) sit
 *     on a slow rotating ring (24s loop). The 7th — Path — is fixed at
 *     the center in gold and gets a stronger lift on hover.
 *   - prefers-reduced-motion freezes the orbit and disables hover
 *     scaling.
 *   - White background `#F6F8FB` is locked. Depth is shadow + scale.
 */

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';

interface OrbitNode {
  kind: CoreSpecimenKind;
  label: string;
  serial: string;
  tint: string;
  frameworks: [string, string, string];
  angleDeg: number;
}

const RADIUS = 130;
const SIZE = 360;
const CENTER = SIZE / 2;

const ORBIT_NODES: OrbitNode[] = [
  { kind: 'user', label: 'User', serial: 'USR', tint: '#3A5A7A', frameworks: ['mandate', 'lenses', 'audience'], angleDeg: -90 },
  { kind: 'situation', label: 'Situation', serial: 'SIT', tint: '#3F7A66', frameworks: ['frame', 'actors', 'domain'], angleDeg: -30 },
  { kind: 'source', label: 'Source', serial: 'SRC', tint: '#C9A86A', frameworks: ['receipts', 'page-spans', 'gap-list'], angleDeg: 30 },
  { kind: 'graph', label: 'Graph', serial: 'GRF', tint: '#5B6B8C', frameworks: ['claims', 'relations', 'patches'], angleDeg: 90 },
  { kind: 'time', label: 'Time', serial: 'TIM', tint: '#A06A3C', frameworks: ['horizon', 'bitemporal', 'freshness'], angleDeg: 150 },
  { kind: 'output', label: 'Output', serial: 'OUT', tint: '#8B7355', frameworks: ['memo', 'handover', 'export'], angleDeg: 210 },
];

const PATH_FRAMEWORKS: [string, string, string] = ['operator voice', 'tool bundle', 'framework path'];

export function PathOperatorOrbit() {
  const reduceMotion = useReducedMotion();

  const positions = useMemo(
    () =>
      ORBIT_NODES.map((n) => {
        const a = (n.angleDeg * Math.PI) / 180;
        return { ...n, x: CENTER + Math.cos(a) * RADIUS, y: CENTER + Math.sin(a) * RADIUS };
      }),
    [],
  );

  return (
    <figure
      aria-label="Six cores orbit a Path operator capsule"
      className="relative mx-auto"
      style={{ width: SIZE, maxWidth: '100%' }}
    >
      {/* Caption — stays visible even with reduced motion */}
      <figcaption className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A5A00]">
        <span aria-hidden className="h-px w-4 bg-[#8A5A00]/50" />
        <span>+ Pick your operator path</span>
        <span aria-hidden className="h-px w-4 bg-[#8A5A00]/50" />
      </figcaption>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Orbit ring — slowly rotating wrapper around the six core capsules.
            The Path capsule sits in a non-rotating layer so it stays
            anchored at the center. */}
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
        >
          {positions.map((node) => (
            <OrbitCapsule key={node.kind} node={node} reduceMotion={!!reduceMotion} />
          ))}
        </motion.div>

        {/* Path capsule — 7th, anchored at center */}
        <PathCapsule reduceMotion={!!reduceMotion} />

        {/* Soft radial halo behind the orbit — depth via gradient, not bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(232,185,49,0.10), transparent 65%)',
          }}
        />
      </div>
    </figure>
  );
}

function OrbitCapsule({ node, reduceMotion }: { node: OrbitNode & { x: number; y: number }; reduceMotion: boolean }) {
  // The capsule itself counter-rotates so the text stays upright while the
  // wrapping orbit ring spins.
  return (
    <motion.div
      className="group absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: node.x, top: node.y }}
      animate={reduceMotion ? undefined : { rotate: -360 }}
      transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
    >
      <motion.div
        whileHover={reduceMotion ? undefined : { y: -4, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 240, damping: 28 }}
        className="relative flex h-20 w-20 flex-col items-center justify-center rounded-md border-2 bg-[#FAF8F2] shadow-md"
        style={{ borderColor: `${node.tint}aa` }}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-500">
          {node.serial}
        </span>
        <span className="font-serif text-xs leading-tight text-slate-950">{node.label}</span>
        <span aria-hidden className="absolute -bottom-1 -right-1 font-mono text-[10px]" style={{ color: node.tint }}>
          ◇
        </span>
      </motion.div>
      {/* Hover-revealed framework tooltip */}
      <div className="pointer-events-none absolute top-full mt-2 hidden whitespace-nowrap rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-lg group-hover:block">
        <span className="font-mono uppercase tracking-[0.14em] text-slate-500">top-3</span>{' '}
        {node.frameworks.join(' · ')}
      </div>
    </motion.div>
  );
}

function PathCapsule({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: CENTER, top: CENTER }}
    >
      <motion.div
        whileHover={reduceMotion ? undefined : { y: -6, scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 240, damping: 28 }}
        className="relative flex h-28 w-28 flex-col items-center justify-center rounded-md border-[3px] bg-[#FAF8F2] shadow-xl ring-2 ring-[#E8B931]/40"
        style={{ borderColor: '#8A5A00' }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8A5A00]">
          PRX-PATH
        </span>
        <span className="mt-0.5 font-serif text-base font-semibold text-slate-950">Path</span>
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8A5A00]">
          operator
        </span>
        <span aria-hidden className="absolute -top-1 -right-1 font-mono text-[12px] text-[#E8B931]">
          ◆
        </span>
      </motion.div>
      <div className="pointer-events-none absolute top-full mt-2 hidden whitespace-nowrap rounded-md border border-[#8A5A00]/40 bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-lg group-hover:block">
        <span className="font-mono uppercase tracking-[0.14em] text-[#8A5A00]">path</span>{' '}
        {PATH_FRAMEWORKS.join(' · ')}
      </div>
    </div>
  );
}
