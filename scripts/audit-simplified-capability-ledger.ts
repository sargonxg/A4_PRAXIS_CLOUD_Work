import {
  CONSOLIDATED_TOOLS,
  SPECIALIZED_TOOL_DEVELOPMENT_GROUPS,
} from '../src/lib/constants/consolidated-tools';
import {
  CONSOLIDATED_TOOL_CONTEXT_CORES,
  CONTEXT_CORES,
  getExperienceAreaForConsolidatedTool,
  getSimplifiedCapabilityLedger,
  type ContextCoreId,
} from '../src/lib/product/context-core-map';
import { PRODUCT_EXPERIENCE_AREAS } from '../src/lib/product/experience-map';

const failures: string[] = [];

const requiredCoreIds: ContextCoreId[] = [
  'praxis-core',
  'user-core',
  'team-core',
  'situation-core',
  'source-core',
  'document-core',
  'graph-core',
  'output-core',
];

const coreIds = new Set(CONTEXT_CORES.map((core) => core.id));
const consolidatedToolIds = new Set(CONSOLIDATED_TOOLS.map((tool) => tool.id));
const experienceAreaIds = new Set(PRODUCT_EXPERIENCE_AREAS.map((area) => area.id));

for (const coreId of requiredCoreIds) {
  if (!coreIds.has(coreId)) failures.push(`missing context core: ${coreId}`);
}

for (const core of CONTEXT_CORES) {
  if (!core.summary.trim()) failures.push(`${core.id} is missing a summary`);
  if (core.backedBy.length === 0) failures.push(`${core.id} is missing backing systems`);
  if (!core.multiUserBehavior.trim()) failures.push(`${core.id} is missing multi-user behavior`);
}

if (!CONTEXT_CORES.some((core) => core.backedBy.some((entry) => /cognee/i.test(entry)))) {
  failures.push('context core registry must explicitly account for the optional Cognee memory layer');
}

for (const tool of CONSOLIDATED_TOOLS) {
  const coreIdsForTool = CONSOLIDATED_TOOL_CONTEXT_CORES[tool.id] ?? [];
  if (coreIdsForTool.length === 0) failures.push(`${tool.id} is not mapped to context cores`);

  for (const coreId of coreIdsForTool) {
    if (!coreIds.has(coreId)) failures.push(`${tool.id} maps to unknown context core: ${coreId}`);
  }

  const areaId = getExperienceAreaForConsolidatedTool(tool);
  if (!experienceAreaIds.has(areaId)) failures.push(`${tool.id} maps to unknown experience area: ${areaId}`);
}

for (const mappedToolId of Object.keys(CONSOLIDATED_TOOL_CONTEXT_CORES)) {
  if (!consolidatedToolIds.has(mappedToolId)) failures.push(`context core map references unknown consolidated tool: ${mappedToolId}`);
}

for (const area of PRODUCT_EXPERIENCE_AREAS) {
  if (!area.summary.trim()) failures.push(`${area.id} experience area is missing summary`);
  if (!area.defaultHref.trim()) failures.push(`${area.id} experience area is missing defaultHref`);
}

for (const group of SPECIALIZED_TOOL_DEVELOPMENT_GROUPS) {
  if (!consolidatedToolIds.has(group.consolidatedToolId)) {
    failures.push(`${group.id} points at unknown consolidated tool: ${group.consolidatedToolId}`);
  }
  if (group.toolIds.length === 0) failures.push(`${group.id} has no preserved specialist tool IDs`);
  if (!group.nextLiveAiUpgrade.trim()) failures.push(`${group.id} is missing nextLiveAiUpgrade`);
}

const ledger = getSimplifiedCapabilityLedger();
if (ledger.length !== CONSOLIDATED_TOOLS.length) {
  failures.push(`capability ledger has ${ledger.length} entries for ${CONSOLIDATED_TOOLS.length} consolidated tools`);
}

if (!ledger.some((entry) => entry.contextCoreIds.includes('user-core'))) {
  failures.push('capability ledger does not include user-core');
}

if (!ledger.some((entry) => entry.contextCoreIds.includes('team-core'))) {
  failures.push('capability ledger does not include team-core for multi-user workspaces');
}

if (!ledger.every((entry) => entry.preservedToolIds.length > 0)) {
  failures.push('every simplified capability must preserve at least one existing tool/functionality path');
}

if (failures.length > 0) {
  console.error('[audit:simplified-capability-ledger] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:simplified-capability-ledger] ok');
