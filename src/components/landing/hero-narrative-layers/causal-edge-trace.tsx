"use client";

import { motion } from "framer-motion";

export function CausalEdgeTrace({ active }: { active: boolean }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="hero-causal-edge-trace" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(232,185,49,0)" />
          <stop offset="48%" stopColor="rgba(232,185,49,0.95)" />
          <stop offset="100%" stopColor="rgba(232,185,49,0)" />
        </linearGradient>
      </defs>
      <motion.line
        x1="50"
        y1="48"
        x2="78"
        y2="30"
        stroke="url(#hero-causal-edge-trace)"
        strokeWidth="1.3"
        strokeLinecap="round"
        initial={active ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.55 }}
        animate={active ? { pathLength: [0, 1, 1], opacity: [0, 1, 0] } : { pathLength: 1, opacity: 0.55 }}
        transition={active ? { duration: 4, repeat: Infinity, times: [0, 0.18, 0.34], ease: [0.65, 0, 0.35, 1] } : undefined}
      />
    </svg>
  );
}
