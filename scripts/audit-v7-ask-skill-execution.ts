import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const executor = read('backend/services/ask/executor.py');
const runtimePanel = read('src/components/v7/v7-ask-runtime-panel.tsx');
const skillPanel = read('src/components/v7/v7-ask-skill-router-panel.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const architectureChain = read('scripts/audit-architecture-chain.ts');

for (const token of [
  'SUPPORTED_CORE_SKILLS',
  '"research-sources"',
  '"actors-stakeholders"',
  '"briefing-studio"',
  'build_skill_prompt',
  '_execute_supported_skill',
  '_preview_skill_result',
  '"vertex_core_skill"',
  '"core_skill_preview"',
  '"skillId": skill_id',
]) {
  if (!executor.includes(token)) failures.push(`Ask executor missing ${token}`);
}

for (const token of [
  'Core citations:',
  'result.execution?.citations',
]) {
  if (!runtimePanel.includes(token)) failures.push(`Ask runtime panel missing ${token}`);
}

if (!skillPanel.includes('runs supported skills through the v7 runtime')) {
  failures.push('Ask skill contract still claims skill execution is only a future slice');
}

if (!packageJson.scripts?.['audit:v7-ask-skill-execution']) {
  failures.push('package.json missing audit:v7-ask-skill-execution');
}

const gate = packageJson.scripts?.['audit:gate'] ?? '';
if (!gate.includes('audit:v7-ask-skill-execution')) failures.push('audit:gate missing audit:v7-ask-skill-execution');
if (!architectureChain.includes('audit:v7-ask-skill-execution')) {
  failures.push('architecture chain missing audit:v7-ask-skill-execution');
}

if (failures.length > 0) {
  console.error('[audit:v7-ask-skill-execution] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-ask-skill-execution] ok');
