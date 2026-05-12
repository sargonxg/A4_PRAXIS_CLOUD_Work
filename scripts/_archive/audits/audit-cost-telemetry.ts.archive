import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'scripts/bench-gliner-cost-reduction.py',
  'monitoring/dashboards/gliner-cost-reduction.json',
  'docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md',
];

const failures: string[] = [];
for (const file of required) {
  if (!existsSync(join(process.cwd(), file))) failures.push(`missing ${file}`);
}

const audit = read('docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md').toLowerCase();
for (const marker of ['GLiNER cost reduction', 'GraphRAG batch ceiling', 'review queue', 'cost telemetry']) {
  if (!audit.includes(marker.toLowerCase())) failures.push(`audit ledger missing marker: ${marker}`);
}

const dashboard = read('monitoring/dashboards/gliner-cost-reduction.json');
for (const metric of ['gliner_candidates_total', 'precision_extract_calls_total', 'graphrag_batch_cost_usd']) {
  if (!dashboard.includes(metric)) failures.push(`dashboard missing metric ${metric}`);
}

if (failures.length > 0) {
  console.error('Cost telemetry audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Cost telemetry audit passed for Pack 30 extraction wave. (static-marker)');

function read(file: string) {
  return existsSync(join(process.cwd(), file)) ? readFileSync(join(process.cwd(), file), 'utf8') : '';
}
