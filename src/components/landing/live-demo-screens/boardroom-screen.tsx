'use client';

import { motion } from 'framer-motion';
import { UsersRound } from 'lucide-react';

type ScreenProps = {
  progress: number;
  reduceMotion: boolean;
};

const ADVISORS = ['Mediator', 'Humanitarian', 'Economist', 'Security', 'Local media'];

export function BoardroomScreen({ progress, reduceMotion }: ScreenProps) {
  const pulse = reduceMotion || progress > 0.35;

  return (
    <div className="h-full p-4">
      <div className="h-full rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-diplomatic-blue" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Boardroom deliberation</p>
          </div>
          <span className="rounded-full bg-gold-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-700">5 advisors</span>
        </div>
        <div className="relative mt-5 grid gap-3 sm:grid-cols-5">
          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block" aria-hidden="true">
            <motion.line
              x1="30%"
              y1="46%"
              x2="70%"
              y2="46%"
              className="stroke-diplomatic-blue"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ opacity: pulse && !reduceMotion ? [0.25, 0.85, 0.25] : pulse ? 0.65 : 0.2 }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          </svg>
          {ADVISORS.map((advisor, index) => (
            <motion.div
              key={advisor}
              className="relative z-10 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              animate={reduceMotion ? { y: 0 } : { y: progress > index * 0.08 ? 0 : 10, opacity: progress > index * 0.08 ? 1 : 0.55 }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-diplomatic-blue/10 font-mono text-xs font-bold text-diplomatic-blue">{advisor.slice(0, 2).toUpperCase()}</div>
              <p className="mt-3 text-xs font-semibold text-navy-900">{advisor}</p>
              <p className="mt-2 text-[11px] leading-snug text-navy-500">
                {index === 1 || index === 3 ? 'Challenges timing assumptions with source receipts.' : 'Adds weighted judgment to the memo frame.'}
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                <motion.div className="h-full rounded-full bg-diplomatic-blue" animate={{ width: reduceMotion ? '84%' : `${Math.min(84, 24 + progress * 70)}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
