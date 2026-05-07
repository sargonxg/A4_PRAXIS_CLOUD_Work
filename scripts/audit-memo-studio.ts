import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listMemoTemplates } from '@/lib/memo/templates/registry';

const failures: string[] = [];
if (listMemoTemplates().length !== 6) failures.push('Memo Studio must expose six launch templates');
if (!existsSync(join(process.cwd(), 'src/components/memo/MemoStudio.tsx'))) failures.push('missing MemoStudio component');
if (!existsSync(join(process.cwd(), 'src/lib/memo/export.ts'))) failures.push('missing memo export helpers');
if (!existsSync(join(process.cwd(), 'src/lib/firebase/memo-service.ts'))) failures.push('missing Firestore memo service');
if (!existsSync(join(process.cwd(), 'src/app/api/memos/route.ts'))) failures.push('missing memo persistence API route');

const tabs = readFileSync(join(process.cwd(), 'src/lib/workbench/tabs.ts'), 'utf8');
if (tabs.includes("id: 'memos'")) failures.push('Workbench tabs must not include memos; Memo Studio is a work chapter');
const chapterFlow = readFileSync(join(process.cwd(), 'src/lib/workbench/chapter-flow.ts'), 'utf8');
if (!chapterFlow.includes("id: 'memos'")) failures.push('Workbench chapter flow must include memos');

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
for (const token of ['exportMarkdown', 'exportDocx', 'exportPdf', 'Version history', 'localStorage', '/api/memos']) {
  if (!studio.includes(token)) failures.push(`Memo Studio missing ${token}`);
}

const memoService = readFileSync(join(process.cwd(), 'src/lib/firebase/memo-service.ts'), 'utf8');
for (const token of ['loadMemoDraft', 'saveMemoDraft', 'versions', 'users']) {
  if (!memoService.includes(token)) failures.push(`memo service missing ${token}`);
}

if (failures.length > 0) {
  console.error('Memo Studio audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Memo Studio audit passed.');
