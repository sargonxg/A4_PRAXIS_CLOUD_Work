import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];
const ts = readFileSync(join(process.cwd(), 'src/types/context.ts'), 'utf8');
const py = readFileSync(join(process.cwd(), 'backend/services/context_layers.py'), 'utf8');

const sharedContracts = [
  'UserContext',
  'WorkspaceContext',
  'WorkspaceGuideline',
  'CaseContext',
  'ConversationContext',
  'ContextAdvisory',
  'ContextSnapshot',
  'ContextSpec',
  'PreparedContext',
];

for (const symbol of sharedContracts) {
  if (!ts.includes(`interface ${symbol}`)) failures.push(`TypeScript context contract missing ${symbol}`);
  if (!py.includes(`class ${symbol}`)) failures.push(`Python context contract missing ${symbol}`);
}

for (const layer of ['user', 'workspace', 'case', 'conversation']) {
  if (!ts.includes(`'${layer}'`)) failures.push(`TypeScript context layers missing ${layer}`);
  if (!py.includes(`"${layer}"`)) failures.push(`Python context layers missing ${layer}`);
}

for (const marker of ['workspaceId', 'ownerUid', 'caseId', 'contextHealth', 'minHealthScore', 'graceful']) {
  if (!ts.includes(marker)) failures.push(`TypeScript context marker missing ${marker}`);
  if (!py.includes(marker)) failures.push(`Python context marker missing ${marker}`);
}

if (failures.length > 0) {
  console.error('Context type parity audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Context type parity audit passed.');
