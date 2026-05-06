"use client";

import { motion } from "framer-motion";

const advisors = [
  { label: "P", title: "Principal", radius: 110, duration: 18 },
  { label: "S", title: "Skeptic", radius: 130, duration: 21 },
  { label: "A", title: "Advocate", radius: 125, duration: 16 },
  { label: "D", title: "Devil's Advocate", radius: 135, duration: 23 },
  { label: "L", title: "Legal", radius: 120, duration: 19 },
];

export function BoardroomOrbit({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-2xl" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-0 w-0">
        {advisors.map((advisor, index) => (
          <motion.div
            key={advisor.label}
            className="absolute"
            style={{ width: advisor.radius * 2, height: advisor.radius * 2, marginLeft: -advisor.radius, marginTop: -advisor.radius }}
            animate={active ? { rotate: 360 } : { rotate: index * 68 }}
            transition={active ? { duration: advisor.duration, repeat: Infinity, ease: "linear" } : undefined}
          >
            <span
              className="absolute left-1/2 top-0 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-white/60 bg-navy-950/80 text-[9px] font-bold text-gold-300 shadow-lg shadow-navy-950/25"
              title={advisor.title}
            >
              {advisor.label}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.span
        className="absolute left-[38%] top-[32%] h-px w-[30%] origin-left rotate-[18deg] bg-gradient-to-r from-transparent via-gold-300 to-transparent"
        animate={active ? { opacity: [0, 0.8, 0] } : { opacity: 0.35 }}
        transition={active ? { duration: 6, repeat: Infinity, times: [0, 0.14, 0.28] } : undefined}
      />
    </div>
  );
}
