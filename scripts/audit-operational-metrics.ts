import { existsSync, readFileSync } from 'node:fs';

const failures: string[] = [];

const requiredFiles = [
  'src/lib/admin/operational-metrics.ts',
  'src/app/api/cron/operational-metrics/route.ts',
  'infrastructure/scheduler/operational-metrics-cron.yaml',
  'tests/unit/lib/admin/operational-metrics.test.ts',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing operational metrics file: ${file}`);
}

const service = read('src/lib/admin/operational-metrics.ts');
for (const marker of ['tool-health', 'ingestion-pipeline', 'drift-verifier', 'context-health', 'symbolic-firewall', 'auth-abuse', 'cost-dashboard']) {
  if (!service.includes(marker)) failures.push(`operational metrics service missing panel: ${marker}`);
}

const route = read('src/app/api/cron/operational-metrics/route.ts');
for (const marker of ['requireCronSecret', 'collectOperationalMetrics', 'writeOperationalMetricsSnapshot']) {
  if (!route.includes(marker)) failures.push(`operational metrics cron missing marker: ${marker}`);
}

const cronAuth = read('src/lib/api/cron-auth.ts');
for (const marker of ['CRON_SECRET', 'x-cron-secret', 'authorization']) {
  if (!cronAuth.includes(marker)) failures.push(`shared cron auth missing marker: ${marker}`);
}

const diagnostics = read('src/app/api/admin/diagnostics/route.ts');
if (!diagnostics.includes('readLatestOperationalMetrics')) {
  failures.push('admin diagnostics does not read persisted operational metrics');
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
if (!packageJson.scripts?.['audit:operational-metrics']) failures.push('missing package script: audit:operational-metrics');

if (failures.length > 0) {
  console.error('Operational metrics audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Operational metrics audit passed. (static-marker)');

function read(file: string): string {
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}
