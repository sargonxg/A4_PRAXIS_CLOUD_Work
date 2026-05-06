"use client";

import { motion } from "framer-motion";

const receipts = [
  { label: "reuters.com/...", top: "29%", left: "72%" },
  { label: "un.org/...", top: "67%", left: "18%" },
  { label: "crisis-group.org/...", top: "55%", left: "82%" },
];

export function SourceReceipts({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
      {receipts.map((receipt, index) => (
        <motion.div
          key={receipt.label}
          className="absolute rounded-full border border-gold-500/35 bg-white/85 px-2 py-1 font-mono text-[8px] font-semibold text-navy-700 shadow-lg shadow-gold-500/10 backdrop-blur"
          style={{ top: receipt.top, left: receipt.left }}
          initial={active ? { x: 120, opacity: 0 } : { x: 0, opacity: 1 }}
          animate={active ? { x: [120, 0, 0, 120], opacity: [0, 1, 1, 0] } : { x: 0, opacity: 1 }}
          transition={active ? { duration: 6, repeat: Infinity, delay: 1 + index, times: [0, 0.18, 0.72, 1], ease: "easeInOut" } : undefined}
        >
          {receipt.label}
        </motion.div>
      ))}
      {receipts.map((receipt, index) => (
        <motion.span
          key={`${receipt.label}-ring`}
          className="absolute h-8 w-8 rounded-full border border-gold-400/55"
          style={{ top: `calc(${receipt.top} - 8px)`, left: `calc(${receipt.left} - 8px)` }}
          animate={active ? { scale: [0.6, 1.45, 0.6], opacity: [0, 0.65, 0] } : { scale: 1, opacity: 0.25 }}
          transition={active ? { duration: 6, repeat: Infinity, delay: 1.18 + index, times: [0, 0.15, 0.3] } : undefined}
        />
      ))}
    </div>
  );
}
