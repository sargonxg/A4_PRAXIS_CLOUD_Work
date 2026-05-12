#!/usr/bin/env tsx
/**
 * audit:kg-drift-runtime - query a live Postgres/Cloud SQL database for
 * committed graph node/edge counts. This is runtime-proof and opt-in only.
 */

import { execFileSync } from 'node:child_process';
import process from 'node:process';

const EXPECTED: Record<string, { nodes: number; edges: number }> = {
  'syria-2026': { nodes: 42, edges: 69 },
  'nordalia-2026': { nodes: 61, edges: 39 },
};

function runScalar(url: string, sql: string): number {
  const out = execFileSync('psql', [url, '-X', '-q', '-t', '-A', '-c', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15_000,
  }).trim();
  const value = Number(out);
  if (!Number.isFinite(value)) throw new Error(`psql returned non-numeric scalar: ${out}`);
  return value;
}

async function main() {
  if (process.env.PRAXIS_LIVE_DB_AUDIT !== 'true') {
    console.log('audit:kg-drift-runtime skipped (runtime-proof; PRAXIS_LIVE_DB_AUDIT != true)');
    return;
  }
  const url = process.env.PG_DATABASE_URL;
  if (!url) {
    console.log('audit:kg-drift-runtime skipped (runtime-proof; PG_DATABASE_URL unset)');
    return;
  }

  const failures: string[] = [];
  for (const [caseId, expected] of Object.entries(EXPECTED)) {
    const nodes = runScalar(
      url,
      `SELECT count(*)::int FROM graph_nodes WHERE case_id='${caseId}' AND status='committed'`,
    );
    const edges = runScalar(
      url,
      `SELECT count(*)::int FROM graph_edges WHERE case_id='${caseId}' AND status='committed'`,
    );
    if (nodes !== expected.nodes) failures.push(`${caseId}: nodes ${nodes} != expected ${expected.nodes}`);
    if (edges !== expected.edges) failures.push(`${caseId}: edges ${edges} != expected ${expected.edges}`);
  }

  if (failures.length > 0) {
    console.error('audit:kg-drift-runtime FAILED');
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log('audit:kg-drift-runtime passed (runtime-proof; live Postgres counts)');
}

main().catch((err) => {
  console.error('audit:kg-drift-runtime threw:', err);
  process.exit(2);
});
