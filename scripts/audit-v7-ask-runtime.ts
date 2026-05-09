import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const backendRouter = read('backend/routers/ask.py');
const backendMain = read('backend/main.py');
const nextProxy = read('src/app/api/backend/[...path]/route.ts');
const askSurface = read('src/components/v7/v7-ask-surface.tsx');
const runtimePanel = read('src/components/v7/v7-ask-runtime-panel.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const architectureChain = read('scripts/audit-architecture-chain.ts');

for (const token of [
  '@router.post("/run")',
  '@router.get("/threads")',
  'AskRunRequest',
  'verify_firebase_token',
  'tenant_session(token["uid"])',
  'INSERT INTO ask_threads',
  'INSERT INTO ask_messages',
  'WHERE owner_uid = %s',
  'execute_ask_turn',
]) {
  if (!backendRouter.includes(token)) failures.push(`backend ask router missing ${token}`);
}

for (const token of [
  'from routers import pipeline, graph, analyze, reason, memory, tabs, chapters, workspace, notifications, ask',
  'app.include_router(ask.router, prefix="/api/v1/ask"',
  'app.include_router(ask.router, prefix="/v1/ask"',
]) {
  if (!backendMain.includes(token)) failures.push(`backend main missing ${token}`);
}

for (const token of [
  'pattern: /^ask\\/threads$/',
  'pattern: /^ask\\/run$/',
  "path === 'ask/run'",
  'backend_unconfigured',
]) {
  if (!nextProxy.includes(token)) failures.push(`Next backend proxy missing ${token}`);
}

for (const token of [
  'V7AskRuntimePanel',
  'data-testid="v7-ask-runtime-panel"',
  "fetch('/api/backend/ask/run'",
  'Ask against your resolved cores',
]) {
  if (!askSurface.includes(token) && !runtimePanel.includes(token)) {
    failures.push(`v7 ask runtime UI missing ${token}`);
  }
}

if (!packageJson.scripts?.['audit:v7-ask-runtime']) failures.push('package.json missing audit:v7-ask-runtime');
const gate = packageJson.scripts?.['audit:gate'] ?? '';
if (!gate.includes('audit:v7-ask-runtime')) failures.push('audit:gate missing audit:v7-ask-runtime');
if (!architectureChain.includes('audit:v7-ask-runtime')) failures.push('architecture chain missing audit:v7-ask-runtime');

if (failures.length > 0) {
  console.error('[audit:v7-ask-runtime] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-ask-runtime] ok');
