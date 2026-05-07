import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const visualizationDeps = ['react-force-graph-2d', 'vis-timeline', 'vis-data', 'maplibre-gl', 'react-map-gl'];
const allowed = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC']);
const packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
  packages?: Record<string, { version?: string; license?: string }>;
};

const failures: string[] = [];
const rows: string[] = [];

for (const dep of visualizationDeps) {
  const pkg = packageLock.packages?.[`node_modules/${dep}`];
  if (!pkg) {
    failures.push(`missing package-lock entry for ${dep}`);
    continue;
  }
  const license = normalizeLicense(pkg.license);
  rows.push(`${dep}@${pkg.version ?? 'unknown'} ${license}`);
  if (!allowed.has(license)) failures.push(`${dep} has unsupported or unknown license: ${license}`);
}

if (failures.length > 0) {
  console.error('Visualization license SBOM audit failed');
  for (const row of rows) console.error(`- ${row}`);
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log('Visualization license SBOM audit passed.');
for (const row of rows) console.log(`- ${row}`);

function normalizeLicense(license: string | undefined) {
  if (!license) return 'UNKNOWN';
  if (license.includes('Apache-2.0') && license.includes('MIT')) return 'MIT';
  return license.replace(/[()]/g, '').trim();
}
