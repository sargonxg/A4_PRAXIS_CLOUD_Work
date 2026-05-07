import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = path.join(root, rel);
  if (!existsSync(full)) {
    failures.push(`${rel} missing`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

const report = read('PURPOSE_AUDIT_REPORT.md');
for (const marker of [
  '## TL;DR',
  '## Findings: Remove',
  '## Findings: Simplify',
  '## Findings: Consolidate',
  '## Cross-cutting findings',
  '## Recommended sequence',
  '## Things kept after consideration',
]) {
  if (!report.includes(marker)) failures.push(`purpose report missing ${marker}`);
}

const context = read('src/components/workbench/ContextTab.tsx');
if (context.includes('Context storage contract')) failures.push('Context implementation contract copy is still visible');
if (context.includes('full re-genesis jobs remain backend follow-up work')) failures.push('Context exposes backend follow-up copy');

const library = read('src/components/workbench/LibraryTab.tsx');
if (library.includes('Save case-frame claim')) failures.push('Library still exposes duplicate save-case-frame-claim action');
if (library.includes('Saved case-frame claim')) failures.push('Library still has duplicate saved-claim fallback copy');

const draft = read('src/components/workbench/draft/DraftTab.tsx');
for (const marker of ['Redaction aware', 'Manifest embedded', 'DOCX/PDF/Markdown']) {
  if (draft.includes(marker)) failures.push(`Draft still exposes decorative badge ${marker}`);
}

if (failures.length) {
  console.error('[audit:purpose-surface] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:purpose-surface] ok');
