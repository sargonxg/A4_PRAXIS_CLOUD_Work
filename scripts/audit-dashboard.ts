import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const requiredFiles = [
  'src/app/app/dashboard/page.tsx',
  'src/components/dashboard/dashboard-command-center.tsx',
  'src/app/app/dashboard/loading.tsx',
  'src/app/app/dashboard/error.tsx',
  'tests/e2e/dashboard-command-center.spec.ts',
];

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) failures.push(`missing ${file}`);
}

const dashboardPage = read('src/app/app/dashboard/page.tsx');
if (/redirect\s*\(/.test(dashboardPage)) {
  failures.push('/app/dashboard must render the real command center, not redirect');
}

mustInclude('src/app/app/page.tsx', ['redirect(\'/app/dashboard\')']);
mustInclude('src/components/dashboard/dashboard-command-center.tsx', [
  'data-testid="praxis-dashboard-command-center"',
  'data-testid="dashboard-graph-orbit"',
  'tab=${surface.tab}',
  'path: \'boardroom\'',
  'path: \'ach\'',
  'hrefTab: \'memos\'',
  '/app/settings/personas',
  'Marketplace contracts allow raw text, context dumps, and structured output persistence.',
]);
mustInclude('src/components/app/app-sidebar.tsx', [
  'href="/dashboard#ask-praxis"',
  'label="Ask PRAXIS"',
  'label="Context Core"',
  'label="User Core"',
  "pathname === '/app/dashboard'",
]);
mustInclude('src/components/dashboard/core-repository-spine.tsx', [
  'Attach the context stack, then let PRAXIS suggest the next tools.',
  'Build User Core',
  'Build Situation Core',
  'Suggested by attached cores',
  'Context Builder',
  'Source Scout',
  'Memo Drafter',
]);
mustInclude('src/app/app/dashboard/README.md', [
  'First-touch app command center',
  'context, graph, tools, memo studio, boardroom, ACH, and settings',
]);
mustInclude('tests/e2e/dashboard-command-center.spec.ts', [
  'praxis-dashboard-command-center',
  'dashboard-graph-orbit',
  '/app/dashboard',
  'syria-2026',
]);

if (failures.length > 0) {
  console.error('[audit:dashboard] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:dashboard] ok (static-marker)');

function mustInclude(file: string, expected: string[]) {
  const body = read(file);
  for (const needle of expected) {
    if (!body.includes(needle)) failures.push(`${file} missing ${needle}`);
  }
}

function read(file: string): string {
  const fullPath = path.join(root, file);
  if (!existsSync(fullPath)) return '';
  return readFileSync(fullPath, 'utf8');
}
