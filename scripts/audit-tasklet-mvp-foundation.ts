import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NAV_GROUPS, PUBLIC_NAV_ITEMS } from '../src/lib/navigation/primary-nav';
import sitemap from '../src/app/sitemap';
import { metadata as loginMetadata } from '../src/app/(auth)/login/layout';

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
  'docs/audits/README.md',
  'docs/PRAXIS_CODEX_PLAYBOOK.md',
  'docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md',
  'docs/reviews/2026-09-30-praxis-implementation-ledger.md',
]) {
  expectFile(rel);
}

expectFile('src/app/(landing)/layout.tsx');
expectIncludes('src/components/app/public-shell.tsx', ['PUBLIC_NAV_ITEMS.map', 'PUBLIC_FOOTER_LINKS', 'public-sign-in-affordance', '/login?mode=signup&redirect=%2Fapp']);
for (const href of ['/', '/pricing', '/learn', '/guide', '/release-notes']) {
  if (!PUBLIC_NAV_ITEMS.some((item) => item.href === href)) failures.push(`public navigation missing ${href}`);
}
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
  'data-testid="capsule-context-dropzone"',
  'data-testid="capsule-browser-modal"',
  "'capsule-manager'",
  'data-testid="tasklet-capsule-cards"',
  'What can PRAXIS do for you?',
  'Describe a task or responsibility',
  'conversationThreadId',
  'policyAgentId: agent.id',
  "fetch('/api/agents/runs'",
  'requireAuthForAction',
  'refreshCapsules',
  'capsule-detail-panel',
  'capsule-agent-lane',
  'praxis-answer-markdown',
  'capsule-detail-panel',
  'capsule-builder-dialog',
  'capsule-repository-sheet',
  '<CapsuleInspectionDialog',
  '<CapsuleInspectionExperience',
  'agent-action-drawer',
  'message-action-row',
  'data-testid="text-span-action-menu"',
  '/spans',
  'showWorkbenchNavigation',
  'Compose your reasoning and policy products from expert ContextCapsules.',
]);
expectIncludes('src/components/app/app-shell.tsx', [
  'data-testid="praxis-one-page-app-shell"',
  '<Header',
  'useAuth',
]);
expectIncludes('src/components/app/header.tsx', ['AccountProfileButton', 'onOpenSearch?.()']);
expectIncludes('src/components/capsules/CapsuleInspectionExperience.tsx', [
  'data-testid="capsule-inspector-sheet"',
  '<dialog',
  'showModal()',
  'onCancel=',
  'returnTarget.focus',
  "['Overview', 'Evidence', 'Timeline', 'Review']",
  '<CapsuleGraphViewer',
  '<CapsuleClaimReceiptsSection',
  '<CapsuleReviewQueueSection',
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
  "label: 'Chat'",
  "label: 'Capsules'",
  "href: '/app/capsules'",
]);
const primaryItems = NAV_GROUPS.find((group) => group.id === 'workspace')?.items ?? [];
if (primaryItems.length !== 2 || primaryItems[0]?.href !== '/app' || primaryItems[1]?.href !== '/app/capsules') {
  failures.push('Primary app destinations must be Chat and Capsules; specialist work stays secondary');
}
expectIncludes('src/app/app/repository/page.tsx', [
  "redirect('/app/capsules?lane=repository')",
]);
expectExcludes('src/lib/navigation/primary-nav.ts', [
  "label: 'Repository'",
  "href: '/app/repository'",
  "label: 'Ask PRAXIS'",
  "label: 'Library'",
  "label: 'Memo Studio'",
  "label: 'Canvas'",
  "label: 'Advanced'",
]);
const sitemapPaths = new Set(sitemap().map((entry) => new URL(entry.url).pathname));
for (const href of ['/learn', '/pricing', '/release-notes']) {
  if (!sitemapPaths.has(href)) failures.push(`public sitemap missing ${href}`);
}
for (const href of ['/tacitus', '/privacy', '/terms', '/login', '/onboarding', '/app']) {
  if (sitemapPaths.has(href)) failures.push(`public sitemap includes redirect or private/auth route ${href}`);
}
if (!loginMetadata.robots || typeof loginMetadata.robots !== 'object' || loginMetadata.robots.index !== false) {
  failures.push('Public login must remain noindex while accessible for authentication');
}
expectIncludes('docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md', [
  'ContextCapsule',
  'Tasklet',
]);
expectIncludes('docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md', [
  'Tasklet',
  'Agent',
]);

// Current governance supersedes the deleted daily cleanup ledger. Preserve its
// evidence-before-deletion contract without recreating historical planning files.
expectIncludes('docs/audits/README.md', [
  '## Retention Policy',
  'Keep dated audit snapshots',
  'delete only when',
  'references and generated scripts have been checked',
]);
expectIncludes('docs/PRAXIS_CODEX_PLAYBOOK.md', ['Documentation hygiene', 'One canonical per topic']);
expectIncludes('docs/product/README.md', ['September 30 implementation ledger', 'architecture', 'current']);

if (failures.length) {
  console.error('[audit:tasklet-mvp-foundation] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:tasklet-mvp-foundation] ok');
