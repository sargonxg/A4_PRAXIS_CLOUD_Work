import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

function requireIncludes(path: string, markers: string[]) {
  const source = read(path);
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${path} missing ${marker}`);
  }
}

requireIncludes('src/lib/context/capsule-details-service.ts', [
  'CapsuleNote',
  'CapsuleEvaluation',
  'CapsuleMemory',
  'createCapsuleNote',
  'createCapsuleEvaluation',
  'createCapsuleMemory',
  'getCapsule(uid, capsuleId',
]);

for (const detail of ['notes', 'evaluations', 'memories']) {
  requireIncludes(`src/app/api/context/capsules/[capsuleId]/${detail}/route.ts`, [
    'withAuth',
    'user.isDemo',
    'context.params',
  ]);
}

requireIncludes('firestore.rules', [
  'match /notes/{noteId}',
  'match /evaluations/{evaluationId}',
  'match /memories/{memoryId}',
  'request.resource.data.ownerUid == uid',
  'resource.data.ownerUid == uid',
]);

if (failures.length) {
  console.error('audit:capsule-memory-contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:capsule-memory-contract OK');
