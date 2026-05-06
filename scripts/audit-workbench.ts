import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WORKBENCH_TABS } from '../src/lib/workbench/tabs';
import { WORKBENCH_CHAPTER_FLOW } from '../src/lib/workbench/chapter-flow';
import { getCaseModule } from '../src/lib/cases/registry';

const root = process.cwd();
const requiredFiles = [
  'src/app/app/workbench/page.tsx',
  'src/app/app/workbench/[caseId]/page.tsx',
  'src/components/workbench/workbench-tabs.tsx',
  'src/components/workbench/workbench-tab-content.tsx',
  'src/lib/cases/registry.ts',
  'src/lib/cases/user-cases/loader.ts',
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Missing workbench contract file: ${file}`);
  }
}

const expectedTabs = ['chapters', 'desk', 'context', 'library', 'research', 'graph', 'boardroom', 'draft'];
const actualTabs = WORKBENCH_TABS.map((tab) => tab.id);
if (actualTabs.join(',') !== expectedTabs.join(',')) {
  throw new Error(`Workbench tabs mismatch: ${actualTabs.join(',')}`);
}

const expectedChapters = ['situation-frame', 'source-receipts', 'conflict-graph', 'dialectica-reasoning', 'decision-product'];
const actualChapters = WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id);
if (actualChapters.join(',') !== expectedChapters.join(',')) {
  throw new Error(`Workbench chapters mismatch: ${actualChapters.join(',')}`);
}

for (const id of ['syria-2026', 'nordalia-2026']) {
  if (!getCaseModule(id)) throw new Error(`Example case did not resolve: ${id}`);
}

for (const path of ['src/components/workbench/chapter-shell.tsx', 'src/components/workbench/chapter-renderer.tsx']) {
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (/syria|nordalia/i.test(text)) {
    throw new Error(`Generic workbench component contains case-specific copy/imports: ${path}`);
  }
}

const appPageCount = countFiles('src/app/app', 'page.tsx');
if (appPageCount > 25) {
  throw new Error(`Too many visible app route pages: ${appPageCount}; expected <= 25.`);
}

const sidebarLines = readFileSync('src/components/app/app-sidebar.tsx', 'utf8').split(/\r?\n/).length;
if (sidebarLines >= 350) {
  throw new Error(`Sidebar is still too large: ${sidebarLines} lines; expected < 350.`);
}

console.log('audit-workbench: ok');

function countFiles(dir: string, fileName: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).reduce((count, entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return count + countFiles(path, fileName);
    return count + (entry === fileName ? 1 : 0);
  }, 0);
}
