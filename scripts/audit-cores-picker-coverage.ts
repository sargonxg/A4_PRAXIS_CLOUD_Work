import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    failures.push(`missing ${path}`);
    return '';
  }
}

const picker = read('src/components/v7/v7-core-picker.tsx');
const home = read('src/components/v7/v7-home-surface.tsx');
const ask = read('src/components/v7/v7-ask-surface.tsx');
const packageJson = JSON.parse(read('package.json') || '{}') as { scripts?: Record<string, string> };

for (const token of [
  'export function V7CorePickerStrip',
  'data-testid="v7-attach-core-picker"',
  'data-testid="v7-attach-core-link"',
  'placeholder="Search cores"',
  'DndContext',
  'useDraggable',
  'useDroppable',
  'onDragEnd',
  'Detach',
  'Move',
  'fixed inset-x-0 bottom-0',
  'Methodology',
  'Team and rubric',
  'Situations',
  'Sources',
]) {
  if (!picker.includes(token)) failures.push(`v7 core picker missing ${token}`);
}

for (const [path, source] of [
  ['src/components/v7/v7-home-surface.tsx', home],
  ['src/components/v7/v7-ask-surface.tsx', ask],
] as const) {
  if (!source.includes('V7CorePickerStrip')) failures.push(`${path} does not render shared V7CorePickerStrip`);
  if (!source.includes("fetch('/api/backend/cores')")) failures.push(`${path} does not fetch accessible cores`);
}

if (!packageJson.scripts?.['audit:cores-picker-coverage']) failures.push('package.json missing audit:cores-picker-coverage');
if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:cores-picker-coverage')) {
  failures.push('audit:gate missing audit:cores-picker-coverage');
}

if (failures.length > 0) {
  console.error('[audit:cores-picker-coverage] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:cores-picker-coverage] ok');
