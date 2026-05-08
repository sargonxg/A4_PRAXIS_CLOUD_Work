import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'src/components/workbench/LibraryTab.tsx',
  'src/components/workbench/context/DocumentUploadInline.tsx',
];
const failures: string[] = [];

for (const file of files) {
  const source = readFileSync(path.join(root, file), 'utf8');
  if (!source.includes("fetch('/api/documents/upload'")) {
    failures.push(`${file}: upload path must first save through /api/documents/upload`);
  }
  if (!source.includes('/api/backend/tabs/library/ingest')) {
    failures.push(`${file}: upload path must still call the backend Library ingest route`);
  }
  if (!source.includes("append('situationId', caseId)")) {
    failures.push(`${file}: /api/documents/upload call must include situationId`);
  }
  if (!source.includes('extraction backend is unavailable')) {
    failures.push(`${file}: upload path must expose an honest backend-unavailable fallback`);
  }
}

if (failures.length > 0) {
  console.error('[audit:library-ingest-consolidation] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:library-ingest-consolidation] ok');
