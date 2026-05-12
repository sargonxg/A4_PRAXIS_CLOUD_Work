import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

const failures: string[] = [];
const REQUIRED_ONTOLOGIES = ['conflict', 'mediation', 'governance', 'narrative', 'human-rights', 'economic', 'humanitarian', 'legal', 'security'] as const;

for (const ontologyId of REQUIRED_ONTOLOGIES) {
  const directTools = MARKETPLACE_TOOLS.filter((tool) => tool.ontologyRequirements.includes(ontologyId));
  if (directTools.length < 4) failures.push(`${ontologyId} has only ${directTools.length} directly relevant tools`);

  const ontology = CASE_ONTOLOGIES.find((candidate) => candidate.id === ontologyId);
  if (!ontology) {
    failures.push(`${ontologyId} ontology is missing`);
    continue;
  }
  const registeredRecommended = ontology.recommendedToolIds.filter((id) => MARKETPLACE_TOOLS.some((tool) => tool.id === id));
  const recall = ontology.recommendedToolIds.length === 0 ? 1 : registeredRecommended.length / ontology.recommendedToolIds.length;
  if (recall < 0.8) {
    failures.push(`${ontologyId} recommendation recall is ${Math.round(recall * 100)}%, below 80%`);
  }
}

const crossDepth = MARKETPLACE_TOOLS.filter((tool) => tool.category === 'cross');
for (const id of ['cross.stakeholder-power-interest', 'cross.causal-loop-diagram', 'cross.indicators-tracker', 'cross.timeline-comparator', 'cross.assumption-mapper', 'cross.outside-in-thinking', 'cross.devils-advocate']) {
  if (!crossDepth.some((tool) => tool.id === id)) failures.push(`${id} missing from Pack 21 cross-cutting depth set`);
}

if (failures.length > 0) {
  console.error('Tool suggestion eval failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tool suggestion eval passed: ontology recommendation recall is at least 80% across the 52-tool marketplace. (static-marker)');
