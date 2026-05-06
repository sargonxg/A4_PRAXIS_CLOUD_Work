"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const particles = [
  { from: [-20, 8], to: [50, 48] },
  { from: [120, 12], to: [78, 30] },
  { from: [110, 96], to: [83, 58] },
  { from: [-12, 25], to: [20, 26] },
  { from: [-10, 78], to: [18, 68] },
  { from: [48, -16], to: [50, 18] },
  { from: [55, 118], to: [55, 82] },
  { from: [122, 80], to: [84, 84] },
  { from: [-16, 50], to: [13, 48] },
  { from: [118, 42], to: [91, 42] },
  { from: [34, 115], to: [35, 90] },
  { from: [30, -12], to: [35, 66] },
];

export function ParticleResolution({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
      {particles.map((particle, index) => (
        <motion.span
          key={`${particle.to.join("-")}-${index}`}
          className="absolute h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_18px_rgba(232,185,49,0.85)]"
          style={{ left: `${particle.to[0]}%`, top: `${particle.to[1]}%` }}
          initial={
            active
              ? { x: `${particle.from[0] - particle.to[0]}%`, y: `${particle.from[1] - particle.to[1]}%`, opacity: 0, scale: 0.4 }
              : { opacity: 0.7, scale: 0.8 }
          }
          animate={
            active && inView
              ? { x: "0%", y: "0%", opacity: [0, 1, 0.25], scale: [0.4, 1.2, 0.75] }
              : { x: "0%", y: "0%", opacity: 0.35, scale: 0.75 }
          }
          transition={{ duration: 1.6, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      ))}
    </div>
  );
}
