import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const askSurface = read('src/components/v7/v7-ask-surface.tsx');
const routerPanel = read('src/components/v7/v7-ask-skill-router-panel.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };

for (const token of [
  'V7AskSkillRouterPanel',
  'selectSuggestedSkills',
  "'research-sources'",
  "'actors-stakeholders'",
  "'briefing-studio'",
]) {
  if (!askSurface.includes(token)) failures.push(`V7AskSurface missing ${token}`);
}

for (const token of [
  'data-testid="v7-ask-skill-router-panel"',
  'data-testid="v7-skill-contract"',
  'Skill routing',
  'Suggested skills for this question',
  'Input / output contract',
  'Input PRAXIS will stage',
  'Output to expect',
  'Preserved specialist code',
  'Persisted skill-run execution is the next backend slice',
]) {
  if (!routerPanel.includes(token)) failures.push(`V7AskSkillRouterPanel missing ${token}`);
}

if (!packageJson.scripts?.['audit:v7-ask-skill-routing']) {
  failures.push('package.json missing audit:v7-ask-skill-routing');
}

if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-ask-skill-routing')) {
  failures.push('audit:gate missing audit:v7-ask-skill-routing');
}

if (failures.length > 0) {
  console.error('[audit:v7-ask-skill-routing] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-ask-skill-routing] ok');
