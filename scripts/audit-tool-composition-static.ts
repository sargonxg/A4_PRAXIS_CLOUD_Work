import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

const failures: string[] = [];
const toolIds = new Set(MARKETPLACE_TOOLS.map((tool) => tool.id));

if (MARKETPLACE_TOOLS.length !== 52) {
  failures.push(`expected 52 marketplace tools, found ${MARKETPLACE_TOOLS.length}`);
}

for (const tool of MARKETPLACE_TOOLS) {
  for (const target of tool.composition.canChainInto) {
    if (!toolIds.has(target)) failures.push(`${tool.id} canChainInto references missing tool ${target}`);
  }
  for (const source of tool.composition.canChainFrom) {
    if (!toolIds.has(source)) failures.push(`${tool.id} canChainFrom references missing tool ${source}`);
  }
}

for (const ontology of CASE_ONTOLOGIES) {
  const missingRecommended = ontology.recommendedToolIds.filter((id) => !toolIds.has(id));
  if (missingRecommended.length > 0) {
    failures.push(`${ontology.id} recommended tools are not registered: ${missingRecommended.join(', ')}`);
  }
}

for (const ontologyId of ['human-rights', 'economic', 'humanitarian', 'legal', 'security']) {
  const count = MARKETPLACE_TOOLS.filter((tool) => tool.category === ontologyId).length;
  if (count !== 4) failures.push(`${ontologyId} should have exactly 4 Pack 21 specialist tools, found ${count}`);
}

if (failures.length > 0) {
  console.error('Tool composition static audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tool composition static audit passed for 52 tools and ontology-recommended chains.');
