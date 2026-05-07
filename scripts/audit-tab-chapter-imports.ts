import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const expectedTabs = ['context', 'library', 'ontology', 'graph'];
const expectedChapters = ['desk', 'research', 'memos', 'draft', 'ach', 'tools', 'boardroom'];

function requireFile(file: string) {
  try {
    statSync(path.join(root, file));
  } catch {
    failures.push(`missing ${file}`);
  }
}

for (const tab of expectedTabs) {
  requireFile(`src/tabs/${tab}/manifest.ts`);
  requireFile(`src/tabs/${tab}/index.ts`);
}

for (const chapter of expectedChapters) {
  requireFile(`src/chapters/${chapter}/manifest.ts`);
  requireFile(`src/chapters/${chapter}/index.ts`);
}

const tabsSource = readFileSync(path.join(root, 'src/lib/workbench/tabs.ts'), 'utf8');
for (const tab of expectedTabs) {
  if (!tabsSource.includes(`id: '${tab}'`)) failures.push(`WORKBENCH_TABS missing ${tab}`);
}
if ((tabsSource.match(/id: '/g) ?? []).length !== 4) failures.push('WORKBENCH_TABS must expose exactly four substrate tabs');

const chapterFlow = readFileSync(path.join(root, 'src/lib/workbench/chapter-flow.ts'), 'utf8');
for (const chapter of expectedChapters) {
  if (!chapterFlow.includes(`id: '${chapter}'`)) failures.push(`WORKBENCH_CHAPTER_FLOW missing ${chapter}`);
}
if (!chapterFlow.includes("alwaysOn: true")) failures.push('Desk chapter must be marked alwaysOn');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(root, full);
    if (rel.includes('node_modules') || rel.includes('.next')) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

for (const file of walk(path.join(root, 'src/tabs'))) {
  const rel = path.relative(root, file);
  const source = readFileSync(file, 'utf8');
  if (source.includes('@/chapters/')) failures.push(`${rel}: tabs must not import chapters`);
}

for (const file of walk(path.join(root, 'src/chapters'))) {
  const rel = path.relative(root, file);
  const source = readFileSync(file, 'utf8');
  if (source.includes('@/tabs/')) failures.push(`${rel}: chapters must not import tabs`);
}

if (failures.length) {
  console.error('[audit:workspace-tabs-chapters] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:workspace-tabs-chapters] ok');
