import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const REQUIRED_FILES = [
  'src/app/api/ai/ask-praxis/route.ts',
  'src/app/api/memos/from-ask/route.ts',
  'src/app/api/context/trust-posture/route.ts',
  'src/app/api/cores/library/route.ts',
  'src/app/api/context/capsules/[capsuleId]/swap/route.ts',
  'src/lib/context/context-injection.ts',
  'src/lib/cores/core-library.ts',
  'src/lib/assistant/next-moves.ts',
];

for (const rel of REQUIRED_FILES) {
  if (!existsSync(join(root, rel))) failures.push(`missing ${rel}`);
}

const capsuleRoute = read('src/app/api/context/capsules/[capsuleId]/route.ts');
if (!capsuleRoute.includes("queryAction === 'fork'")) {
  failures.push('capsule route must support POST ?action=fork');
}
if (!capsuleRoute.includes("queryAction === 'share'")) {
  failures.push('capsule route must support POST ?action=share');
}
if (!capsuleRoute.includes("collection('capsule_shares')")) {
  failures.push('capsule share action must write users/{uid}/capsule_shares/{token}');
}

const sharedRoute = read('src/app/api/context/capsules/shared/[token]/route.ts');
if (!sharedRoute.includes("collectionGroup('capsule_shares')")) {
  failures.push('shared capsule route must resolve recipient tokens through capsule_shares');
}
if (!sharedRoute.includes('createCapsule(')) {
  failures.push('shared capsule route must support clone scope by creating a recipient capsule');
}

const nextMoves = read('src/lib/assistant/next-moves.ts');
if (!nextMoves.includes('domainHint: DomainId')) {
  failures.push('NextMove must carry domainHint: DomainId');
}

const contextInjection = read('src/lib/context/context-injection.ts');
if (!contextInjection.includes('resolveInjectableContext')) {
  failures.push('context injection resolver must export resolveInjectableContext');
}
if (!contextInjection.includes('<praxis-context-capsule>')) {
  failures.push('context injection resolver must render a praxis-context-capsule prompt block');
}
if (!contextInjection.includes('locked_cores')) {
  failures.push('context injection resolver must include locked core state');
}

const chatRoute = read('src/app/api/ai/chat/route.ts');
if (!chatRoute.includes('buildTurnCapsule')) {
  failures.push('Ask PRAXIS chat route must build the turn capsule before answering');
}

const coreLibrary = read('src/lib/cores/core-library.ts');
for (const token of ["kind: 'tool'", "kind: 'objective'", "kind: 'product'"]) {
  if (!coreLibrary.includes(token)) failures.push(`core library must include ${token}`);
}

const swapRoute = read('src/app/api/context/capsules/[capsuleId]/swap/route.ts');
for (const token of ['toolCoreIds', 'objectiveCoreIds', 'productCoreIds', 'memoryCoreId']) {
  if (!swapRoute.includes(token)) failures.push(`capsule swap route must persist ${token}`);
}
if (!swapRoute.includes('lockedCoreKinds')) {
  failures.push('capsule swap route must reject swaps against locked core kinds');
}

const capsuleService = read('src/lib/context/capsule-service.ts');
for (const token of ['setCapsuleCoreLock', "collection('versions')", 'lockedCoreKinds']) {
  if (!capsuleService.includes(token)) failures.push(`capsule service must include ${token}`);
}

if (failures.length > 0) {
  console.error('audit:capsule-contract failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('audit:capsule-contract OK');

function read(rel: string): string {
  const path = join(root, rel);
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}
