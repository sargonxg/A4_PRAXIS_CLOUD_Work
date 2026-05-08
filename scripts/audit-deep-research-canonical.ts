import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const canonicalRoute = '/api/ai/deep-search-agent';
const deprecatedRoute = '/api/ai/deep-research';

function read(rel: string) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    failures.push(`missing ${rel}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function requireIncludes(rel: string, markers: string[]) {
  const text = read(rel);
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${rel} missing marker: ${marker}`);
  }
}

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git' || entry === 'graphify-out') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) files.push(full);
  }
  return files;
}

requireIncludes('docs/codex-prompts/PRAXIS_V2_Z3_DEEP_RESEARCH_CONSOLIDATE.md', [
  'deep-search-agent',
  'deep-research',
  'audit:deep-research-canonical',
]);

requireIncludes('docs/architecture/DEEP_RESEARCH.md', [
  '`/api/ai/deep-search-agent` is canonical',
  '`/api/ai/deep-research` is **soft-deprecated**',
  'X-PRAXIS-Canonical-Route',
]);

requireIncludes('src/lib/ai/deep-research-envelope.ts', [
  'streamResearchEngineEnvelope',
  'deepResearchStreamHeaders',
  'praxis_report_composer',
]);

requireIncludes('src/app/api/ai/deep-search-agent/route.ts', [
  'streamResearchEngineEnvelope',
  "toolId: 'deep-search-agent'",
  "envelope: 'deep-search-agent-v1'",
]);

requireIncludes('src/app/api/ai/deep-research/route.ts', [
  'Deprecated compatibility route',
  'X-PRAXIS-Deprecated-Route',
  'X-PRAXIS-Canonical-Route',
  canonicalRoute,
  "toolId: 'deep-search-agent'",
]);

const registry = read('src/lib/constants/tool-registry.ts');
const legacyEntryMatch = registry.match(/id: 'deep-research'[\s\S]*?aiRoute: '([^']+)'/);
if (!legacyEntryMatch) failures.push('src/lib/constants/tool-registry.ts missing deep-research entry');
else if (legacyEntryMatch[1] !== canonicalRoute) {
  failures.push(`deep-research registry aiRoute must be ${canonicalRoute}, got ${legacyEntryMatch[1]}`);
}

const verifyTools = read('scripts/verify-tools.ts');
if (verifyTools.includes(`route: '${deprecatedRoute}'`)) {
  failures.push('scripts/verify-tools.ts still verifies deprecated deep-research route');
}
if (!verifyTools.includes(`route: '${canonicalRoute}'`)) {
  failures.push('scripts/verify-tools.ts missing canonical deep-search-agent verification');
}

const forbiddenConsumerHits = walk(join(root, 'src'))
  .map((full) => ({ full, rel: relative(root, full).replace(/\\/g, '/'), text: readFileSync(full, 'utf8') }))
  .filter(({ rel }) => rel !== 'src/app/api/ai/deep-research/route.ts')
  .filter(({ text }) => text.includes(deprecatedRoute))
  .map(({ rel }) => rel);

if (forbiddenConsumerHits.length > 0) {
  failures.push(`deprecated route referenced outside compatibility route: ${forbiddenConsumerHits.join(', ')}`);
}

const pkg = read('package.json');
if (!pkg.includes('"audit:deep-research-canonical"')) failures.push('package.json missing audit:deep-research-canonical script');
if (!pkg.includes('npm run audit:deep-research-canonical')) failures.push('audit:gate missing audit:deep-research-canonical');

if (failures.length > 0) {
  console.error('Deep research canonical audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Deep research canonical audit passed: deep-search-agent is canonical, deep-research is soft-deprecated, and active consumers avoid the deprecated API. (static-marker)');
