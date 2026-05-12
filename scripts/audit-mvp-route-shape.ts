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

const redirectRoutes: Record<string, string[]> = {
  'src/app/demo/page.tsx': ['redirect(', '/app/workbench/syria-2026'],
  'src/app/demo/syria-2024/page.tsx': ['redirect(', '/app/workbench/syria-2026'],
  'src/app/demo/[contextId]/page.tsx': ['redirect(', '/app/workbench/'],
  'src/app/contexts/page.tsx': ['redirect(', '/app/cores/context'],
  'src/app/contexts/[caseId]/page.tsx': ['redirect(', '/app/workbench/'],
  'src/app/methods/page.tsx': ['redirect(', '/app/tools'],
  'src/app/methods/[methodId]/page.tsx': ['redirect(', '/app/tools?method='],
  'src/app/draft/page.tsx': ['redirect(', '/app/workbench?openChapter=memos'],
  'src/app/draft/[draftId]/page.tsx': ['redirect(', 'openChapter=memos'],
  'src/app/users/page.tsx': ['redirect(', '/app/cores/user'],
  'src/app/users/[modelId]/page.tsx': ['redirect(', '/app/cores/user'],
};

for (const [rel, markers] of Object.entries(redirectRoutes)) {
  const text = read(rel);
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${rel} missing redirect marker: ${marker}`);
  }
  for (const forbidden of ['MethodsMarketplace', 'DraftingShell', 'UserModelsLibrary', 'Context workspace', 'cached answers']) {
    if (text.includes(forbidden)) failures.push(`${rel} still exposes obsolete public surface marker: ${forbidden}`);
  }
}

const landing = [
  read('src/app/(landing)/page.tsx'),
  read('src/app/(landing)/layout.tsx'),
  read('src/components/landing/phase8-wow-landing.tsx'),
].join('\n');
for (const forbidden of ['Live demo bar', 'Run cached answer', 'Open read-only context', 'Read-only public demo contexts']) {
  if (landing.includes(forbidden)) failures.push(`landing still includes obsolete public-demo copy: ${forbidden}`);
}

const sidebar = read('src/components/app/app-sidebar.tsx');
const allowedSidebarHrefs = [
  'href="/dashboard#ask-praxis"',
  'href="/situations/new"',
  'href="/cores/context"',
  'href="/cores/user"',
  'href="/contexts"',
  'href="/tools"',
  'href="/settings"',
  'href={`/workbench/${activeCaseId}?openChapter=memos`}',
];
for (const href of allowedSidebarHrefs) {
  if (!sidebar.includes(href)) failures.push(`sidebar missing MVP route: ${href}`);
}
if ((sidebar.match(/<NavItem/g) ?? []).length > 14) {
  failures.push('sidebar default navigation is too broad for the MVP route surface');
}

if (failures.length) {
  console.error('[audit:mvp-route-shape] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:mvp-route-shape] ok');
