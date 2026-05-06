import { auditOntologyRegistry } from '@/lib/ontology/registry';

const summaries = auditOntologyRegistry();
const failures = summaries.flatMap((summary) => summary.issues.map((issue) => `${summary.ontologyId}: ${issue.message}`));

if (failures.length > 0) {
  console.error('Ontology mapping audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Ontology mapping audit passed for ${summaries.length} ontologies.`);
