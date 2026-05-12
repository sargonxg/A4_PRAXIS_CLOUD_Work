import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];
const requiredFiles = [
  'src/types/context.ts',
  'src/lib/context/context-aware.ts',
  'src/lib/context/conversation-token.ts',
  'src/lib/api/with-context-aware.ts',
  'src/lib/tools/context-provider.ts',
  'backend/services/context_layers.py',
  'docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md',
];

for (const file of requiredFiles) {
  if (!existsSync(join(process.cwd(), file))) failures.push(`missing ${file}`);
}

const calibration = readFileSync(join(process.cwd(), 'src/lib/api/with-calibration.ts'), 'utf8');
if (!calibration.includes('withContextAware') || !calibration.includes('contextSnapshot')) {
  failures.push('withCalibration must use withContextAware and pass contextSnapshot');
}
if (calibration.includes('const contextGate = await withContextHealthGate') || calibration.includes('contextGate) return contextGate')) {
  failures.push('withCalibration must not return 412-style context health gates');
}

const contextTypes = readFileSync(join(process.cwd(), 'src/types/context.ts'), 'utf8');
for (const symbol of ['UserContext', 'WorkspaceContext', 'CaseContext', 'ConversationContext', 'ContextSnapshot', 'ContextSpec', 'PreparedContext']) {
  if (!contextTypes.includes(symbol)) failures.push(`context type missing ${symbol}`);
}

const contextAware = readFileSync(join(process.cwd(), 'src/lib/context/context-aware.ts'), 'utf8');
for (const marker of ['X-Praxis-Context-Health', 'X-Praxis-Conversation-Token', 'advisories', 'minHealthScore', 'graceful']) {
  if (!contextAware.includes(marker)) failures.push(`context-aware implementation missing ${marker}`);
}

const token = readFileSync(join(process.cwd(), 'src/lib/context/conversation-token.ts'), 'utf8');
for (const marker of ['createHmac', 'timingSafeEqual', 'verifyConversationContextToken']) {
  if (!token.includes(marker)) failures.push(`conversation token implementation missing ${marker}`);
}

const provider = readFileSync(join(process.cwd(), 'src/lib/tools/context-provider.ts'), 'utf8');
for (const marker of ['ContextProvider', 'prepare(', 'forTool(', 'subagent(']) {
  if (!provider.includes(marker)) failures.push(`ContextProvider missing ${marker}`);
}

if (failures.length > 0) {
  console.error('Context-aware coverage audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Context-aware coverage audit passed. (static-marker)');
