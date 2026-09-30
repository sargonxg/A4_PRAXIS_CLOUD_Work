import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CapsuleMethodInspection } from '../src/components/capsules/CapsuleMethodInspection';

const root = process.cwd();
const failures: string[] = [];

const REQUIRED_FILES = [
  'src/app/api/ai/ask-praxis/route.ts',
  'src/app/api/memos/from-ask/route.ts',
  'src/app/api/context/trust-posture/route.ts',
  'src/app/api/cores/library/route.ts',
  'src/app/api/context/capsules/[capsuleId]/swap/route.ts',
  'src/app/api/context/capsules/[capsuleId]/notes/route.ts',
  'src/app/api/context/capsules/[capsuleId]/evaluations/route.ts',
  'src/app/api/context/capsules/[capsuleId]/memories/route.ts',
  'src/lib/context/context-injection.ts',
  'src/lib/context/capsule-details-service.ts',
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
for (const token of ["requestedFormat === 'praxis'", "requestedFormat === 'core'", "action: z.literal('set-visibility')", "action: z.literal('favorite')", "action: z.literal('rate')"]) {
  if (!capsuleRoute.includes(token)) failures.push(`capsule route missing marketplace/.core marker: ${token}`);
}

const capsulesRoute = read('src/app/api/context/capsules/route.ts');
if (!capsulesRoute.includes("action: z.literal('import-core')") || !capsulesRoute.includes('createCapsuleFromCorePackage')) {
  failures.push('capsule collection route must import .core packages into owner-scoped capsules');
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
if (!chatRoute.includes('buildTurnCapsule') && !chatRoute.includes('buildEnrichedTurnCapsule')) {
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
for (const token of [
  'setCapsuleCoreLock',
  "collection('versions')",
  'lockedCoreKinds',
  'CapsuleTrustSemaphore',
  'setCapsuleAccessPolicy',
  'exportCapsuleCorePackage',
  'schemaVersion: 3',
  'CapsuleReviewCard',
  "collection('reviewCards')",
  'applyMetadata',
  'resolveCapsuleOntologyStack',
  'activeOntologyStackId',
  'activeReadContractId',
  'readinessSummary',
]) {
  if (!capsuleService.includes(token)) failures.push(`capsule service must include ${token}`);
}
for (const token of [
  'intelligenceProfile',
  'cogneeProfile',
  "advisoryMemoryHits').doc('starter-cognee-seed-pack')",
  'buildCapsuleCogneeSeedPack',
]) {
  if (!capsuleService.includes(token)) failures.push(`capsule service must preserve starter intelligence/Cognee metadata: ${token}`);
}

const contextCapsules = read('src/lib/product/context-capsules.ts');
for (const token of [
  'CapsuleIntelligenceProfile',
  'CapsuleCogneeProfile',
  'buildCapsuleCogneeSeedPack',
  'intelligence_profile_id',
  'human_workflow_decision_moment',
  'reasoning_scaffold_steps',
  'generation_contract_review_gates',
  'cognee_profile_id',
  'cognee_seed_documents',
  'cognee_review_card_promotion_rules',
]) {
  if (!contextCapsules.includes(token)) failures.push(`starter prompt/profile contract missing ${token}`);
}

const workbench = read('src/components/praxis/tasklet-praxis-workbench.tsx');
for (const token of ['<CapsuleInspectionExperience capsule={capsule}', 'usedCapsuleIntelligenceProfile', 'usedCogneeAdvisoryMemory']) {
  if (!workbench.includes(token)) failures.push(`capsule inspection/Ask receipt wiring missing ${token}`);
}
if (workbench.includes('/app/ontology')) failures.push('capsule intelligence work must not add /app/ontology as a top-level surface');

// The inspector now composes shared views. Verify data and permission wiring,
// rather than requiring obsolete marketing headings in the large workbench.
for (const [path, tokens] of [
  ['src/components/capsules/CapsuleInspectionExperience.tsx', [
    '<CapsuleMethodInspection snapshot={currentCapsule.starterSnapshot}',
    '<CapsuleReviewQueueSection reviewQueue={model.reviewQueue}',
    'capsuleId={owned && authenticated ? model.capsuleId : undefined}',
    'currentCapsule.agentOperatingContract', 'currentCapsule.memoryPosture',
    'currentCapsule.ontologyBinding', 'currentCapsule.outputContracts',
    '<CapsuleAdvancedDrawer model={model}',
  ]],
  ['src/components/capsules/workbench/CapsuleAdvancedDrawer.tsx', [
    '<CapsuleResearchSection research={model.research}',
    '<CapsuleTacitKnowledgeSection tacitKnowledge={model.tacitKnowledge}',
  ]],
  ['src/components/capsules/workbench/CapsuleTacitKnowledgeSection.tsx', [
    'state="canonical"', 'state="advisory"', 'tacitKnowledge.advisoryCount',
  ]],
  ['src/lib/ai/context-kernel.ts', [
    'usedMemoryItemIds', 'ignoredMemoryItemIds', 'advisoryOnly: true',
    "promotionRequired: 'review-card'", 'usedCapsuleIntelligenceProfile',
  ]],
] as const) {
  const source = read(path);
  for (const token of tokens) if (!source.includes(token)) failures.push(`${path} missing capsule contract wiring: ${token}`);
}

for (const token of ['buildCapsuleStarterPromptBlock(capsule.capsuleId, capsule.starterSnapshot)',
  '[llm_generation_contract]', '[advisory_memory_non_canonical]',
  'NOT canonical until a review card is applied', 'runtime returned a receipt for that mutation']) {
  if (!contextInjection.includes(token)) failures.push(`capsule generation/memory boundary missing ${token}`);
}

const savedMethod = {
  deviceProfile: {
    reasoningOperation: 'saved-owned-method-v2', inputContract: ['saved-input-contract'],
    methodSteps: ['saved-method-step'], disconfirmingChecks: ['saved-disconfirming-check'],
    sourceabilityRequirements: ['saved-source-requirement'], humanReviewGate: 'saved-human-review-gate',
  },
  inspectionSections: [{ label: 'Method graph and ontology', detail: 'saved-graph-ontology-template' }],
};
const methodHtml = renderToStaticMarkup(createElement(CapsuleMethodInspection, { snapshot: savedMethod }));
for (const content of ['saved-owned-method-v2', 'saved-input-contract', 'saved-method-step', 'saved-disconfirming-check',
  'saved-source-requirement', 'saved-human-review-gate', 'saved-graph-ontology-template', 'not evidence or a guarantee of correctness']) {
  if (!methodHtml.includes(content)) failures.push(`shared method inspection does not render its saved contract: ${content}`);
}
if (renderToStaticMarkup(createElement(CapsuleMethodInspection, { snapshot: null })) !== '') {
  failures.push('shared method inspection must not invent a method for an absent snapshot');
}

const readReceipt = read('src/lib/agent-runtime/capsule-read-receipt.ts');
for (const token of ['AgentReadContract', 'buildAgentReadContractFromReceipt', 'advisoryLabels', 'humanGates', 'stopConditions', 'outputRestrictions']) {
  if (!readReceipt.includes(token)) failures.push(`agent read contract missing ${token}`);
}

const corePackage = read('src/lib/context/core-package.ts');
for (const token of ['CORE_PACKAGE_EXTENSION', '.core', 'application/praxis-core+json', 'privateByDefault', 'cloneCreatesNewOwnerObject']) {
  if (!corePackage.includes(token)) failures.push(`core package contract missing ${token}`);
}

const capsulePlus = read('src/lib/capsule-plus/index.ts');
for (const token of ['buildPraxisCapsuleFilename', '.praxis', 'application/vnd.praxis.capsule+zip']) {
  if (!capsulePlus.includes(token) && !capsuleRoute.includes(token)) failures.push(`praxis bundle contract missing ${token}`);
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
