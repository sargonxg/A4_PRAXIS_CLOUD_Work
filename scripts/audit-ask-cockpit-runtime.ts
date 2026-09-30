import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = join(root, rel);
  if (!existsSync(full)) {
    failures.push(`missing ${rel}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function expectIncludes(rel: string, markers: string[]): void {
  const src = read(rel);
  for (const marker of markers) {
    if (!src.includes(marker)) failures.push(`${rel} missing marker: ${marker}`);
  }
}

expectIncludes('src/lib/billing/usage-policy.ts', [
  'PRAXIS_STARTER_TOKEN_ALLOWANCE = 1000',
  'PRAXIS_ASK_TOKEN_COST = 10',
]);

expectIncludes('src/lib/api/with-credits.ts', [
  "'ai_chat': PRAXIS_ASK_TOKEN_COST",
  'reserveCreditsAdmin',
  'decideFundedUsage',
]);

expectIncludes('src/lib/firebase/firestore.ts', [
  "'ai_chat': PRAXIS_ASK_TOKEN_COST",
  'Your account profile is not ready. Please retry signing in.',
]);

expectIncludes('src/lib/firebase/user-profile-server.ts', [
  'initializeServerUserProfile',
  'PRAXIS_STARTER_TOKEN_ALLOWANCE',
  'database.runTransaction',
  'signup-${identity.uid}',
  'Welcome bonus — 1,000 PRAXIS tokens',
]);

expectIncludes('src/lib/ai/ask-runtime-catalog.ts', [
  'getAskPraxisModelRuntimePolicy',
  'getAskPraxisModelLabel',
  'frontier_primary',
  'stable_fallback',
  'Genkit flow',
  'Agent Engine memory',
]);

expectIncludes('src/lib/ai/model-runtime-policy.ts', [
  'ModelRuntimePolicy',
  'frontierPrimary',
  'stableFallback',
  'buildModelRuntimeHealthCheck',
]);

expectIncludes('src/components/ask/AskStreamPanel.tsx', [
  'PRAXIS_USAGE_COPY.askCost',
  'TACITUS chooses model tier',
  'TACITUS routing',
  'activeContextStack',
  'Reading capsule',
  'Planning workflow',
  'Reviewing claims',
  'Saving receipts',
]);

// Signed-in cockpit routes get the top-right USER menu via shared chrome
// (moved out of the workbench header to dedupe).
expectIncludes('src/components/app/signed-in-chrome.tsx', [
  'AccountProfileButton',
]);

expectIncludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  'TACITUS routes model, worker, and tools',
  'data-testid="praxis-main-composer"',
  'data-testid="praxis-chat-thread"',
  'data-testid="praxis-answer-markdown"',
  'data-testid="capsule-manager"',
  'data-testid="tasklet-capsule-cards"',
  'data-testid="capsule-detail-panel"',
  '/api/conversations/${encodeURIComponent(nextThreadId)}/turns',
  "currentToolId: 'ask-praxis'",
  'appliedCapsules: activeCapsuleStack.map',
  'Active ContextCapsule stack',
  'ContextCapsule Lite',
  'action: \'combine\'',
  'activeCapsules',
  'selectedToolIds',
  'selectedAgentId',
  'data-testid="ask-capsule-workflow-preview"',
  'PRAXIS will read',
  'PRAXIS may use',
  'ReactMarkdown',
]);

expectIncludes('src/lib/ai/ask-orchestrator.ts', [
  'capsuleReadReceipt',
  'workflowPlan',
  'buildCapsuleReadReceiptFromAsk',
  'buildAgentWorkflowPlan',
]);

expectIncludes('src/lib/product/cockpit-composition.ts', [
  'POLICY_NEED_TABS',
  'COCKPIT_USER_ARCHETYPES',
  'COCKPIT_TOOL_SUGGESTIONS',
  'COCKPIT_COMBINATION_RECIPES',
  'findCapsuleTemplate',
]);

expectIncludes('src/app/api/ai/chat/route.ts', [
  'persistSuccessfulAskOutput',
  'persistAskThreadTurn',
  'effectiveSituationId',
  'situationId: effectiveSituationId',
  'contextMode: \'praxis_lite\'',
  'routeDecision',
  'capsuleAgentExecutionContext',
]);

if (failures.length) {
  console.error('[audit:ask-cockpit-runtime] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:ask-cockpit-runtime] ok');
