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
  'docs/audits/2026-05-15-tasklet-mvp-cleanup-ledger.md',
]) {
  expectFile(rel);
}

expectIncludes('src/app/(landing)/layout.tsx', ['Home', 'Capsules', 'Repository', 'Pricing', 'Learn', 'Release notes', 'New capsule']);
expectExcludes('src/app/(landing)/layout.tsx', ['href="/tacitus"', 'https://tacitus.me']);
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
  'data-testid="capsule-context-bar"',
  'data-testid="capsule-context-picker"',
  'data-testid="capsule-manager"',
  'data-testid="tasklet-capsule-cards"',
  'What can PRAXIS do for you?',
  'Describe a task or responsibility',
  'AccountProfileButton',
  'conversationThreadId',
  'policyAgentRunIntent',
  'refreshCapsules',
  'capsule-detail-panel',
  'capsule-agent-lane',
  'praxis-answer-markdown',
  'capsule-detail-panel',
  'capsule-builder-dialog',
  'capsule-repository-sheet',
  'capsule-inspector-sheet',
  'agent-action-drawer',
  'message-action-row',
  'text-span-core-popover',
  '/spans',
  'showWorkbenchNavigation',
  'PRAXIS turns your ContextCapsules, documents, and policy tools into grounded analysis',
]);
expectIncludes('src/components/app/app-shell.tsx', [
  'data-testid="praxis-one-page-app-shell"',
]);
expectExcludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  'data-testid="public-contextcapsule-explainer"',
  'Public preview',
  'Use your own sources',
  'Policy sources, documents, grounded search',
  'Recommended agent',
  'Canonical user types',
  'Suggested tools',
  'COCKPIT_USER_ARCHETYPES',
  'selectedUserTypeId',
  'aria-label="User type"',
  "'/api/ai/chat'",
  'window.prompt',
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
  "label: 'Capsules'",
]);
expectExcludes('src/lib/navigation/primary-nav.ts', [
  "label: 'Ask PRAXIS'",
  "label: 'Library'",
  "label: 'Memo Studio'",
  "label: 'Canvas'",
  "label: 'Advanced'",
]);
expectIncludes('src/app/sitemap.ts', ['/learn', '/pricing', '/release-notes', '/login']);
expectExcludes('src/app/sitemap.ts', ['/tacitus', '/privacy', '/terms']);
expectIncludes('docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md', [
  'ContextCapsule',
  'Tasklet',
]);
expectIncludes('docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md', [
  'Tasklet',
  'Agent',
]);

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
