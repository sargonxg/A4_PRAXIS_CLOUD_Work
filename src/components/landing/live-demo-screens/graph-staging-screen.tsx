'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, GitBranch } from 'lucide-react';

type ScreenProps = {
  progress: number;
  reduceMotion: boolean;
};

const NODES = [
  { label: 'Aid corridors', x: '24%', y: '35%' },
  { label: 'Rights guarantees', x: '54%', y: '22%' },
  { label: 'Return pressure', x: '72%', y: '58%' },
];

export function GraphStagingScreen({ progress, reduceMotion }: ScreenProps) {
  const approved = reduceMotion || progress > 0.62;

  return (
    <div className="grid h-full gap-4 p-4 sm:grid-cols-[1.15fr_0.85fr]">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-diplomatic-blue" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Graph staging</p>
        </div>
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <line x1="24%" y1="35%" x2="54%" y2="22%" className={approved ? 'stroke-diplomatic-blue/35' : 'stroke-gold-500/40'} strokeWidth="2" />
          <line x1="54%" y1="22%" x2="72%" y2="58%" className={approved ? 'stroke-diplomatic-blue/35' : 'stroke-gold-500/40'} strokeWidth="2" />
          <line x1="24%" y1="35%" x2="72%" y2="58%" className="stroke-slate-300" strokeWidth="2" strokeDasharray="5 5" />
        </svg>
        {NODES.map((node, index) => (
          <motion.div
            key={node.label}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: node.x, top: node.y }}
            animate={{ scale: approved ? 1 : reduceMotion ? 1 : [1, 1.08, 1], opacity: 1 }}
            transition={{ delay: index * 0.08, duration: 1.4, repeat: approved || reduceMotion ? 0 : Infinity }}
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white text-xs font-bold shadow-lg ${approved ? 'border-diplomatic-blue text-diplomatic-blue' : 'border-gold-500 text-gold-700'}`}>
              {index + 1}
            </span>
            <span className="mt-1 block rounded-full bg-white px-2 py-0.5 text-center text-[10px] font-semibold text-navy-700 shadow-sm">{node.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Analyst review</p>
        <div className="mt-4 space-y-2">
          {NODES.map((node) => (
            <div key={node.label} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-semibold text-navy-800">{node.label}</span>
              <span className={approved ? 'text-diplomatic-blue' : 'text-gold-700'}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          ))}
        </div>
        <motion.div
          className="mt-5 flex items-center justify-center rounded-md bg-navy-900 px-4 py-3 text-sm font-semibold text-white"
          animate={reduceMotion ? { y: 0 } : { y: progress > 0.42 ? 0 : 10, opacity: progress > 0.28 ? 1 : 0.65 }}
        >
          Approve proposals
        </motion.div>
        <p className="mt-3 text-xs leading-relaxed text-navy-500">{approved ? 'Gold proposals are now blue graph commitments.' : 'Three candidate nodes are staged for approval.'}</p>
      </div>
    </div>
  );
}
