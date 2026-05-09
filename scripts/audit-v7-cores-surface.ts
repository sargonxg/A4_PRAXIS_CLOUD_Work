import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const coresSurface = read('src/components/v7/v7-cores-surface.tsx');
const coresPage = read('src/app/app/cores/page.tsx');
const situationPage = read('src/app/app/situation/page.tsx');
const sourcesPage = read('src/app/app/sources/page.tsx');
const advancedPage = read('src/app/app/advanced/page.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };

for (const token of [
  'data-testid="v7-cores-surface"',
  'Seven-chapter spine',
  'Stakeholders',
  'Tried & Failed',
  'CONTEXT_CORES',
  'Source receipts',
  'Document extraction',
  'V7SourceDocumentCorePanel',
  'V7AnalystSkillsPanel',
  'Graph and ontology',
  'Analyst Skills',
  'Specialist panels',
  'open-praxis-chat',
]) {
  if (!coresSurface.includes(token)) failures.push(`V7CoresSurface missing ${token}`);
}

for (const [path, page, token] of [
  ['src/app/app/cores/page.tsx', coresPage, '<V7CoresSurface />'],
  ['src/app/app/situation/page.tsx', situationPage, 'entryPoint="situation"'],
  ['src/app/app/sources/page.tsx', sourcesPage, 'entryPoint="sources"'],
  ['src/app/app/advanced/page.tsx', advancedPage, 'entryPoint="advanced"'],
] as const) {
  if (!page.includes('V7CoresSurface')) failures.push(`${path} does not render V7CoresSurface`);
  if (!page.includes(token)) failures.push(`${path} missing ${token}`);
}

if (!packageJson.scripts?.['audit:v7-cores-surface']) {
  failures.push('package.json missing audit:v7-cores-surface');
}

if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-cores-surface')) {
  failures.push('audit:gate missing audit:v7-cores-surface');
}

if (failures.length > 0) {
  console.error('[audit:v7-cores-surface] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-cores-surface] ok');
