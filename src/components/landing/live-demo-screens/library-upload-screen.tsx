'use client';

import { motion } from 'framer-motion';
import { Check, FileText, Link2, UploadCloud } from 'lucide-react';

type ScreenProps = {
  progress: number;
  reduceMotion: boolean;
};

const SOURCES = ['reliefweb.int/jan-2024', 'ohchr.org/syria-update', 'worldbank.org/may-2025'];

export function LibraryUploadScreen({ progress, reduceMotion }: ScreenProps) {
  const done = reduceMotion || progress > 0.72;

  return (
    <div className="grid h-full gap-4 p-4 sm:grid-cols-[0.82fr_1.18fr]">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Intake queue</p>
          <UploadCloud className="h-4 w-4 text-diplomatic-blue" aria-hidden="true" />
        </div>
        <motion.div
          aria-hidden="true"
          className="mt-5 rounded-lg border border-dashed border-diplomatic-blue/35 bg-white p-4 shadow-sm"
          animate={
            reduceMotion
              ? { y: 38, opacity: 0.95 }
              : {
                  y: progress < 0.55 ? [0, 8, 38] : 38,
                  opacity: progress < 0.16 ? 0.72 : 0.95,
                }
          }
          transition={{ duration: 1.8, ease: 'easeInOut' }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gold-500/12 text-gold-700">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy-950">Syria transition sources.pdf</span>
              <span className="mt-1 block text-xs text-navy-500">18 citations · Jan 2024-May 2025</span>
            </span>
          </div>
        </motion.div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Library</p>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            {done ? 'Indexed' : 'Receiving'}
          </span>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="h-24 rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-diplomatic-blue" aria-hidden="true" />
              <p className="text-xs font-semibold text-navy-900">Syria case evidence packet</p>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2 rounded bg-slate-200" />
              <div className="h-2 w-5/6 rounded bg-slate-200" />
              <div className="h-2 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {SOURCES.map((source, index) => {
            const visible = reduceMotion || progress > 0.42 + index * 0.13;
            return (
              <motion.div
                key={source}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2"
                animate={{ opacity: visible ? 1 : 0.2, x: visible ? 0 : -8 }}
                transition={{ duration: 0.25 }}
              >
                {visible ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
                <span className="truncate font-mono text-[11px] text-navy-700">{source}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
