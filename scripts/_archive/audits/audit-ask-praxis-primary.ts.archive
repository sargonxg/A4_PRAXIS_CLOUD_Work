import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTIC_WORKFLOWS } from '../src/lib/agentic-workflows/registry';

const failures: string[] = [];
const dashboard = readFileSync(join(process.cwd(), 'src', 'components', 'dashboard', 'dashboard-command-center.tsx'), 'utf8');
const askHome = readFileSync(join(process.cwd(), 'src', 'components', 'dashboard', 'ask-praxis-home.tsx'), 'utf8');
const shell = readFileSync(join(process.cwd(), 'src', 'components', 'app', 'app-shell.tsx'), 'utf8');
const chatRoute = readFileSync(join(process.cwd(), 'src', 'app', 'api', 'ai', 'chat', 'route.ts'), 'utf8');
const askContext = readFileSync(join(process.cwd(), 'src', 'lib', 'ai', 'ask-praxis-context.ts'), 'utf8');

if (!dashboard.includes('<AskPraxisHome') && !dashboard.includes('<PraxisWorkspaceShell')) failures.push('dashboard does not render an Ask PRAXIS first-screen surface');
if (!askHome.includes('data-testid="ask-praxis-home"')) failures.push('AskPraxisHome is missing a stable test marker');
if (!askHome.includes('open-praxis-chat')) failures.push('AskPraxisHome does not open the Ask PRAXIS command plane');
if (!shell.includes('<FloatingPraxis />')) failures.push('app shell does not keep Ask PRAXIS globally available');
for (const marker of [
  'buildAskPraxisAnswerPolicyBlock',
  'buildAskPraxisSituationSourcePosture',
  'formatAskPraxisCorpusBlock',
  'summarizeAskPraxisGraphSnapshot',
]) {
  if (!chatRoute.includes(marker)) failures.push(`chat route does not use ${marker}`);
}
for (const marker of ['active Situation record', 'Retrieved situation corpus items', 'Bottom line', 'Gaps', '[graph]']) {
  if (!askContext.includes(marker)) failures.push(`Ask PRAXIS context foundation missing "${marker}"`);
}

const primaryWorkflows = AGENTIC_WORKFLOWS.filter((workflow) => workflow.mobilePriority === 'primary');
for (const workflow of primaryWorkflows) {
  if (!workflow.prompt.trim()) failures.push(`${workflow.id} is missing a launch prompt`);
  if (!workflow.saveLocation.trim()) failures.push(`${workflow.id} is missing a save location`);
}

if (failures.length > 0) {
  console.error('[audit:ask-praxis-primary] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:ask-praxis-primary] ok');
