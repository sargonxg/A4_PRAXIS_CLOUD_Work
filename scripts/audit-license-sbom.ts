import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const allowed = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC']);
const visualizationDeps = ['react-force-graph-2d', 'vis-timeline', 'vis-data', 'maplibre-gl', 'react-map-gl'];
const workerLicenses: Record<string, string> = {
  docling: 'MIT',
  fastapi: 'MIT',
  gliner: 'Apache-2.0',
  'google-cloud-storage': 'Apache-2.0',
  graphrag: 'MIT',
  mesa: 'Apache-2.0',
  litellm: 'MIT',
  networkx: 'BSD-3-Clause',
  numpy: 'BSD-3-Clause',
  followthemoney: 'MIT',
  rigour: 'MIT',
  'python-louvain': 'BSD-3-Clause',
  pydantic: 'MIT',
  torch: 'BSD-3-Clause',
  transformers: 'Apache-2.0',
  uvicorn: 'BSD-3-Clause',
};

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

for (const requirementsPath of [
  'services/extract-docling/requirements.txt',
  'services/extract-ner-gliner/requirements.txt',
  'services/extract-graphrag/requirements.txt',
  'services/simulate-policy-abm/requirements.txt',
]) {
  if (!existsSync(join(root, requirementsPath))) {
    failures.push(`missing ${requirementsPath}`);
    continue;
  }
  const requirements = readFileSync(join(root, requirementsPath), 'utf8').split(/\r?\n/).filter(Boolean);
  for (const requirement of requirements) {
    const pkgName = requirement.split(/[<>=\[]/)[0]?.trim().toLowerCase();
    if (!pkgName) continue;
    const license = workerLicenses[pkgName];
    rows.push(`${requirementsPath}:${pkgName} ${license ?? 'UNKNOWN'}`);
    if (!license || !allowed.has(license)) failures.push(`${requirementsPath} contains unsupported or unknown license for ${pkgName}`);
  }
}

const backendPyproject = readFileSync(join(root, 'backend/pyproject.toml'), 'utf8');
for (const dep of ['networkx', 'python-louvain', 'followthemoney', 'rigour']) {
  const license = workerLicenses[dep];
  rows.push(`backend/pyproject.toml:${dep} ${license ?? 'UNKNOWN'}`);
  if (!backendPyproject.includes(`"${dep}`)) failures.push(`backend pyproject missing ${dep}`);
  if (!license || !allowed.has(license)) failures.push(`backend dependency ${dep} has unsupported or unknown license`);
}

for (const file of sourceFiles(['src', 'backend', 'scripts', 'tests'])) {
  if (relative(root, file).replace(/\\/g, '/') === 'scripts/audit-license-sbom.ts') continue;
  const text = readFileSync(file, 'utf8');
  const retiredFeedPattern = new RegExp(`\\b${'ACL' + 'ED'}\\b|\\b${'acl' + 'ed'}\\b`);
  if (retiredFeedPattern.test(text)) failures.push(`active source still references retired data feed: ${relative(root, file)}`);
}

if (failures.length > 0) {
  console.error('License SBOM audit failed');
  for (const row of rows) console.error(`- ${row}`);
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log('Pack 31 license SBOM audit passed.');
for (const row of rows) console.log(`- ${row}`);

function normalizeLicense(license: string | undefined) {
  if (!license) return 'UNKNOWN';
  if (license.includes('Apache-2.0') && license.includes('MIT')) return 'MIT';
  return license.replace(/[()]/g, '').trim();
}

function sourceFiles(dirs: string[]): string[] {
  const files: string[] = [];
  for (const dir of dirs) walk(join(root, dir), files);
  return files.filter((file) => /\.(ts|tsx|js|jsx|mjs|py)$/.test(file));
}

function walk(dir: string, files: string[]) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '__pycache__') continue;
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) walk(path, files);
    else files.push(path);
  }
}
