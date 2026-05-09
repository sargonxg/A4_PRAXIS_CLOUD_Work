import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const outputsSurface = read('src/components/v7/v7-outputs-surface.tsx');
const outputsPage = read('src/app/app/outputs/page.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };

for (const token of [
  'data-testid="v7-outputs-surface"',
  'Produce the memo, brief, handover, or talking points',
  'Provenance before polish',
  'Claim coverage',
  'Handover',
  'Decision brief',
  'Policy memo',
  'Talking points',
  'My outputs',
  'Export path',
  'AGENTIC_WORKFLOWS',
  'open-praxis-chat',
]) {
  if (!outputsSurface.includes(token)) failures.push(`V7OutputsSurface missing ${token}`);
}

if (!outputsPage.includes('V7OutputsSurface')) failures.push('/app/outputs does not render V7OutputsSurface');

if (!packageJson.scripts?.['audit:v7-outputs-surface']) {
  failures.push('package.json missing audit:v7-outputs-surface');
}

if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-outputs-surface')) {
  failures.push('audit:gate missing audit:v7-outputs-surface');
}

if (failures.length > 0) {
  console.error('[audit:v7-outputs-surface] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-outputs-surface] ok');
