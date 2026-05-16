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

function expectFile(rel: string): void {
  if (!existsSync(join(root, rel))) failures.push(`missing ${rel}`);
}

function expectIncludes(rel: string, markers: string[]): void {
  const src = read(rel);
  for (const marker of markers) {
    if (!src.includes(marker)) failures.push(`${rel} missing marker: ${marker}`);
  }
}

function expectExcludes(rel: string, markers: string[]): void {
  const src = read(rel);
  for (const marker of markers) {
    if (src.includes(marker)) failures.push(`${rel} should not include legacy marker: ${marker}`);
  }
}

for (const rel of [
  'src/app/(landing)/learn/page.tsx',
  'src/app/tacitus/page.tsx',
  'src/app/release-notes/page.tsx',
  'src/app/docs/page.tsx',
  'src/app/tour/page.tsx',
  'src/app/waitlist/page.tsx',
  'docs/audits/2026-05-15-tasklet-mvp-cleanup-ledger.md',
]) {
  expectFile(rel);
}

expectIncludes('src/app/(landing)/layout.tsx', ['Learn', 'TACITUS', 'Pricing', 'New capsule']);
expectIncludes('src/components/landing/phase8-wow-landing.tsx', [
  'TaskletPraxisWorkbench',
  'mode="public"',
  'Middle East policy analysis',
]);
expectExcludes('src/components/landing/phase8-wow-landing.tsx', [
  'Build ContextCapsule',
  'No agent run before login',
  'ContextCapsulePreview',
  'CAPSULE_COMBINATION_RECIPES',
]);
expectIncludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  'data-testid="praxis-main-composer"',
  'data-testid="tasklet-tool-cards"',
  'data-testid="tasklet-capsule-cards"',
  'What can PRAXIS do for you?',
  'Describe a task or responsibility',
  'AccountProfileButton',
  'conversationThreadId',
  'policyAgentRunIntent',
]);
expectIncludes('src/components/app/app-shell.tsx', [
  'data-testid="dashboard-cockpit-only-shell"',
]);
expectExcludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  'data-testid="public-contextcapsule-explainer"',
  'Public preview',
  'Use your own sources',
  'Policy sources, documents, grounded search',
  'Recommended agent',
  'Canonical user types',
  'Suggested tools',
]);
expectExcludes('src/components/landing/phase8-wow-landing.tsx', [
  'the selected situation',
  'Demo',
  'Tour',
  'PolicyAgentCard',
]);
expectIncludes('src/components/cores/ContextBuilderRoom.tsx', [
  'Context Capsule management',
  'Context health',
  'Portable .core',
  'Sharing posture',
]);
expectExcludes('src/components/cores/ContextBuilderRoom.tsx', [
  'data-testid="capsule-composition-panel"',
  'CAPSULE_COMBINATION_RECIPES',
]);
expectIncludes('src/lib/navigation/primary-nav.ts', [
  "label: 'Home'",
  "label: 'Ask PRAXIS'",
  "label: 'Library'",
  "label: 'Memo Studio'",
  "label: 'Canvas'",
  "label: 'Advanced'",
]);
expectIncludes('src/app/sitemap.ts', ['/learn', '/tacitus', '/release-notes']);
expectIncludes('src/app/tour/page.tsx', ["redirect('/')", 'noindex, nofollow']);
expectIncludes('src/app/docs/page.tsx', ["redirect('/learn')", 'index: false']);
expectIncludes('src/app/waitlist/page.tsx', ["redirect('/login?mode=signup')", 'index: false']);
expectIncludes('docs/build/PRAXIS_v5_EXECUTION_LEDGER.md', ['Archived v5 Execution Ledger', 'docs/_archive/build/v5/PRAXIS_v5_EXECUTION_LEDGER.md']);
expectIncludes('docs/build/PRAXIS_GENKIT_SPRINT_CODEX_BRIEF_2026-05-14.md', ['Archived Genkit Sprint Codex Brief', 'docs/_archive/build/genkit-sprint-2026-05-14']);

const cleanupLedger = read('docs/audits/2026-05-15-tasklet-mvp-cleanup-ledger.md');
for (const marker of ['## Keep', '## Fold Or Archive', '## Remove Only With Evidence', '## Next Deletion Pass']) {
  if (!cleanupLedger.includes(marker)) failures.push(`cleanup ledger missing ${marker}`);
}

if (failures.length) {
  console.error('[audit:tasklet-mvp-foundation] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:tasklet-mvp-foundation] ok');
