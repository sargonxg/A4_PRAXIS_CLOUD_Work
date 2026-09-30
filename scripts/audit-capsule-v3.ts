import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    failures.push(`missing ${path}`);
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

function requireIncludes(path: string, markers: string[]) {
  const source = read(path);
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${path} missing ${marker}`);
  }
}

requireIncludes('src/lib/context/capsule-v3.ts', [
  'ContextCapsuleV3',
  'CONTEXT_CAPSULE_V3_SECTION_IDS',
  'humanTacitKnowledge',
  'sourceSpine',
  'claimLedger',
  'agentOperatingContract',
  'memoryPosture',
  'CAPSULE_V3_AGENT_ROLES',
  'buildCogneeAdvisoryReviewCard',
  'buildCapsuleV3AgentReviewCards',
  'deriveCapsuleV3QualityAudit',
  'canPublishCapsuleV3',
  "'advisory-only'",
  'agentsMayMutateCanonical: false',
]);

requireIncludes('src/lib/context/capsule-service.ts', [
  'buildContextCapsuleV3',
  'claimLedger',
  'agentInstructions',
  'normalizeContextCapsuleV3',
]);

requireIncludes('src/lib/product/context-capsules.ts', [
  'CONTEXT_CAPSULE_V3_PRODUCT_SECTIONS',
  'CONTEXT_CAPSULE_V3_SHELVES',
  'CONTEXT_CAPSULE_V3_TRUST_BADGES',
  'Human-Gated',
  'Agent-Ready',
  'Cognee Advisory',
  'Rejected Inference',
]);

requireIncludes('src/lib/agent-runtime/workflow-plan.ts', [
  'capsule_governance',
  'reviewCardOnlyAgentIds',
  'reviewCardTargets',
  'canonicalMutationPolicy',
  "'review-card-only'",
  'CAPSULE_V3_AGENT_ROLES',
]);

requireIncludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  '<CapsuleInspectionExperience capsule={capsule}',
]);

requireIncludes('src/components/capsules/CapsuleInspectionExperience.tsx', [
  'currentCapsule.agentOperatingContract', 'currentCapsule.agentPermissions',
  'currentCapsule.governance', 'currentCapsule.memoryPosture',
  'currentCapsule.ontologyBinding', 'currentCapsule.outputContracts',
  'capsuleId={owned && authenticated ? model.capsuleId : undefined}',
  'reviewEnabled={owned && authenticated}',
  'onReviewed={setReviewed}',
]);

requireIncludes('src/components/capsules/workbench/CapsuleAdvancedDrawer.tsx', [
  '<CapsuleTacitKnowledgeSection tacitKnowledge={model.tacitKnowledge}',
  '<CapsuleAgentWorkflowSection agents={model.agents}',
  '<CapsuleQualitySection', '<CapsuleOutputsSection outputs={model.outputs}',
  'capsuleId={input.reviewEnabled ? model.capsuleId : undefined}',
]);

requireIncludes('src/lib/context/capsule-workbench-view-model.ts', [
  'memoryPosture.canonical', 'memoryPosture.advisory',
  'Advisory memory is not canonical until a review card is applied.',
  "reviewState: 'advisory'", 'allowedActions',
]);

requireIncludes('src/components/capsules/workbench/CapsuleReviewQueueSection.tsx', [
  'snapshot?.capsule', 'reason.trim()',
  'current.reviewCards', 'onReviewed?.',
]);

requireIncludes('src/app/(landing)/learn/page.tsx', [
  'A Wikipedia for Agentic Context',
  'reusable context objects, not prompts',
  'AI can propose improvements and draft review cards',
  'Human review decides which proposals enter the saved capsule',
  'forkable and inspectable',
  'provenance and review state',
]);

requireIncludes('docs/product/CONTEXT_CAPSULE_V3_HUMAN_GATED_CONTEXT_INFRASTRUCTURE.md', [
  'Firestore ContextCapsules remain canonical',
  'Cognee advisory memory',
  'review cards',
  'capsule-editor-agent',
  'human-review-agent',
  'Marketplace Gate',
  'audit:capsule-v3',
  'https://docs.cognee.ai/core-concepts/overview',
  'https://modelcontextprotocol.io/specification/2025-06-18/server/tools',
]);

for (const forbidden of ['/app/capsule-marketplace', '/app/ontology', '/app/community-review']) {
  const workbench = read('src/components/praxis/tasklet-praxis-workbench.tsx');
  if (workbench.includes(forbidden)) failures.push(`v3 must not add top-level surface ${forbidden}`);
}

if (failures.length) {
  console.error('audit:capsule-v3 failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:capsule-v3 OK');
