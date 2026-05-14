'use client';

/**
 * QuotaIndicator — replacement for the legacy credit pill.
 *
 * Brief: Claude Code CC-10. Shows monthly flow usage. Soft-warn pill
 * at 80%, hard-block modal at 100% with upgrade CTA.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, X, ArrowUpRight } from 'lucide-react';
import { useQuota } from '@/hooks/use-quota';
import { cn } from '@/lib/utils/cn';

export function QuotaIndicator() {
  const { quota, loading } = useQuota();
  const [blockOpen, setBlockOpen] = useState(false);

  const pct = quota.flowsLimit > 0 ? Math.round((quota.flowsUsed / quota.flowsLimit) * 100) : 0;
  const tone = pct >= 100 ? 'block' : pct >= 80 ? 'warn' : 'ok';

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-400">
        <Gauge className="h-3 w-3" />
        …
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (tone === 'block' ? setBlockOpen(true) : null)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-mono transition',
          tone === 'block'
            ? 'border-red-300 bg-red-50 text-red-800 cursor-pointer hover:bg-red-100'
            : tone === 'warn'
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-white text-slate-700',
        )}
        title={`${quota.tier} · ${quota.flowsUsed}/${quota.flowsLimit} flows used`}
      >
        <Gauge className="h-3 w-3" />
        <span className="font-semibold uppercase tracking-[0.14em]">{quota.tier}</span>
        <span>{pct}%</span>
        <span className="hidden text-slate-400 sm:inline">·</span>
        <span className="hidden sm:inline">
          {quota.flowsUsed}/{quota.flowsLimit}
        </span>
      </button>

      <AnimatePresence>
        {blockOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setBlockOpen(false)}
              className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
              aria-label="Close upgrade prompt backdrop"
            />
            <motion.div
              initial={{ y: 12, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 12, scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
              className="relative z-10 w-full max-w-sm rounded-xl border border-slate-300 bg-white p-5 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setBlockOpen(false)}
                className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-700">
                quota reached
              </p>
              <h2 className="mt-1 font-serif text-xl text-slate-950">
                You've used this month's flows.
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                Upgrade to Practitioner for 500 monthly flows, all 10 operator paths, and Memory
                Bank persistence. Cancel anytime.
              </p>
              <Link
                href="/app/billing/upgrade"
                onClick={() => setBlockOpen(false)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
              >
                Upgrade now
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
