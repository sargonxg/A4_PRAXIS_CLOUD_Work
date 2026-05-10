import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const backendService = read('backend/services/ask/router.py');
const backendRouter = read('backend/routers/ask.py');
const askTypes = read('backend/services/ask/types/models.py');
const tsTypes = read('src/lib/ask/types.ts');
const runtimePanel = read('src/components/v7/v7-ask-runtime-panel.tsx');
const askSurface = read('src/components/v7/v7-ask-surface.tsx');
const nextProxy = read('src/app/api/backend/[...path]/route.ts');
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const architectureChain = read('scripts/audit-architecture-chain.ts');

for (const token of [
  'class AskRoutingDecision',
  'def route_ask(',
  'def classify_intent(',
  'INTENT_SKILLS',
  'INTENT_SKILL_CANDIDATES',
  'candidate_skill_ids',
  'def candidate_skills(',
  'MODE_SUBAGENTS',
  '"run_skill"',
  '"run_subagent_plan"',
  '"direct_answer"',
  '"clarify"',
  'cross.stakeholder-power-interest',
  'cross.contradiction-finder',
  'context-preparer',
  'memo-drafter',
  'output-refiner',
]) {
  if (!backendService.includes(token)) failures.push(`backend Ask router missing ${token}`);
}

for (const token of [
  'from services.ask.router import route_ask',
  'routing = route_ask(req.query, req.mode, req.skill_id)',
  'route_action, skill_id, subagent_id',
  'routing.action',
  'routing.skill_id',
  'routing.subagent_id',
  'routing.to_dict()',
  '"route": {**routing.to_dict(), "runtime": execution.runtime}',
]) {
  if (!backendRouter.includes(token)) failures.push(`backend /ask/run missing routing persistence token ${token}`);
}

for (const token of ['ASK_ROUTE_ACTIONS', 'AskRouteAction', 'skill_id: str | None']) {
  if (!askTypes.includes(token)) failures.push(`Python Ask types missing ${token}`);
}

for (const token of ['ASK_ROUTE_ACTIONS', 'AskRouteAction', 'skillId: z.string().min(1).optional()']) {
  if (!tsTypes.includes(token)) failures.push(`TypeScript Ask types missing ${token}`);
}

for (const token of [
  'skillId?: string',
  'skill_id: skillId',
  'Routing:',
  'Candidate skills:',
  'result.route.candidate_skill_ids',
  'result.route.skill_id',
  'result.route.subagent_id',
  'formatRouteAction',
]) {
  if (!runtimePanel.includes(token)) failures.push(`Ask runtime panel missing ${token}`);
}

if (!askSurface.includes('skillId={stagedSkill?.toolId}')) {
  failures.push('Ask surface does not pass staged Analyst Skill into runtime panel');
}

for (const token of [
  "requestBody.skill_id",
  "candidate_skill_ids",
  "action: 'run_skill'",
  "runtime: 'local_fallback'",
  'PRAXIS routed this turn',
]) {
  if (!nextProxy.includes(token)) failures.push(`Next backend local fallback missing ${token}`);
}

if (!packageJson.scripts?.['audit:v7-ask-routing-layer']) {
  failures.push('package.json missing audit:v7-ask-routing-layer');
}

const gate = packageJson.scripts?.['audit:gate'] ?? '';
if (!gate.includes('audit:v7-ask-routing-layer')) failures.push('audit:gate missing audit:v7-ask-routing-layer');
if (!architectureChain.includes('audit:v7-ask-routing-layer')) {
  failures.push('architecture chain missing audit:v7-ask-routing-layer');
}

if (failures.length > 0) {
  console.error('[audit:v7-ask-routing-layer] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-ask-routing-layer] ok');
