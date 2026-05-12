import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DRAFTING_TEMPLATES, type DraftTemplateId } from '../src/lib/draft/api';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = path.join(root, rel);
  if (!existsSync(full)) {
    failures.push(`${rel} is missing`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

const expectedIds: DraftTemplateId[] = [
  'un-1-pager',
  'country-card',
  'talking-points',
  'mediation-brief',
  'executive-summary',
];

for (const route of ['src/app/app/write/page.tsx', 'src/app/api/ai/writer/ask/route.ts']) {
  if (!existsSync(path.join(root, route))) failures.push(`${route} is missing`);
}

for (const component of [
  'src/components/writer/PraxisWriter.tsx',
  'src/components/writer/ui/WriterToolbar.tsx',
  'src/components/writer/ui/CitationSidebar.tsx',
  'src/components/writer/extensions/slash-menu.ts',
  'src/components/writer/hooks/use-writer-autosave.ts',
]) {
  if (!existsSync(path.join(root, component))) failures.push(`${component} is missing`);
}

for (const removed of [
  'src/app/draft/page.tsx',
  'src/app/draft/[draftId]/page.tsx',
  'src/components/draft/DraftingShell.tsx',
  'src/components/draft/BlockEditor.tsx',
  'src/components/workbench/draft/DraftTab.tsx',
  'src/components/memo/MemoStudio.tsx',
]) {
  if (existsSync(path.join(root, removed))) failures.push(`${removed} should be replaced by PraxisWriter`);
}

const ids = DRAFTING_TEMPLATES.map((template) => template.id);
for (const id of expectedIds) {
  if (!ids.includes(id)) failures.push(`MVP drafting template ${id} is not registered`);
}

if (new Set(ids).size !== ids.length) failures.push('Drafting template ids must be unique');
if (DRAFTING_TEMPLATES.length !== expectedIds.length) failures.push(`Expected ${expectedIds.length} MVP drafting templates, found ${DRAFTING_TEMPLATES.length}`);

for (const template of DRAFTING_TEMPLATES) {
  if (template.phase !== 'phase-6-generation') failures.push(`${template.id} must be marked as a Phase 6 generation template`);
  if (template.sections.length < 5) failures.push(`${template.id} needs at least five sections`);
  if (!template.header || !template.footer) failures.push(`${template.id} needs header/footer formatting`);
  if (!template.sections.some((section) => section.citationPolicy === 'required')) failures.push(`${template.id} needs a required citation section`);
}

const writerText = [
  read('src/components/writer/PraxisWriter.tsx'),
  read('src/components/writer/ui/WriterToolbar.tsx'),
  read('src/components/writer/extensions/slash-menu.ts'),
].join('\n');
for (const marker of ['/ask', '/cite', '/tighten', '/soften', '/steelman', '/gap', 'Markdown', 'DOCX', 'PDF']) {
  if (!writerText.includes(marker)) failures.push(`PraxisWriter must include ${marker}`);
}

if (failures.length > 0) {
  console.error('audit:drafting-templates-present failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`audit:drafting-templates-present passed: ${DRAFTING_TEMPLATES.length} templates and canonical PraxisWriter surface verified.`);
