import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listMemoTemplates } from '@/lib/memo/templates/registry';

const failures: string[] = [];
if (listMemoTemplates().length !== 6) failures.push('Memo Studio must expose six launch templates');
if (!existsSync(join(process.cwd(), 'src/components/memo/MemoStudio.tsx'))) failures.push('missing MemoStudio component');
if (!existsSync(join(process.cwd(), 'src/lib/memo/export.ts'))) failures.push('missing memo export helpers');

const tabs = readFileSync(join(process.cwd(), 'src/lib/workbench/tabs.ts'), 'utf8');
if (!tabs.includes("id: 'memos'")) failures.push('Workbench tabs must include memos');

const docs = [
  'docs/audits/2026-05-06-MEMO_INVENTORY.md',
  'docs/audits/2026-05-06-COMPREHENSIVE.md',
  'docs/roadmap/v1.1-and-beyond.md',
  'docs/launch/ANNOUNCEMENT.md',
];
for (const file of docs) {
  if (!existsSync(join(process.cwd(), file))) failures.push(`missing ${file}`);
}

const studio = readFileSync(join(process.cwd(), 'src/components/memo/MemoStudio.tsx'), 'utf8');
for (const token of ['exportMarkdown', 'exportDocx', 'exportPdf', 'Version history', 'localStorage']) {
  if (!studio.includes(token)) failures.push(`Memo Studio missing ${token}`);
}

if (failures.length > 0) {
  console.error('Memo Studio audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Memo Studio audit passed.');
