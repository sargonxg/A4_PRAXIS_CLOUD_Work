import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  BACKEND_CASE_SPECIALIZATION_IDS,
  BACKEND_CASE_SPECIALIZATION_TO_FRONTEND_ONTOLOGIES,
} from '@/lib/ontology/backend-frontend-map';
import { ONTOLOGY_PATH_TEMPLATES } from '@/lib/ontology/path-templates';
import { CASE_ONTOLOGIES, auditOntologyRegistry } from '@/lib/ontology/registry';
import {
  UNIVERSAL_CAUSAL_EDGE_TYPES,
  UNIVERSAL_CONTESTATION_NODE_TYPES,
  UNIVERSAL_EVIDENCE_EDGE_TYPES,
  UNIVERSAL_READINESS_VALIDATORS,
  UNIVERSAL_TEMPORAL_EDGE_TYPES,
} from '@/lib/ontology/universal';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const servicePath = path.join(root, 'backend/services/ontology_system.py');
const baseOwlPath = path.join(root, 'backend/data/ontologies/praxis_aco_base.owl');
const specializationsPath = path.join(root, 'backend/data/ontologies/specializations');
const backendFrontendMapDocPath = path.join(root, 'docs/architecture/ONTOLOGY_BACKEND_FRONTEND_MAP.md');

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

const universalEdgeIds = [
  ...UNIVERSAL_EVIDENCE_EDGE_TYPES,
  ...UNIVERSAL_TEMPORAL_EDGE_TYPES,
  ...UNIVERSAL_CAUSAL_EDGE_TYPES,
].map((edge) => edge.id);
const contestationNodeIds = UNIVERSAL_CONTESTATION_NODE_TYPES.map((node) => node.id);
const readinessValidatorIds = UNIVERSAL_READINESS_VALIDATORS.map((validator) => validator.id);
const registryIssues = auditOntologyRegistry().flatMap((summary) => summary.issues);

if (registryIssues.length) {
  throw new Error(`audit:ontology-system registry issues: ${registryIssues.map((issue) => issue.message).join('; ')}`);
}

for (const ontology of CASE_ONTOLOGIES) {
  const edgeIds = new Set(ontology.edgeTypes.map((edge) => edge.id));
  const nodeIds = new Set(ontology.nodeTypes.map((node) => node.id));
  const validatorIds = new Set(ontology.validators.map((validator) => validator.id));
  const missingEdges = universalEdgeIds.filter((id) => !edgeIds.has(id));
  const missingNodes = contestationNodeIds.filter((id) => !nodeIds.has(id));
  const missingValidators = readinessValidatorIds.filter((id) => !validatorIds.has(id));
  if (missingEdges.length || missingNodes.length || missingValidators.length) {
    throw new Error(
      `audit:ontology-system ${ontology.id} missing enrichment: edges=${missingEdges.join(',') || 'none'} nodes=${missingNodes.join(',') || 'none'} validators=${missingValidators.join(',') || 'none'}`,
    );
  }
}

if (UNIVERSAL_CAUSAL_EDGE_TYPES.some((edge) => !edge.requiresEvidenceRefs || edge.confidenceCap === undefined || edge.confidenceCap > 0.75)) {
  throw new Error('audit:ontology-system causal edges must require evidenceRefs and cap confidence at <= 0.75');
}

if (args.has('--mapping')) {
  if (!existsSync(backendFrontendMapDocPath)) {
    throw new Error('audit:ontology-mapping missing docs/architecture/ONTOLOGY_BACKEND_FRONTEND_MAP.md');
  }
  const doc = readFileSync(backendFrontendMapDocPath, 'utf8');
  const mapKeys = Object.keys(BACKEND_CASE_SPECIALIZATION_TO_FRONTEND_ONTOLOGIES);
  const missingMapKeys = BACKEND_CASE_SPECIALIZATION_IDS.filter((id) => !mapKeys.includes(id));
  const missingDocKeys = BACKEND_CASE_SPECIALIZATION_IDS.filter((id) => !doc.includes(id));
  if (BACKEND_CASE_SPECIALIZATION_IDS.length !== 10 || mapKeys.length !== 10 || missingMapKeys.length) {
    throw new Error(`audit:ontology-mapping expected ten backend specialization mappings, missing: ${missingMapKeys.join(', ') || 'none'}`);
  }
  if (missingDocKeys.length) {
    throw new Error(`audit:ontology-mapping doc missing backend ids: ${missingDocKeys.join(', ')}`);
  }
  if (ONTOLOGY_PATH_TEMPLATES.length < 6) {
    throw new Error('audit:ontology-mapping expected conflict/security, mediation, economic, and narrative path templates');
  }
  console.log('audit:ontology-mapping OK');
} else {
  console.log('audit:ontology-system OK');
}
