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
const appShell = read('src/components/app/app-shell.tsx');

for (const forbidden of [
  'components/user-case',
  '@/components/user-case',
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
  'data-testid="praxis-main-composer"',
  'data-testid="capsule-manager"',
  'data-testid="tasklet-capsule-cards"',
  'What can PRAXIS do for you?',
  'Describe a task or responsibility',
  'AccountProfileButton',
  "fetch('/api/ai/ask-praxis'",
  'data-testid="capsule-context-bar"',
  'data-testid="praxis-chat-thread"',
  'ContextCapsule Lite',
  'Search capsules',
]) {
  if (!workbench.includes(required)) failures.push(`shared cockpit missing marker: ${required}`);
}

for (const required of [
  'data-testid="praxis-one-page-app-shell"',
  "pathname === '/app'",
]) {
  if (!appShell.includes(required)) failures.push(`app shell missing one-page cockpit marker: ${required}`);
}

for (const forbidden of [
  'data-testid="public-contextcapsule-explainer"',
  "surfaceMode === 'authenticated' && agentDrawerOpen",
  'Public preview',
  'Use your own sources',
  'Policy sources, documents, grounded search',
  'Recommended agent',
  'Canonical user types',
  'Suggested tools',
  'Produce',
]) {
  if (workbench.includes(forbidden)) failures.push(`shared cockpit keeps signed-out-only marker: ${forbidden}`);
}

if (failures.length) {
  console.error('audit:public-surface failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('audit:public-surface OK');
