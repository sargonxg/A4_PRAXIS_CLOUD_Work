import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

const ontologyIds = new Set(CASE_ONTOLOGIES.map((ontology) => ontology.id));
const failures: string[] = [];

if (MARKETPLACE_TOOLS.length !== 16) failures.push(`expected exactly 16 marketplace tools, found ${MARKETPLACE_TOOLS.length}`);
if (new Set(MARKETPLACE_TOOLS.map((tool) => tool.id)).size !== MARKETPLACE_TOOLS.length) failures.push('tool ids must be unique');

for (const tool of MARKETPLACE_TOOLS) {
  if (tool.estimatedRuntimeMs > 30000) failures.push(`${tool.id} exceeds 30s runtime budget`);
  if (tool.inputSchema.type !== 'object' || tool.outputSchema.type !== 'object') failures.push(`${tool.id} schemas must be object schemas`);
  if (!tool.inputSchema.additionalProperties || !tool.outputSchema.additionalProperties) failures.push(`${tool.id} schemas must allow additional properties`);
  if (tool.canaryCaseIds.length === 0) failures.push(`${tool.id} needs at least one canary case`);
  for (const ontologyId of tool.ontologyRequirements) {
    if (!ontologyIds.has(ontologyId)) failures.push(`${tool.id} references unknown ontology ${ontologyId}`);
  }
}

if (failures.length > 0) {
  console.error('Tool marketplace audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tool marketplace audit passed for 16 curated tools.');
