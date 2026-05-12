import { MARKETPLACE_TOOLS } from '../src/lib/tools/marketplace/registry';
import { MARKETPLACE_STAGE_TARGETS } from '../src/lib/tools/marketplace/stage-targets';
import { getToolById } from '../src/lib/constants/tool-registry';

const ALLOWED_HERO_TARGETS = new Set([
  'dashboard',
  'situation-intelligence',
  'conflict-graph',
  'briefing',
  'scenarios',
  'negotiation-prep',
  'source-scout',
  'brainstorming-table',
  'treaty-analyzer',
  'policy-memo',
]);
const FORBIDDEN_TARGETS = new Set(['context-builder', 'graphops']);

const findings: string[] = [];
const nonSatTools = MARKETPLACE_TOOLS.filter((tool) => !tool.satCategory);

for (const tool of nonSatTools) {
  const target = MARKETPLACE_STAGE_TARGETS[tool.id];
  if (!target) {
    findings.push(`${tool.id}: missing MARKETPLACE_STAGE_TARGETS entry`);
    continue;
  }
  if (!ALLOWED_HERO_TARGETS.has(target.heroToolId)) {
    findings.push(`${tool.id}: target ${target.heroToolId} is not an approved hero staging target`);
  }
  if (FORBIDDEN_TARGETS.has(target.heroToolId)) {
    findings.push(`${tool.id}: target ${target.heroToolId} is deterministic-structural and cannot receive marketplace recipes`);
  }
  const heroTool = getToolById(target.heroToolId);
  if (!heroTool || heroTool.surface !== 'hero' || !heroTool.visible) {
    findings.push(`${tool.id}: target ${target.heroToolId} is not a visible hero tool`);
  }
  if (!target.promptTemplate.includes('{{caseName}}')) {
    findings.push(`${tool.id}: promptTemplate must include {{caseName}}`);
  }
  if (!target.rationale.trim()) {
    findings.push(`${tool.id}: rationale is empty`);
  }
}

for (const recipeId of Object.keys(MARKETPLACE_STAGE_TARGETS)) {
  const tool = MARKETPLACE_TOOLS.find((candidate) => candidate.id === recipeId);
  if (!tool) {
    findings.push(`${recipeId}: stage target has no marketplace registry entry`);
  } else if (tool.satCategory) {
    findings.push(`${recipeId}: SAT recipe must keep its existing route, not a stage target`);
  }
}

if (findings.length > 0) {
  console.error('[audit:stage-target-coverage] failed');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`[audit:stage-target-coverage] ok (${nonSatTools.length} non-SAT recipes staged) (static-marker)`);
