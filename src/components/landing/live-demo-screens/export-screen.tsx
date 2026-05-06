'use client';

import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';

type ScreenProps = {
  progress: number;
  reduceMotion: boolean;
};

export function ExportScreen({ progress, reduceMotion }: ScreenProps) {
  const stamped = reduceMotion || progress > 0.48;

  return (
    <div className="grid h-full gap-4 p-4 sm:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Export queue</p>
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-diplomatic-blue/10 text-diplomatic-blue">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy-950">Syria-risk-memo.docx</span>
              <span className="mt-1 block text-xs text-navy-500">JSON-LD footer embedded</span>
            </span>
          </div>
          <motion.div
            className="mt-5 flex items-center justify-center gap-2 rounded-md bg-navy-900 px-4 py-3 text-sm font-semibold text-white"
            animate={reduceMotion ? { scale: 1 } : { scale: progress > 0.28 ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 0.8, repeat: progress > 0.28 && !reduceMotion ? Infinity : 0 }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download DOCX
          </motion.div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mx-auto max-w-md rounded-md border border-slate-200 bg-slate-50 p-5">
          <p className="text-center text-sm font-semibold text-navy-950">Transition Risk Memo</p>
          <div className="mt-5 space-y-2">
            <div className="h-2 rounded bg-slate-300" />
            <div className="h-2 rounded bg-slate-200" />
            <div className="h-2 w-5/6 rounded bg-slate-200" />
            <div className="h-2 w-3/4 rounded bg-slate-200" />
          </div>
          <div className="mt-8 border-t border-slate-300 pt-3 font-mono text-[10px] leading-4 text-navy-500">
            {'{ "@context": "https://schema.org", "@type": "Report", "citationCount": 18 }'}
          </div>
        </div>
        <motion.div
          aria-hidden="true"
          className="absolute right-8 top-16 rotate-[-14deg] rounded-full border-4 border-emerald-600 px-5 py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-emerald-700"
          animate={{ opacity: stamped ? 1 : 0, scale: stamped ? 1 : 1.35 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        >
          Verified
        </motion.div>
      </div>
    </div>
  );
}
