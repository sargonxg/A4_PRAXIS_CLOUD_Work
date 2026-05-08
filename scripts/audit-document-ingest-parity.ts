#!/usr/bin/env tsx
/**
 * audit:document-ingest-parity — static guard for the visible Library upload
 * contract. Upload UI must call /api/documents/upload first for extraction,
 * chunking, and retrieval indexing, then /api/backend/tabs/library/ingest with
 * the returned documentId for source_receipts and Cognee queueing.
 */

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
  const uploadIndex = source.indexOf("fetch('/api/documents/upload'");
  const ingestIndex = source.indexOf('/api/backend/tabs/library/ingest');

  if (uploadIndex === -1) failures.push(`${file}: does not call /api/documents/upload`);
  if (ingestIndex === -1) failures.push(`${file}: does not call /api/backend/tabs/library/ingest`);
  if (uploadIndex !== -1 && ingestIndex !== -1 && uploadIndex > ingestIndex) {
    failures.push(`${file}: Library ingest must happen after /api/documents/upload returns`);
  }
  if (!source.includes("append('situationId', caseId)")) {
    failures.push(`${file}: /api/documents/upload FormData must include situationId`);
  }
  if (!source.includes("append('documentId', documentId)")) {
    failures.push(`${file}: Library ingest FormData must include the returned documentId`);
  }
  if (!source.includes('Document embedded for retrieval. Source receipt saved.')) {
    failures.push(`${file}: success copy must confirm retrieval indexing and source receipt separately`);
  }
  if (!source.includes('Document embedded for retrieval. Source receipt deferred.')) {
    failures.push(`${file}: partial-failure copy must say the source receipt was deferred`);
  }
}

const uploadRoute = readFileSync(path.join(root, 'src/app/api/documents/upload/route.ts'), 'utf8');
if (!uploadRoute.includes('Canonical document ingestion endpoint')) {
  failures.push('src/app/api/documents/upload/route.ts: missing canonical ingestion header');
}
if (!uploadRoute.includes('await chunkAndSaveDocument')) {
  failures.push('src/app/api/documents/upload/route.ts: must await chunking before returning upload success');
}

const tabsRouter = readFileSync(path.join(root, 'backend/routers/tabs.py'), 'utf8');
if (!tabsRouter.includes('document_id: str | None = Form(default=None, alias="documentId")')) {
  failures.push('backend/routers/tabs.py: Library ingest must accept documentId form field');
}
if (!tabsRouter.includes('"documentId": document_id')) {
  failures.push('backend/routers/tabs.py: Library ingest metadata must retain documentId');
}

if (failures.length > 0) {
  console.error('[audit:document-ingest-parity] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:document-ingest-parity] ok');
