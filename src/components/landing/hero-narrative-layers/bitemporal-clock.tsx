"use client";

import { motion } from "framer-motion";

export function BitemporalClock({ active }: { active: boolean }) {
  return (
    <div
      className="pointer-events-auto absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/35 bg-white/80 shadow-lg shadow-navy-950/10 backdrop-blur"
      title="Bi-temporal: when we asserted it · when it was true."
      aria-hidden="true"
    >
      <span className="absolute h-7 w-7 rounded-full border border-navy-900/15" />
      <span className="absolute h-1.5 w-1.5 rounded-full bg-gold-500" />
      <motion.span
        className="absolute h-3.5 w-px origin-bottom rounded-full bg-diplomatic-blue"
        style={{ bottom: "50%" }}
        animate={active ? { rotate: 360 } : { rotate: 42 }}
        transition={active ? { duration: 6, repeat: Infinity, ease: "linear" } : undefined}
      />
      <motion.span
        className="absolute h-3 w-px origin-bottom rounded-full bg-crimson/80"
        style={{ bottom: "50%" }}
        animate={active ? { rotate: 360 } : { rotate: 132 }}
        transition={active ? { duration: 18, repeat: Infinity, ease: "linear" } : undefined}
      />
    </div>
  );
}
