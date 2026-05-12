import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'foreign-policy-research',
  'domestic-policy-analysis',
  'corporate-strategic-analysis',
];
const primitives = ['Actor', 'Claim', 'Interest', 'Constraint', 'Leverage', 'Commitment', 'Event', 'Narrative'];
const failures: string[] = [];

for (const id of required) {
  const yamlPath = `backend/data/ontologies/work/${id}.yaml`;
  const path = join(root, yamlPath);
  if (!existsSync(path)) {
    failures.push(`missing ${yamlPath}`);
    continue;
  }
  const text = readFileSync(path, 'utf8');
  for (const primitive of primitives) {
    const match = text.match(new RegExp(`^\\s{2}${primitive}:\\s*\\[(.*?)\\]`, 'm'));
    if (!match) {
      failures.push(`${yamlPath} missing ${primitive}`);
      continue;
    }
    const subtypeCount = match[1].split(',').map((value) => value.trim()).filter(Boolean).length;
    if (subtypeCount < 4) failures.push(`${yamlPath} has fewer than four ${primitive} subtypes`);
  }
  const moduleName = id.replace(/-/g, '_');
  for (const suffix of ['.py', '.prompts.py']) {
    const pyPath = `backend/data/ontologies/work/${moduleName}${suffix}`;
    if (!existsSync(join(root, pyPath))) failures.push(`missing ${pyPath}`);
  }
}

const runtime = read('backend/services/ontology_system.py');
for (const id of required) {
  if (!runtime.includes(id)) failures.push(`ontology_system.py does not expose ${id}`);
}
if (!read('src/lib/ontology/work-ontologies.ts').includes('WORK_ONTOLOGIES')) {
  failures.push('src/lib/ontology/work-ontologies.ts missing WORK_ONTOLOGIES export');
}

if (failures.length > 0) {
  console.error('audit:work-ontology-coverage failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:work-ontology-coverage passed for three MVP work ontologies. (static-marker)');

function read(file: string): string {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}
