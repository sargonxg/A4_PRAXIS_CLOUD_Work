import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const router = read('backend/routers/cores.py');
const backendMain = read('backend/main.py');
const nextProxy = read('src/app/api/backend/[...path]/route.ts');
const coresSurface = read('src/components/v7/v7-cores-surface.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const architectureChain = read('scripts/audit-architecture-chain.ts');

for (const token of [
  '@router.get("")',
  '@router.get("/{core_id}")',
  'verify_firebase_token',
  'tenant_session(current_user)',
  'owner_uid = %s',
  "OR owner_uid = 'platform'",
  'INSERT INTO core_audit',
  "'read'",
]) {
  if (!router.includes(token)) failures.push(`cores router missing ${token}`);
}

for (const token of [
  'from routers import pipeline, graph, analyze, reason, memory, tabs, chapters, workspace, notifications, ask, cores',
  'app.include_router(cores.router, prefix="/api/v1/cores"',
  'app.include_router(cores.router, prefix="/v1/cores"',
]) {
  if (!backendMain.includes(token)) failures.push(`backend main missing ${token}`);
}

for (const token of [
  'pattern: /^cores$/',
  'pattern: /^cores\\/[^/]+$/',
  "path === 'cores'",
  'static Context Core cards remain visible',
]) {
  if (!nextProxy.includes(token)) failures.push(`Next proxy missing ${token}`);
}

for (const token of [
  "fetch('/api/backend/cores')",
  'Materialized cores',
  'coreApiState',
  'No materialized Core records are returned yet',
]) {
  if (!coresSurface.includes(token)) failures.push(`Cores surface missing ${token}`);
}

if (!packageJson.scripts?.['audit:v7-cores-api']) failures.push('package.json missing audit:v7-cores-api');
const gate = packageJson.scripts?.['audit:gate'] ?? '';
if (!gate.includes('audit:v7-cores-api')) failures.push('audit:gate missing audit:v7-cores-api');
if (!architectureChain.includes('audit:v7-cores-api')) failures.push('architecture chain missing audit:v7-cores-api');

if (failures.length > 0) {
  console.error('[audit:v7-cores-api] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-cores-api] ok');
