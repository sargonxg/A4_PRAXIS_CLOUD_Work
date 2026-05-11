import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DRAFTING_TEMPLATES, type DraftTemplateId } from '../src/lib/draft/api';

const root = process.cwd();
const failures: string[] = [];

const expectedIds: DraftTemplateId[] = [
  'un-1-pager',
  'country-card',
  'talking-points',
  'mediation-brief',
  'executive-summary',
];

for (const route of ['src/app/draft/page.tsx', 'src/app/draft/[draftId]/page.tsx']) {
  if (!existsSync(path.join(root, route))) failures.push(`${route} is missing`);
}

for (const component of [
  'src/components/draft/DraftingShell.tsx',
  'src/components/draft/ContextPanel.tsx',
  'src/components/draft/BlockEditor.tsx',
  'src/components/draft/SectionAIActions.tsx',
  'src/components/draft/InlineCitation.tsx',
]) {
  if (!existsSync(path.join(root, component))) failures.push(`${component} is missing`);
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

const shellText = [
  readFileSync(path.join(root, 'src/components/draft/DraftingShell.tsx'), 'utf8'),
  readFileSync(path.join(root, 'src/components/draft/AutoFillButton.tsx'), 'utf8'),
].join('\n');
for (const marker of ['Export controls are visible', 'Auto-fill from context']) {
  if (!shellText.includes(marker)) failures.push(`Drafting shell must include honest ${marker} copy`);
}

for (const route of ['src/app/api/draft/[draftId]/refine/route.ts', 'src/app/api/draft/[draftId]/auto-fill/route.ts']) {
  if (!existsSync(path.join(root, route))) failures.push(`${route} is missing`);
}

if (failures.length > 0) {
  console.error('audit:drafting-templates-present failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`audit:drafting-templates-present passed: ${DRAFTING_TEMPLATES.length} Phase 6 drafting templates registered.`);
