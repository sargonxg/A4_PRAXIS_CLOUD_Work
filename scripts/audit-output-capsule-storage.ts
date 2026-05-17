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

requireIncludes('src/lib/output-capsules/storage.ts', [
  'saveOutputCapsule',
  'getOutputCapsule',
  'listOutputCapsules',
  "collection('outputCapsules')",
  "collection('outputs')",
  'getCapsule(uid, contextCapsuleId',
]);

requireIncludes('src/lib/output-capsules/index.ts', [
  "export * from './storage'",
]);

requireIncludes('src/app/api/output-capsules/route.ts', [
  'withAuth',
  'saveOutputCapsule',
  'listOutputCapsules',
  'user.isDemo',
]);

requireIncludes('src/app/api/output-capsules/[outputCapsuleId]/route.ts', [
  'withAuth',
  'getOutputCapsule',
]);

requireIncludes('firestore.rules', [
  'match /outputCapsules/{outputCapsuleId}',
  'match /outputs/{outputId}',
]);

if (failures.length) {
  console.error('audit:output-capsule-storage failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:output-capsule-storage OK');
