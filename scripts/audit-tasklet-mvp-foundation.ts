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

for (const rel of [
  'src/app/learn/page.tsx',
  'src/app/tacitus/page.tsx',
  'src/app/release-notes/page.tsx',
  'src/app/tour/page.tsx',
  'docs/audits/2026-05-15-tasklet-mvp-cleanup-ledger.md',
]) {
  expectFile(rel);
}

expectIncludes('src/app/(landing)/layout.tsx', ['Learn', 'TACITUS', 'Pricing', 'Release notes', 'New capsule']);
expectIncludes('src/components/landing/phase8-wow-landing.tsx', [
  'Build ContextCapsule',
  'No agent run before login',
  'PENDING_CONTEXT_CAPSULE_PROMPT_KEY',
  'ContextCapsulePreview',
]);
expectIncludes('src/components/cores/ContextBuilderRoom.tsx', [
  'Capsule composition',
  'Pick, fork, combine, then lock the context.',
  'CAPSULE_COMBINATION_RECIPES',
  'data-testid="capsule-composition-panel"',
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
