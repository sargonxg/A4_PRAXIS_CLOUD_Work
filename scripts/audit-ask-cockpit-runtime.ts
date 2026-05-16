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
  'const initial = PRAXIS_STARTER_TOKEN_ALLOWANCE',
]);

expectIncludes('src/lib/firebase/firestore.ts', [
  'const INITIAL_CREDITS = PRAXIS_STARTER_TOKEN_ALLOWANCE',
  "'ai_chat': PRAXIS_ASK_TOKEN_COST",
  'Welcome bonus — 1,000 PRAXIS tokens',
]);

expectIncludes('src/lib/ai/ask-runtime-catalog.ts', [
  'Gemini 3 Flash Preview',
  'Gemini 3 Pro Preview',
  'Gemini 2.5 Pro',
  'Gemini 2.5 Flash',
  'Gemini 2.5 Flash-Lite',
  'Genkit flow',
  'Agent Engine memory',
]);

expectIncludes('src/components/ask/AskStreamPanel.tsx', [
  'ASK_RUNTIME_OPTIONS',
  'PRAXIS_USAGE_COPY.askCost',
  'model: selectedRuntime.id',
  'activeContextStack',
]);

expectIncludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  'ASK_RUNTIME_OPTIONS',
  'model: selectedRuntime.id',
  'data-testid="capsule-composition-rail"',
  'data-testid="capsule-concatenation-actions"',
  'onDrop={handleDrop}',
  'data-testid="capsule-search-popup"',
  'Tool and core library',
  'Shift+Up edits the last queued message',
  'replaceCapsule',
  'onContextMenu={handlePromptContextMenu}',
  'data-testid="selected-text-actions"',
  'data-testid="canonical-user-types"',
  'data-testid="suggested-capsule-tools"',
  'activeCapsules',
  'selectedToolIds',
  'selectedUserArchetype',
]);

expectIncludes('src/lib/product/cockpit-composition.ts', [
  'POLICY_NEED_TABS',
  'COCKPIT_USER_ARCHETYPES',
  'COCKPIT_TOOL_SUGGESTIONS',
  'COCKPIT_COMBINATION_RECIPES',
  'findCapsuleTemplate',
]);

expectIncludes('src/app/api/ai/chat/route.ts', [
  'if (_user.uid && text)',
  'persistAskThreadTurn',
  'situationId: sitId',
]);

if (failures.length) {
  console.error('[audit:ask-cockpit-runtime] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:ask-cockpit-runtime] ok');
