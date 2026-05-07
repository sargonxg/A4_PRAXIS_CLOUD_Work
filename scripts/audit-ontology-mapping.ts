import { auditOntologyRegistry } from '@/lib/ontology/registry';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const summaries = auditOntologyRegistry();
const failures = summaries.flatMap((summary) => summary.issues.map((issue) => `${summary.ontologyId}: ${issue.message}`));
const dynamicMirrorFiles: Record<string, string> = {
  'human-rights': 'backend/ontology/human_rights.py',
  economic: 'backend/ontology/economic.py',
  humanitarian: 'backend/ontology/humanitarian.py',
  legal: 'backend/ontology/legal.py',
  security: 'backend/ontology/security.py',
};

if (summaries.length !== 9) failures.push(`Pack 20 expects 9 ontologies, found ${summaries.length}`);

for (const [ontologyId, file] of Object.entries(dynamicMirrorFiles)) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) {
    failures.push(`${ontologyId}: missing backend mirror ${file}`);
    continue;
  }
  const text = readFileSync(path, 'utf8');
  const summary = summaries.find((item) => item.ontologyId === ontologyId);
  if (!summary) {
    failures.push(`${ontologyId}: missing TypeScript ontology definition`);
    continue;
  }
  if (!text.includes(`id="${ontologyId}"`)) failures.push(`${ontologyId}: backend mirror id mismatch`);
  for (const primitive of summary.coveredPrimitives) {
    if (!text.includes(`primitive="${primitive}"`)) failures.push(`${ontologyId}: backend mirror missing primitive ${primitive}`);
  }
}

if (failures.length > 0) {
  console.error('Ontology mapping audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Ontology mapping audit passed for ${summaries.length} ontologies.`);
