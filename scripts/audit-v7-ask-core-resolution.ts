import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const resolver = read('backend/services/cores/resolver.py');
const askRouter = read('backend/routers/ask.py');
const pyTypes = read('backend/services/ask/types/models.py');
const tsTypes = read('src/lib/ask/types.ts');
const runtimePanel = read('src/components/v7/v7-ask-runtime-panel.tsx');
const nextProxy = read('src/app/api/backend/[...path]/route.ts');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const architectureChain = read('scripts/audit-architecture-chain.ts');

for (const token of [
  'class CoreContextSnapshot',
  'class ResolvedCore',
  'async def resolve_ask_core_context',
  'async def record_core_attachments',
  "kind = 'user'",
  "kind = 'situation'",
  "metadata->>'situation_id'",
  'core_audit',
  "'attach'",
  'context_health',
  'ontology_binding',
]) {
  if (!resolver.includes(token)) failures.push(`core resolver missing ${token}`);
}

for (const token of [
  'from services.cores.resolver import record_core_attachments, resolve_ask_core_context',
  'core_context = await resolve_ask_core_context',
  'attached_core_ids = core_context.attached_core_ids',
  'situation_core_id',
  'await record_core_attachments',
  '"coreContext": core_context.to_dict()',
  '"coreContext": core_context.to_dict()',
]) {
  if (!askRouter.includes(token)) failures.push(`Ask router missing core resolution token ${token}`);
}

for (const token of [
  'class AskResolvedCore',
  'class AskCoreContextSnapshot',
  'attachedCoreIds',
  'resolvedCores',
  'contextHealth',
]) {
  if (!pyTypes.includes(token)) failures.push(`Python Ask types missing ${token}`);
}

for (const token of [
  'askResolvedCoreSchema',
  'askCoreContextSnapshotSchema',
  'AskCoreContextSnapshot',
  'attachedCoreIds',
  'resolvedCores',
  'contextHealth',
]) {
  if (!tsTypes.includes(token)) failures.push(`TypeScript Ask types missing ${token}`);
}

for (const token of [
  'coreContext?:',
  'Context:',
  'resolvedCores',
  'contextHealth',
  'ontologyBinding',
  'advisories',
]) {
  if (!runtimePanel.includes(token)) failures.push(`Ask runtime panel missing ${token}`);
}

for (const token of ['coreContext:', 'attachedCoreIds:', 'contextHealth:', 'advisories:']) {
  if (!nextProxy.includes(token)) failures.push(`Next local fallback missing ${token}`);
}

if (!packageJson.scripts?.['audit:v7-ask-core-resolution']) {
  failures.push('package.json missing audit:v7-ask-core-resolution');
}

const gate = packageJson.scripts?.['audit:gate'] ?? '';
if (!gate.includes('audit:v7-ask-core-resolution')) failures.push('audit:gate missing audit:v7-ask-core-resolution');
if (!architectureChain.includes('audit:v7-ask-core-resolution')) {
  failures.push('architecture chain missing audit:v7-ask-core-resolution');
}

if (failures.length > 0) {
  console.error('[audit:v7-ask-core-resolution] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-ask-core-resolution] ok');
