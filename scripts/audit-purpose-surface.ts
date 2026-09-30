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

const report = `${read('docs/PRAXIS_CODEX_PLAYBOOK.md')}\n${read('docs/audits/README.md')}`;
for (const marker of [
  '## 7. Documentation hygiene rules',
  'One canonical per topic',
  'Audit/doctor output is ephemeral',
  'LATEST-*',
  'Completed P3',
  'current audit routing index',
  'Generated gate audits should overwrite `LATEST-*` files',
]) {
  if (!report.includes(marker)) failures.push(`purpose report missing ${marker}`);
}

for (const rel of ['src/app/app/contexts/page.tsx', 'src/app/app/tools/page.tsx', 'src/app/app/write/page.tsx']) {
  if (existsSync(path.join(root, rel))) failures.push(`${rel} must be deleted; proxy redirects into the one-page PRAXIS app`);
}

const memoDesk = read('src/components/memo/memo-desk.tsx');
for (const marker of ['Redaction aware', 'Manifest embedded', 'DOCX/PDF/Markdown']) {
  if (memoDesk.includes(marker)) failures.push(`Memo Studio still exposes decorative badge ${marker}`);
}
for (const marker of ['data-testid="memo-desk"', 'Write for Memo Studio as an editable document',
  "fetch('/api/memos'", "status: 'draft'", 'capsuleId: activeCapsule?.capsuleId ?? null',
  'capsuleVersion: activeCapsule?.version ?? null', "originalPassageStatus: 'unavailable'", 'claimSupportVerified: false']) {
  if (!memoDesk.includes(marker)) failures.push(`Memo Studio missing canonical writing marker ${marker}`);
}

if (existsSync(path.join(root, 'src/components/app/debug-panel.tsx'))) {
  failures.push('Retired debug panel still exists');
}

if (existsSync(path.join(root, 'src/components/user-case'))) {
  failures.push('retired the selected situation component directory still exists');
}

const briefBlocksPath = 'src/components/briefing/brief-blocks-panel.tsx';
if (existsSync(path.join(root, briefBlocksPath))) {
  const briefBlocks = read(briefBlocksPath);
  for (const marker of ["useState('UNSC informal consultations')", "audience: 'UNSC informal consultations'", 'Audience (e.g., UNSC, Cabinet)']) {
    if (briefBlocks.includes(marker)) failures.push(`Briefing builder still exposes institutional placeholder: ${marker}`);
  }
}

const workbench = read('src/components/praxis/tasklet-praxis-workbench.tsx');
for (const marker of ['data-testid="praxis-main-composer"', 'data-testid="capsule-context-bar"', "'/api/documents/upload'", "action: 'combine'"]) {
  if (!workbench.includes(marker)) failures.push(`one-page cockpit missing purpose marker ${marker}`);
}

if (failures.length) {
  console.error('[audit:purpose-surface] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:purpose-surface] ok (static-marker)');
