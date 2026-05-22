import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const servicePath = path.join(root, 'backend/services/ontology_system.py');
const baseOwlPath = path.join(root, 'backend/data/ontologies/praxis_aco_base.owl');
const specializationsPath = path.join(root, 'backend/data/ontologies/specializations');

for (const file of [servicePath, baseOwlPath, specializationsPath]) {
  if (!existsSync(file)) {
    throw new Error(`audit:ontology-system missing path: ${path.relative(root, file)}`);
  }
}

const source = readFileSync(servicePath, 'utf8');
const markers = ['ONTOLOGY_VERSION', 'CASE_TYPES', 'ontology_stack_for_case_types', 'ontology_cache_snapshot'];
const missingMarkers = markers.filter((marker) => !source.includes(marker));
const specializationCount = readdirSync(specializationsPath).filter((entry) => entry.endsWith('.owl')).length;
const capsuleService = readFileSync(path.join(root, 'src/lib/context/capsule-service.ts'), 'utf8');
const capsuleMarkers = ['resolveCapsuleOntologyStack', 'maxActiveCaseOntologies: 3', 'shaclStatus', 'candidateSuggestions', 'rejectedSuggestions'];
const missingCapsuleMarkers = capsuleMarkers.filter((marker) => !capsuleService.includes(marker));

if (missingMarkers.length) {
  throw new Error(`audit:ontology-system missing markers: ${missingMarkers.join(', ')}`);
}
if (specializationCount !== 10) {
  throw new Error(`audit:ontology-system expected 10 specialization OWL files, found ${specializationCount}`);
}
if (missingCapsuleMarkers.length) {
  throw new Error(`audit:ontology-system missing capsule v2 markers: ${missingCapsuleMarkers.join(', ')}`);
}

console.log('audit:ontology-system OK');
