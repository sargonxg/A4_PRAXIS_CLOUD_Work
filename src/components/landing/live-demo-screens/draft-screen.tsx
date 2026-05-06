'use client';

import { motion } from 'framer-motion';
import { FilePenLine, ShieldCheck } from 'lucide-react';

type ScreenProps = {
  progress: number;
  reduceMotion: boolean;
};

const PARAGRAPH =
  'The transition risk is highest where aid access, return pressure, and local security guarantees collide. Open-source reporting supports a cautious sequencing memo with explicit trigger thresholds.';

export function DraftScreen({ progress, reduceMotion }: ScreenProps) {
  const text = reduceMotion ? PARAGRAPH : PARAGRAPH.slice(0, Math.max(36, Math.floor(PARAGRAPH.length * Math.min(progress * 1.45, 1))));
  const trust = reduceMotion ? 84 : Math.min(84, Math.round(42 + progress * 44));

  return (
    <div className="grid h-full gap-4 p-4 sm:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <FilePenLine className="h-4 w-4 text-diplomatic-blue" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Memo draft</p>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-navy-950">Syria transition risk memo</p>
          <p className="mt-4 min-h-28 text-sm leading-7 text-navy-700">{text}<span className="animate-pulse text-diplomatic-blue">|</span></p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Provenance</p>
        <motion.div
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
          animate={{ opacity: reduceMotion || progress > 0.46 ? 1 : 0.35, y: reduceMotion || progress > 0.46 ? 0 : 8 }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <span className="text-xs font-semibold text-emerald-800">Citation chain resolved</span>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-emerald-700">UN, humanitarian, economic, and local media receipts attached.</p>
        </motion.div>
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-end justify-between">
            <span className="text-xs font-semibold text-navy-600">Trust score</span>
            <span className="font-mono text-4xl font-bold text-diplomatic-blue">{trust}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <motion.div className="h-full rounded-full bg-diplomatic-blue" animate={{ width: `${trust}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
