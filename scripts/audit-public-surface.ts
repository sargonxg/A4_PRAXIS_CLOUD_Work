import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = join(root, rel);
  if (!existsSync(full)) {
    failures.push(`missing ${rel}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

const landing = read('src/components/landing/phase8-wow-landing.tsx');
const workbench = read('src/components/praxis/tasklet-praxis-workbench.tsx');

for (const forbidden of [
  'components/syria',
  '@/components/syria',
  'components/tour',
  '@/components/tour',
  'ContextCapsulePreview',
  'CAPSULE_COMBINATION_RECIPES',
  'Live demo bar',
  'Run cached answer',
  'Open read-only context',
]) {
  if (landing.includes(forbidden)) {
    failures.push(`public landing imports or renders legacy marker: ${forbidden}`);
  }
}

for (const required of [
  'mode="public"',
  'TaskletPraxisWorkbench',
]) {
  if (!landing.includes(required)) failures.push(`public landing missing marker: ${required}`);
}

for (const required of [
  'data-testid="recommended-agent-panel"',
  'data-testid="public-contextcapsule-explainer"',
  'data-testid="policy-agent-drawer"',
  "surfaceMode === 'authenticated' && agentDrawerOpen",
]) {
  if (!workbench.includes(required)) failures.push(`shared cockpit missing marker: ${required}`);
}

if (failures.length) {
  console.error('audit:public-surface failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('audit:public-surface OK');
