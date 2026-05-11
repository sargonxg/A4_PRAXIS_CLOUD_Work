import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DRAFTING_TEMPLATES, type DraftTemplateId } from '../src/lib/draft/api';

const root = process.cwd();
const failures: string[] = [];

const expectedIds: DraftTemplateId[] = [
  'un-one-pager',
  'country-card',
  'talking-points',
  'mediation-brief',
  'corporate-risk-brief',
];

for (const route of ['src/app/draft/page.tsx', 'src/app/draft/[draftId]/page.tsx']) {
  if (!existsSync(path.join(root, route))) failures.push(`${route} is missing`);
}

for (const component of [
  'src/components/draft/DraftingShell.tsx',
  'src/components/draft/ContextPanel.tsx',
  'src/components/draft/BlockEditor.tsx',
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
  if (template.phase !== 'phase-4e-shell') failures.push(`${template.id} must remain marked as a Phase 4E shell until Phase 6 generation ships`);
  if (template.sections.length < 3) failures.push(`${template.id} needs at least three sections`);
}

const shellText = readFileSync(path.join(root, 'src/components/draft/DraftingShell.tsx'), 'utf8');
for (const marker of ['Export controls are visible', 'Phase 6']) {
  if (!shellText.includes(marker)) failures.push(`Drafting shell must include honest ${marker} copy`);
}

if (failures.length > 0) {
  console.error('audit:drafting-templates-present failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`audit:drafting-templates-present passed: ${DRAFTING_TEMPLATES.length} Phase 4E drafting templates registered.`);
