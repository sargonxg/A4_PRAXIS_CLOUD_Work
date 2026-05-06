import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const architecture = readFileSync(join(root, 'docs/architecture/PRAXIS_ARCHITECTURE.md'), 'utf8');
const alignment = readFileSync(join(root, 'docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
const scripts = packageJson.scripts ?? {};

const failures: string[] = [];
const match = architecture.match(/## 19\. The audit chain[\s\S]*?```([\s\S]*?)```/);
if (!match) failures.push('architecture bible missing §19 audit-chain code block');

const auditChain = match?.[1] ?? '';
const npmScripts = Array.from(auditChain.matchAll(/npm run ([^\s#]+)/g)).map((item) => item[1]);
const uniqueScripts = Array.from(new Set(npmScripts));

const gatedBlock = alignment.match(/<!-- architecture-gated-audits:start -->([\s\S]*?)<!-- architecture-gated-audits:end -->/);
if (!gatedBlock) failures.push('alignment doc missing architecture-gated-audits block');
const gatedScripts = new Set(Array.from((gatedBlock?.[1] ?? '').matchAll(/`([^`]+)`/g)).map((item) => item[1]));

for (const script of uniqueScripts) {
  if (!scripts[script] && !gatedScripts.has(script)) {
    failures.push(`§19 script is neither implemented nor documented as gated: ${script}`);
  }
}

for (const script of gatedScripts) {
  if (!uniqueScripts.includes(script)) failures.push(`gated script is not present in §19: ${script}`);
}

for (const script of [
  'audit:architecture-chain',
  'audit:architecture-reference',
  'audit:routes',
  'audit:context-aware-coverage',
  'audit:tool-contract-v2',
  'audit:tool-context-isolation',
  'audit:firewall-coverage',
  'audit:owner-scoping',
]) {
  if (!scripts[script]) failures.push(`missing required architecture script: ${script}`);
}

const gate = scripts['audit:gate'] ?? '';
for (const script of ['audit:architecture-chain', 'audit:architecture-reference']) {
  if (!gate.includes(script)) failures.push(`audit:gate missing ${script}`);
}

if (failures.length > 0) {
  console.error('Architecture chain audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Architecture chain audit passed: ${uniqueScripts.length} §19 npm scripts accounted for.`);
