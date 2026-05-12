import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const requiredFiles = [
  'infrastructure/bigquery/views/events.sql',
  'infrastructure/bigquery/queries/kpis.sql',
  'infrastructure/bigquery/deploy-views.sh',
  'infrastructure/monitoring/alerts.yaml',
  'docs/operational/KPIS.md',
  'docs/operational/DASHBOARD.md',
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
}

for (const [file, markers] of Object.entries({
  'infrastructure/bigquery/views/events.sql': [
    'CREATE OR REPLACE VIEW',
    '`praxis_telemetry.events`',
    'JSON_VALUE',
    'schemaVersion',
    'eventName',
  ],
  'infrastructure/bigquery/queries/kpis.sql': [
    'CREATE OR REPLACE VIEW',
    '`praxis_telemetry.kpis_daily`',
    'active_users',
    'tool_runs',
    'memo_exports',
    'graph_populates',
  ],
  'infrastructure/monitoring/alerts.yaml': [
    'praxis-telemetry-dropout',
    'praxis-tool-run-fail-rate',
    'praxis-document-upload-fail-rate',
  ],
  'docs/operational/KPIS.md': ['BigQuery', 'praxis_telemetry', 'D0 structured telemetry'],
  'docs/operational/DASHBOARD.md': ['Looker Studio', 'praxis_telemetry.kpis_daily'],
})) {
  const content = read(file);
  for (const marker of markers) {
    if (!content.includes(marker)) failures.push(`${file} missing marker ${marker}`);
  }
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
if (packageJson.scripts?.['audit:bq-views'] !== 'tsx scripts/audit-bq-views.ts') {
  failures.push('package.json missing audit:bq-views script');
}
if (!packageJson.scripts?.['audit:gate']?.includes('npm run audit:bq-views')) {
  failures.push('audit:gate must include audit:bq-views');
}

if (failures.length > 0) {
  console.error('audit:bq-views failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:bq-views passed for D1 KPI pipeline assets. (static-marker)');

function read(file: string): string {
  const full = join(root, file);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}
