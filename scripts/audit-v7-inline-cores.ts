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

const brief = read('docs/v7/build/02_CORES_INLINE.md');
const drawer = read('src/components/v7/v7-core-drawer.tsx');
const home = read('src/components/v7/v7-home-surface.tsx');
const ask = read('src/components/v7/v7-ask-surface.tsx');
const cores = read('src/components/v7/v7-cores-surface.tsx');
const userCoreEditor = read('src/components/v7/v7-user-core-editor.tsx');
const userCorePage = read('src/app/app/cores/me/page.tsx');
const proxy = read('src/app/api/backend/[...path]/route.ts');
const backend = read('backend/routers/cores.py');
const packageJson = JSON.parse(read('package.json') || '{}') as { scripts?: Record<string, string> };

for (const token of ['The user only ever needs to think about **two**', 'My Core', 'Case Cores']) {
  if (!brief.includes(token)) failures.push(`02_CORES_INLINE brief missing ${token}`);
}

for (const token of [
  'data-testid="v7-core-drawer"',
  "data-core-kind={kind}",
  "'user' | 'situation'",
  "fetch('/api/backend/cores/me')",
  "fetch('/api/backend/cores'",
  'PATCH',
  '/api/backend/cores/me',
  'Loaded from your saved User Core',
  'Autosave',
  'Fork Case Core',
  'Share Case Core',
  'Local subtype',
  'Frame',
  'Actors',
  'Timeline',
  'Sources',
  'Graph',
  'Outputs',
]) {
  if (!drawer.includes(token)) failures.push(`v7 core drawer missing ${token}`);
}

for (const [path, source] of [
  ['src/components/v7/v7-home-surface.tsx', home],
  ['src/components/v7/v7-ask-surface.tsx', ask],
  ['src/components/v7/v7-cores-surface.tsx', cores],
] as const) {
  if (!source.includes('V7CoreDrawer')) failures.push(`${path} does not render V7CoreDrawer`);
  if (!source.includes('v7-core-chip')) failures.push(`${path} missing Core chip test id contract`);
}

if (home.includes("detail: 'Source Core'") || ask.includes("detail: 'Source Core'")) {
  failures.push('Home/Ask still expose Source Core as a first-class attached chip');
}

for (const token of [
  'data-testid="v7-user-core-editor"',
  "fetch('/api/backend/cores/me')",
  "method: 'PATCH'",
  'Save User Core',
  'Who PRAXIS is answering for',
  'gemini-3-flash',
  'gemini-3.1-pro-preview',
]) {
  if (!userCoreEditor.includes(token)) failures.push(`User Core full editor missing ${token}`);
}

if (!userCorePage.includes('V7UserCoreEditor')) {
  failures.push('/app/cores/me page does not render V7UserCoreEditor');
}

for (const token of ['@router.get("/me")', '@router.patch("/me")', '@router.post("")', '@router.post("/{core_id}/fork")', '@router.post("/{core_id}/grants")', "INSERT INTO core_audit", "_ensure_user_core"]) {
  if (!backend.includes(token)) failures.push(`backend cores router missing ${token}`);
}

for (const token of ["method: 'GET', pattern: /^cores\\/me$/", "method: 'PATCH', pattern: /^cores\\/me$/", "method: 'POST', pattern: /^cores$/", "method: 'POST', pattern: /^cores\\/[^/]+\\/(fork|grants)$/", 'export const PATCH']) {
  if (!proxy.includes(token)) failures.push(`Next backend proxy missing ${token}`);
}

if (!packageJson.scripts?.['audit:v7-inline-cores']) failures.push('package.json missing audit:v7-inline-cores');
if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-inline-cores')) {
  failures.push('audit:gate missing audit:v7-inline-cores');
}

if (failures.length > 0) {
  console.error('[audit:v7-inline-cores] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-inline-cores] ok');
