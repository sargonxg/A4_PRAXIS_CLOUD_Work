import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];
const root = process.cwd();
const stackRoute = readFileSync(join(root, 'src/app/api/workspace/context-stack/route.ts'), 'utf8');
const capsuleService = readFileSync(join(root, 'src/lib/context/capsule-service.ts'), 'utf8');
const capsuleRoute = readFileSync(join(root, 'src/app/api/context/capsules/[capsuleId]/route.ts'), 'utf8');
const attachRoute = readFileSync(join(root, 'src/app/api/context/capsules/[capsuleId]/attach/route.ts'), 'utf8');

if (!stackRoute.includes("stackId !== DEFAULT_CONTEXT_STACK_ID")) {
  failures.push('/api/workspace/context-stack must support named stack IDs beyond default');
}
if (!stackRoute.includes('createCapsule') || !stackRoute.includes('capsuleToStack(existing)') || !stackRoute.includes('saveActiveStackPointer')) {
  failures.push('named stacks must resolve capsule defaults and persist an owner-scoped workspace pointer');
}
// Selecting an existing capsule must not erase cores or increment its version.
// Canonical edits belong to the capsule edit/attachment and review endpoints.
if (stackRoute.includes('bumpCapsuleVersion')) {
  failures.push('workspace selection must not rewrite the saved capsule; use capsule edit/review paths');
}
if (!capsuleService.includes('archiveCapsule') || !capsuleRoute.includes('export const DELETE')) {
  failures.push('capsules must expose archive/delete semantics without physical deletion');
}
if (!capsuleService.includes('attachCapsuleRefs') || !attachRoute.includes('sourceIds') || !attachRoute.includes('documentIds')) {
  failures.push('capsules must expose source/document attach semantics');
}

if (failures.length > 0) {
  console.error('audit:named-stack-contract failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('audit:named-stack-contract OK');
