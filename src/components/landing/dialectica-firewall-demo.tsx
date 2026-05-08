"use client";

import { motion } from "framer-motion";

const REVIEW_TRACE =
  "Claim checked against active actors, source receipts, episode scope, and prior accepted findings.";

export function DialecticaFirewallDemo({ narrativeMotion }: { narrativeMotion: boolean }) {
  const shouldReduceMotion = !narrativeMotion;

  return (
    <div className="rounded-2xl border border-navy-100 bg-white/85 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">
          Claim firewall
        </p>
        <motion.span
          className="h-2.5 w-2.5 rounded-full bg-emerald-500"
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mt-4 rounded-lg border border-cream-300 bg-cream-50/70 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
          Claim
        </p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-navy-900">
          &quot;State A controls the northern corridor through Faction X.&quot;
        </p>
      </div>

      <motion.div
        className="mt-3 overflow-hidden rounded-lg border border-navy-900/10 bg-navy-950 p-3"
        animate={shouldReduceMotion ? undefined : { boxShadow: ["0 0 0 rgba(16,185,129,0)", "0 0 24px rgba(16,185,129,0.18)", "0 0 0 rgba(16,185,129,0)"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/50">
          Review trace
        </p>
        <motion.pre
          className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-blue-50"
          animate={shouldReduceMotion ? undefined : { opacity: [0.68, 1, 0.68] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {REVIEW_TRACE}
        </motion.pre>
      </motion.div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <motion.span
          className="rounded-full border border-emerald-600/20 bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700"
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          SOURCE GROUNDED
        </motion.span>
        <p className="text-xs font-medium text-navy-500">
          Path: 3 hops · Confidence ASSESSED · Source 2 receipts
        </p>
      </div>
    </div>
  );
}
