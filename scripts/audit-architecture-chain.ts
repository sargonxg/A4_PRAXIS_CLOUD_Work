import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const architecture = readFileSync(join(root, 'docs/architecture/PRAXIS_ARCHITECTURE.md'), 'utf8');
const alignment = readFileSync(join(root, 'docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
const scripts = packageJson.scripts ?? {};
const failures: string[] = [];

const coreGate = [
  'audit:routes',
  'audit:architecture-chain',
  'audit:repo-shape',
  'audit:architecture-reference',
  'audit:mvp-route-shape',
  'audit:tool-contracts',
  'audit:purpose-surface',
  'audit:deep-preship',
  'audit:cognee',
  'audit:gcp',
];

if (!architecture.includes('## 19. The audit chain')) {
  failures.push('architecture bible missing §19 audit-chain section');
}
if (!alignment.includes('<!-- architecture-gated-audits:start -->')) {
  failures.push('alignment doc missing architecture-gated-audits block');
}

for (const script of coreGate) {
  if (!scripts[script]) failures.push(`missing core audit script: ${script}`);
}

const gate = scripts['audit:gate'] ?? '';
for (const script of coreGate) {
  if (!gate.includes(script)) failures.push(`audit:gate missing ${script}`);
}
for (const file of [
  'scripts/audit-ai-routes.mjs',
  'scripts/audit-architecture-chain.ts',
  'scripts/audit-repo-shape.ts',
  'scripts/audit-architecture-reference.ts',
  'scripts/audit-mvp-route-shape.ts',
  'scripts/audit-tool-contracts.ts',
  'scripts/audit-purpose-surface.ts',
  'scripts/audit-deep-preship.ts',
  'scripts/audit-cognee-isolation.ts',
  'scripts/audit-gcp.mjs',
]) {
  if (!existsSync(join(root, file))) failures.push(`missing core audit file: ${file}`);
}

if (failures.length > 0) {
  console.error('Architecture chain audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Architecture chain audit passed: ${coreGate.length} core audits are wired. Historical audits may live under scripts/_archive/audits. (static-marker)`);
