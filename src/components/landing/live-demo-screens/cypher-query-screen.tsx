'use client';

import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

type ScreenProps = {
  progress: number;
  reduceMotion: boolean;
};

const QUERY = 'MATCH (a:Actor)-[:CONSTRAINS]->(r:Risk {case:"SYR-2025"}) RETURN a.name, r.name, r.score LIMIT 3';
const RESULTS = ['UN-led process', 'Border crossings', 'Host community strain'];

export function CypherQueryScreen({ progress, reduceMotion }: ScreenProps) {
  const queryText = reduceMotion ? QUERY : QUERY.slice(0, Math.max(18, Math.floor(QUERY.length * Math.min(progress * 1.55, 1))));
  const resultsVisible = reduceMotion || progress > 0.58;

  return (
    <div className="grid h-full gap-4 p-4 sm:grid-cols-[1.05fr_0.95fr]">
      <div className="overflow-hidden rounded-lg border border-navy-800 bg-navy-950 text-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
          <Terminal className="h-4 w-4 text-gold-300" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-blue-100/70">Cypher console</p>
        </div>
        <div className="p-4 font-mono text-xs leading-6 text-blue-100">
          <p className="text-emerald-300">neo4j@syria-case&gt;</p>
          <p className="mt-2 min-h-24 text-gold-100">{queryText}<span className="animate-pulse text-white">_</span></p>
          <motion.div animate={{ opacity: resultsVisible ? 1 : 0.15 }} className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-3">
            <p className="text-[10px] uppercase tracking-wider text-blue-100/55">Result</p>
            <p className="mt-1 text-emerald-200">3 rows · 22ms · citations attached</p>
          </motion.div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Highlighted nodes</p>
        <div className="relative mt-4 h-52 rounded-lg border border-slate-200 bg-white">
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <line x1="24%" y1="35%" x2="55%" y2="54%" className="stroke-diplomatic-blue/30" strokeWidth="2" />
            <line x1="55%" y1="54%" x2="76%" y2="28%" className="stroke-diplomatic-blue/30" strokeWidth="2" />
          </svg>
          {RESULTS.map((node, index) => (
            <motion.div
              key={node}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: ['24%', '55%', '76%'][index], top: ['35%', '54%', '28%'][index] }}
              animate={{ opacity: resultsVisible ? 1 : 0.28, scale: resultsVisible ? 1 : 0.9 }}
              transition={{ delay: index * 0.12 }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-diplomatic-blue/40 bg-diplomatic-blue/10 font-mono text-xs font-bold text-diplomatic-blue shadow-sm">
                {index + 1}
              </span>
              <span className="mt-1 block w-28 rounded bg-white px-2 py-1 text-center text-[10px] font-semibold leading-tight text-navy-700 shadow-sm">{node}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
