"use client";

import { motion } from "framer-motion";

const claim = "The 2025 communiqué commits parties to demilitarize Zone A.";

export function ClaimToParagraph({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-2xl" aria-hidden="true">
      <div className="absolute right-4 top-4 h-24 w-28 rounded-md border border-diplomatic-blue/20 bg-white/75 p-2 shadow-lg shadow-navy-950/10 backdrop-blur">
        <div className="mb-1 h-1.5 w-14 rounded bg-navy-900/18" />
        <div className="mb-1 h-1.5 w-20 rounded bg-navy-900/12" />
        <motion.div
          className="h-8 rounded border border-gold-500/25 bg-gold-50/80 p-1"
          animate={active ? { opacity: [0.45, 1, 0.75] } : { opacity: 1 }}
          transition={active ? { duration: 12, repeat: Infinity, times: [0, 0.45, 1] } : undefined}
        >
          <div className="h-1 w-full rounded bg-gold-500/45" />
          <div className="mt-1 h-1 w-4/5 rounded bg-gold-500/35" />
        </motion.div>
        <motion.span
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
          animate={active ? { scale: [0, 1.15, 1], opacity: [0, 1, 1] } : { scale: 1, opacity: 1 }}
          transition={active ? { duration: 12, repeat: Infinity, times: [0.38, 0.45, 0.55] } : undefined}
        >
          ✓
        </motion.span>
      </div>
      <motion.div
        className="absolute left-[42%] top-[50%] max-w-[180px] rounded-md border border-gold-500/35 bg-white/90 px-2 py-1.5 text-[9px] font-semibold leading-snug text-navy-800 shadow-lg shadow-gold-500/10"
        initial={active ? { x: 0, y: 0, opacity: 0, scale: 0.9 } : { x: 86, y: -82, opacity: 1, scale: 0.9 }}
        animate={active ? { x: [0, 86, 86], y: [0, -82, -82], opacity: [0, 1, 0], scale: [0.9, 1, 0.92] } : { x: 86, y: -82, opacity: 1, scale: 0.9 }}
        transition={active ? { duration: 12, repeat: Infinity, times: [0.22, 0.45, 0.68], ease: "easeInOut" } : undefined}
      >
        {claim}
      </motion.div>
    </div>
  );
}
