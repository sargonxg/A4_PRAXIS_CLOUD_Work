"use client";

import { motion } from "framer-motion";

const SCORES = [
  { label: "Graph", value: 50, max: 50 },
  { label: "Source", value: 18, max: 20 },
  { label: "Reliab", value: 16, max: 20 },
  { label: "Consen", value: 0, max: 10 },
];

export function DialecticaTrustScore({ narrativeMotion }: { narrativeMotion: boolean }) {
  const shouldReduceMotion = !narrativeMotion;

  return (
    <div className="rounded-2xl border border-navy-100 bg-white/85 p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">
        Trust score
      </p>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <motion.p
            className="font-mono text-5xl font-bold leading-none text-navy-950"
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.92 }}
            whileInView={{ scale: [1, 1.08, 1] }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.72, ease: "easeOut" }}
          >
            84
            <span className="text-2xl text-navy-400">/100</span>
          </motion.p>
          <p className="mt-2 text-xs font-medium text-navy-500">
            Verifiable enough to show. Consensus still missing.
          </p>
        </div>
        <div className="rounded-lg border border-gold-500/20 bg-gold-500/10 px-3 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gold-700">
            Assessed
          </p>
          <p className="font-mono text-sm font-semibold text-navy-900">3 hops</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {SCORES.map((score, index) => {
          const percent = (score.value / score.max) * 100;

          return (
            <div key={score.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-navy-700">{score.label}</span>
                <span className="font-mono text-navy-500">
                  {score.value}/{score.max}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-navy-100">
                <motion.div
                  className="h-full rounded-full bg-diplomatic-blue"
                  initial={{ width: shouldReduceMotion ? `${percent}%` : "0%" }}
                  whileInView={{ width: `${percent}%` }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.75, delay: shouldReduceMotion ? 0 : index * 0.08, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
