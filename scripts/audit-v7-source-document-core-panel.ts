import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const panel = read('src/components/v7/v7-source-document-core-panel.tsx');
const coresSurface = read('src/components/v7/v7-cores-surface.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };

for (const token of [
  'data-testid="v7-source-document-core-panel"',
  'Source + Document Cores',
  'Source receipts',
  'Upload pipeline',
  'Coverage gaps',
  'Run Source Scout',
  'Add source or document',
  'Source receipt saved',
  'Text extracted',
  'Indexed for retrieval',
]) {
  if (!panel.includes(token)) failures.push(`V7SourceDocumentCorePanel missing ${token}`);
}

if (!coresSurface.includes('V7SourceDocumentCorePanel')) {
  failures.push('V7CoresSurface does not render V7SourceDocumentCorePanel');
}

if (!packageJson.scripts?.['audit:v7-source-document-core-panel']) {
  failures.push('package.json missing audit:v7-source-document-core-panel');
}

if (!(packageJson.scripts?.['audit:gate'] ?? '').includes('audit:v7-source-document-core-panel')) {
  failures.push('audit:gate missing audit:v7-source-document-core-panel');
}

if (failures.length > 0) {
  console.error('[audit:v7-source-document-core-panel] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-source-document-core-panel] ok');
