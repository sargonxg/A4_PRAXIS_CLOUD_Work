import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const panel = read('src/components/v7/v7-analyst-skills-panel.tsx');
const coresSurface = read('src/components/v7/v7-cores-surface.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };

for (const token of [
  'data-testid="v7-analyst-skills-panel"',
  'Analyst Skills',
  'Apply a capability through Ask PRAXIS.',
  'getSimplifiedCapabilityLedger',
  'Stage in Ask',
  'Structural - no AI',
  'Calibrated AI',
  "['structure', 'research', 'analysis', 'production']",
  "new Set(['context-builder', 'graphops'])",
]) {
  if (!panel.includes(token)) failures.push(`V7AnalystSkillsPanel missing ${token}`);
}

if (!coresSurface.includes('V7AnalystSkillsPanel')) {
  failures.push('V7CoresSurface does not render V7AnalystSkillsPanel');
}

if (!packageJson.scripts?.['audit:v7-analyst-skills-panel']) {
  failures.push('package.json missing audit:v7-analyst-skills-panel');
}

if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-analyst-skills-panel')) {
  failures.push('audit:gate missing audit:v7-analyst-skills-panel');
}

if (failures.length > 0) {
  console.error('[audit:v7-analyst-skills-panel] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-analyst-skills-panel] ok');
