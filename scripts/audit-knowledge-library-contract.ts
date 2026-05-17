import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    failures.push(`Missing required file: ${path}`);
    return '';
  }
}

function requireIncludes(path: string, markers: string[]) {
  const body = read(path);
  for (const marker of markers) {
    if (!body.includes(marker)) failures.push(`${path} missing marker: ${marker}`);
  }
}

requireIncludes('src/lib/knowledge/library-service.ts', [
  'KnowledgeRepository',
  'KnowledgeDocument',
  'KnowledgeDocumentDigest',
  'ensureDefaultKnowledgeRepository',
  'upsertKnowledgeDocument',
  'attachKnowledgeDocumentToCapsules',
  'saveKnowledgeDocumentDigest',
]);

requireIncludes('src/app/api/documents/upload/route.ts', [
  'repositoryId',
  'capsuleIds',
  'upsertKnowledgeDocument',
  'knowledgeDocument',
]);

for (const route of [
  'src/app/api/knowledge/repositories/route.ts',
  'src/app/api/knowledge/repositories/[repositoryId]/route.ts',
  'src/app/api/knowledge/repositories/[repositoryId]/documents/route.ts',
  'src/app/api/knowledge/repositories/[repositoryId]/attach/route.ts',
  'src/app/api/knowledge/documents/[documentId]/capsules/route.ts',
  'src/app/api/knowledge/documents/[documentId]/summarize/route.ts',
]) {
  requireIncludes(route, ['withAuth', 'user.isDemo']);
}

requireIncludes('src/app/api/knowledge/documents/[documentId]/summarize/route.ts', [
  'generateText',
  'Output.object',
  'KnowledgeDigestSchema',
  'getProModel',
]);

requireIncludes('src/lib/intelligence/corpus-search.ts', [
  'listKnowledgeDocuments',
  'knowledge-digest',
]);

requireIncludes('firestore.rules', [
  'match /knowledgeRepositories/{repositoryId}',
  'match /knowledgeDocuments/{documentId}',
  'resource.data.ownerUid == uid',
  'request.resource.data.ownerUid == uid',
]);

if (failures.length) {
  console.error('audit:knowledge-library-contract failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:knowledge-library-contract OK');
