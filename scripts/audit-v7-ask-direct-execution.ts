import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const executor = read('backend/services/ask/executor.py');
const askRouter = read('backend/routers/ask.py');
const config = read('backend/config.py');
const runtimePanel = read('src/components/v7/v7-ask-runtime-panel.tsx');
const nextProxy = read('src/app/api/backend/[...path]/route.ts');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const architectureChain = read('scripts/audit-architecture-chain.ts');

for (const token of [
  'class AskExecutionResult',
  'async def execute_ask_turn',
  'build_direct_answer_prompt',
  'settings.praxis_v7_ask_ai_enabled',
  'GeminiClient',
  'response_mime_type="text/plain"',
  '"vertex_core_context"',
  '"core_context_preview"',
  '"source_kind": "core"',
]) {
  if (!executor.includes(token)) failures.push(`Ask executor missing ${token}`);
}

for (const token of [
  'from services.ask.executor import execute_ask_turn',
  'execution = await execute_ask_turn',
  'execution.content',
  'execution.token_count',
  'execution.cost_usd',
  'INSERT INTO ask_message_citations',
  '"execution": execution.to_dict()',
]) {
  if (!askRouter.includes(token)) failures.push(`Ask router missing execution token ${token}`);
}

if (!config.includes('praxis_v7_ask_ai_enabled')) {
  failures.push('backend config missing praxis_v7_ask_ai_enabled flag');
}

for (const token of ['execution?:', 'Core citations:', 'Ask against your resolved cores']) {
  if (!runtimePanel.includes(token)) failures.push(`Ask runtime UI missing ${token}`);
}

for (const token of ['execution:', "runtime: 'local_fallback'", "aiExecution: 'backend_unconfigured'"]) {
  if (!nextProxy.includes(token)) failures.push(`Next local fallback missing ${token}`);
}

if (!packageJson.scripts?.['audit:v7-ask-direct-execution']) {
  failures.push('package.json missing audit:v7-ask-direct-execution');
}

const gate = packageJson.scripts?.['audit:gate'] ?? '';
if (!gate.includes('audit:v7-ask-direct-execution')) failures.push('audit:gate missing audit:v7-ask-direct-execution');
if (!architectureChain.includes('audit:v7-ask-direct-execution')) {
  failures.push('architecture chain missing audit:v7-ask-direct-execution');
}

if (failures.length > 0) {
  console.error('[audit:v7-ask-direct-execution] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-ask-direct-execution] ok');
