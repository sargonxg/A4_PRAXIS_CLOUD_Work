import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    failures.push(`missing ${path}`);
    return '';
  }
}

function includesAnyCase(text: string, token: string): boolean {
  return text.toLowerCase().includes(token.toLowerCase());
}

const buildLoop = read('docs/v7/build/03_BUILD_LOOP.md');
const packageJson = JSON.parse(read('package.json') || '{}') as { scripts?: Record<string, string> };
const status = read('docs/v7/STATUS.md');
const fixLog = read('docs/v7/FIX_LOG.md');
const index = read('docs/v7/INDEX.md');
const advancePrompt = read('docs/v7/prompts/ADVANCE.md');
const verifyPrompt = read('docs/v7/prompts/VERIFY.md');
const todo = read('docs/v7/V7_EXECUTION_TODO.md');
const drawer = read('src/components/v7/v7-core-drawer.tsx');
const proxy = read('src/app/api/backend/[...path]/route.ts');

for (const token of [
  'Loop A · Foundations',
  'Loop B · The new homepage',
  'Loop C · The new Ask surface',
  'Loop D · The new landing',
  'Loop E · User Core inline',
  'Loop F · Situation Core inline',
  'Loop G · Cores rail + share',
  'Vertex routing only',
  'Drawer-first for cores',
  'Two cores visible to the user',
  'Every claim in every output cites a source',
  'Owner scoping holds on every new query',
  'Cognee stays optional',
  'Candidate vs canonical preserved',
  'audit gate is the source of truth',
  'The simplification is the product',
]) {
  if (!buildLoop.includes(token)) failures.push(`03_BUILD_LOOP missing ${token}`);
}

for (const token of [
  'docs/v7/build/01_THE_NEW_FACE.md',
  'docs/v7/build/02_CORES_INLINE.md',
  'docs/v7/build/03_BUILD_LOOP.md',
]) {
  if (!index.includes(token)) failures.push(`docs/v7/INDEX.md missing build brief ${token}`);
}

for (const token of ['ADVANCE.md', 'VERIFY.md', 'one bounded step', 'full gate']) {
  if (
    !includesAnyCase(buildLoop, token) &&
    !includesAnyCase(advancePrompt, token) &&
    !includesAnyCase(verifyPrompt, token)
  ) {
    failures.push(`v7 loop prompts missing operating token: ${token}`);
  }
}

for (const token of ['03_BUILD_LOOP.md', 'Build Loop']) {
  if (!status.includes(token) && !fixLog.includes(token)) {
    failures.push(`v7 ledgers do not mention ${token}`);
  }
}

for (const token of [
  'Build-loop source of truth',
  'guarded by `audit:v7-build-loop`',
  'A-G loop order',
]) {
  if (!todo.includes(token)) failures.push(`V7_EXECUTION_TODO missing build-loop token: ${token}`);
}

for (const token of [
  "fetch('/api/backend/cores/me')",
  'Loaded from your saved User Core',
  'Using local defaults until your saved User Core is available',
]) {
  if (!drawer.includes(token)) failures.push(`User Core drawer missing hydration token: ${token}`);
}

for (const token of [
  "path === 'cores/me'",
  'User Core is hydrated from local defaults',
  "method: 'GET', pattern: /^cores\\/me$/",
]) {
  if (!proxy.includes(token)) failures.push(`backend proxy missing User Core hydration token: ${token}`);
}

if (!packageJson.scripts?.['audit:v7-build-loop']) failures.push('package.json missing audit:v7-build-loop');
if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-build-loop')) {
  failures.push('audit:gate missing audit:v7-build-loop');
}
if (!packageJson.scripts?.['audit:architecture-chain']) failures.push('package.json missing audit:architecture-chain');

if (failures.length > 0) {
  console.error('[audit:v7-build-loop] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-build-loop] ok');
