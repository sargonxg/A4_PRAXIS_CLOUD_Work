import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';

const failures: string[] = [];
const seen = new Set<string>();
const semver = /^\d+\.\d+\.\d+$/;

for (const ontology of CASE_ONTOLOGIES) {
  if (!semver.test(ontology.version)) failures.push(`${ontology.id} version must be semver, got ${ontology.version}`);
  if (seen.has(ontology.id)) failures.push(`duplicate ontology id ${ontology.id}`);
  seen.add(ontology.id);
}

if (failures.length > 0) {
  console.error('Ontology version audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Ontology version audit passed for ${CASE_ONTOLOGIES.length} ontologies.`);
