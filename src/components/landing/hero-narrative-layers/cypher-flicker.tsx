"use client";

import { motion } from "framer-motion";

const queries = [
  "MATCH p = (a:Actor {name:'State A'})-[:HAS_LEVERAGE_OVER*1..3]->(b:Actor) RETURN p",
  "MATCH (c:Claim {id:'C-217'})-[:SUPPORTED_BY]->(s:Source) RETURN s, c.confidence",
  "MATCH (n:Narrative)-[:CONTRADICTS]->(m:Narrative) WHERE m.region = $region",
];

export function CypherFlicker({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden h-10 overflow-hidden rounded-md border border-navy-950/15 bg-navy-950/85 px-3 py-2 shadow-lg shadow-navy-950/20 sm:block" aria-hidden="true">
      {queries.map((query, index) => (
        <motion.div
          key={query}
          className="absolute inset-x-3 top-2 font-mono text-[8px] leading-snug text-gold-100"
          initial={active ? { opacity: 0, y: 12 } : { opacity: index === 0 ? 1 : 0, y: 0 }}
          animate={active ? { opacity: [0, 1, 1, 0], y: [12, 0, 0, -10] } : { opacity: index === 0 ? 1 : 0, y: 0 }}
          transition={active ? { duration: 9, repeat: Infinity, delay: index * 3, times: [0, 0.09, 0.26, 0.34] } : undefined}
        >
          <motion.span
            className="inline-block overflow-hidden whitespace-nowrap align-bottom"
            initial={active ? { width: "0%" } : { width: "100%" }}
            animate={active ? { width: ["0%", "100%", "100%"] } : { width: "100%" }}
            transition={active ? { duration: 9, repeat: Infinity, delay: index * 3, times: [0, 0.09, 0.26] } : undefined}
          >
            {query}
          </motion.span>
          <motion.span
            className="ml-0.5 inline-block h-3 w-px bg-gold-200"
            animate={active ? { opacity: [0, 1, 0, 1] } : { opacity: 1 }}
            transition={active ? { duration: 0.8, repeat: Infinity } : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}
