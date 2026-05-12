import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TELEMETRY_EVENT_NAMES } from '../src/types/telemetry';

const root = process.cwd();
const failures: string[] = [];

const requiredFiles = [
  'src/types/telemetry.ts',
  'src/lib/telemetry/emit.ts',
  'src/lib/telemetry/browser.ts',
  'src/app/api/telemetry/log/route.ts',
  'docs/architecture/TELEMETRY.md',
  'tests/unit/lib/telemetry/emit.test.ts',
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
}

for (const eventName of TELEMETRY_EVENT_NAMES) {
  if (!read('src/types/telemetry.ts').includes(`'${eventName}'`)) {
    failures.push(`telemetry type registry missing ${eventName}`);
  }
}

const coverage: Record<string, string[]> = {
  'src/app/api/situations/route.ts': ['case.create', 'emitTelemetrySafe'],
  'src/app/api/situations/[id]/route.ts': ['case.delete', 'emitTelemetrySafe'],
  'src/lib/api/with-calibration.ts': [
    'calibration.snapshot-built',
    'calibration.refusal',
    'calibration.force-run',
    'tool.run-start',
    'tool.run-complete',
    'tool.run-fail',
  ],
  'src/app/api/documents/upload/route.ts': [
    'document.upload-start',
    'document.upload-complete',
    'document.upload-fail',
  ],
  'src/app/api/graph/populate/route.ts': [
    'graph.populate-start',
    'graph.populate-complete',
    'graph.populate-fail',
  ],
  'src/app/api/telemetry/log/route.ts': ['route.timeout', 'isBrowserTelemetryEventName'],
};

for (const [file, markers] of Object.entries(coverage)) {
  const content = read(file);
  for (const marker of markers) {
    if (!content.includes(marker)) failures.push(`${file} missing marker ${marker}`);
  }
}

const emitSource = read('src/lib/telemetry/emit.ts');
if (!emitSource.includes('TELEMETRY_DETAILS_MAX_BYTES = 1024')) {
  failures.push('server emitter must enforce the 1KB telemetry details cap');
}
if (!emitSource.includes('console.log(JSON.stringify')) {
  failures.push('server emitter must write structured JSON lines to stdout');
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
if (packageJson.scripts?.['audit:telemetry-coverage'] !== 'tsx scripts/audit-telemetry-coverage.ts') {
  failures.push('package.json missing audit:telemetry-coverage script');
}
if (!packageJson.scripts?.['audit:gate']?.includes('npm run audit:telemetry-coverage')) {
  failures.push('audit:gate must include audit:telemetry-coverage');
}

if (failures.length > 0) {
  console.error('audit:telemetry-coverage failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:telemetry-coverage passed for D0 structured events. (static-marker)');

function read(file: string): string {
  const full = join(root, file);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}
