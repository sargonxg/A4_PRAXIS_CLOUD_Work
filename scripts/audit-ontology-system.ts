import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const caseTypes = [
  {
    slug: 'active-conflict',
    module: 'active_conflict.py',
    classes: ['State', 'NonStateArmedGroup', 'Frontline', 'TerritorialClaim', 'CeasefireCommitment'],
  },
  {
    slug: 'frozen-conflict',
    module: 'frozen_conflict.py',
    classes: ['DeFactoAuthority', 'AdministrativeBoundary', 'FrozenLineOfContact', 'RecognitionClaim'],
  },
  {
    slug: 'negotiation-mediation',
    module: 'negotiation_mediation.py',
    classes: ['Party', 'Mediator', 'Position', 'Interest', 'BATNA', 'ZOPA', 'AgendaItem'],
  },
  {
    slug: 'counter-terrorism',
    module: 'counter_terrorism.py',
    classes: ['Cell', 'NetworkNode', 'ThreatClaim', 'FinancingChannel', 'OperationalCapability'],
  },
  {
    slug: 'humanitarian-crisis',
    module: 'humanitarian_crisis.py',
    classes: ['AffectedPopulation', 'AccessCorridor', 'ProtectionRisk', 'NeedsAssessment', 'DeliveryConstraint'],
  },
  {
    slug: 'political-transition',
    module: 'political_transition.py',
    classes: ['TransitionalAuthority', 'ElectoralActor', 'LegitimacyClaim', 'ConstitutionalMilestone'],
  },
  {
    slug: 'sanctions-economic-statecraft',
    module: 'sanctions_economic_statecraft.py',
    classes: ['SanctionedActor', 'SanctionsMeasure', 'EvasionRoute', 'EconomicPressureClaim'],
  },
  {
    slug: 'strategic-competition',
    module: 'strategic_competition.py',
    classes: ['StrategicActor', 'InfluenceAsset', 'RedLine', 'DeterrenceClaim', 'AllianceCommitment'],
  },
  {
    slug: 'cyber-hybrid',
    module: 'cyber_hybrid.py',
    classes: ['ThreatActor', 'MalwareCampaign', 'InfrastructureNode', 'AttributionClaim', 'HybridOperation'],
  },
  {
    slug: 'forced-displacement',
    module: 'forced_displacement.py',
    classes: ['DisplacedGroup', 'HostCommunity', 'ReturnConstraint', 'ProtectionClaim', 'Route'],
  },
];

function read(rel: string): string {
  const full = path.join(root, rel);
  if (!existsSync(full)) {
    failures.push(`${rel} missing`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

const baseOwl = read('backend/data/ontologies/praxis_aco_base.owl');
for (const primitive of ['Actor', 'Claim', 'Interest', 'Constraint', 'Leverage', 'Commitment', 'Event', 'Narrative']) {
  if (!baseOwl.includes(`#${primitive}`)) failures.push(`base ontology missing ${primitive}`);
}
if (!baseOwl.includes('<owl:versionInfo>2026.05.07</owl:versionInfo>')) {
  failures.push('base ontology missing current version');
}

const specializationDir = path.join(root, 'backend/data/ontologies/specializations');
const modelDir = path.join(root, 'backend/services/cognee_aco_models/specializations');
for (const spec of caseTypes) {
  const owlRel = `backend/data/ontologies/specializations/${spec.slug}.owl`;
  const owl = read(owlRel);
  if (!owl.includes('<owl:imports rdf:resource="https://tacitus.me/praxis/ontology/base"')) {
    failures.push(`${owlRel} missing base import`);
  }
  if (!owl.includes(`<base:caseType>${spec.slug}</base:caseType>`)) {
    failures.push(`${owlRel} missing caseType annotation`);
  }
  for (const className of spec.classes) {
    if (!owl.includes(`#${className}`)) failures.push(`${owlRel} missing ${className}`);
  }
  const changelog = path.join(specializationDir, `${spec.slug}.CHANGELOG.md`);
  if (!existsSync(changelog)) failures.push(`${spec.slug} changelog missing`);
  const modulePath = path.join(modelDir, spec.module);
  if (!existsSync(modulePath)) failures.push(`${spec.slug} data-point module missing`);
}

const baseModel = read('backend/services/cognee_aco_models/base.py');
if (!baseModel.includes('le=0.6')) failures.push('base data points must cap synthesized confidence at 0.6');
if (!baseModel.includes('index_fields')) failures.push('base data points missing index_fields metadata');

const ontologySystem = read('backend/services/ontology_system.py');
for (const marker of ['CASE_TYPES', 'ontology_stack_for_case_types', 'ontology_resolver_descriptor', 'data_point_classes_for_case_types']) {
  if (!ontologySystem.includes(marker)) failures.push(`ontology_system.py missing ${marker}`);
}

const cogneeMemory = read('backend/services/cognee_memory.py');
for (const marker of ['ACO_ONTOLOGY_FILE = BASE_ONTOLOGY_FILE', 'def get_resolver', 'def get_data_points', 'ontologyFilePaths', 'dataPointClasses']) {
  if (!cogneeMemory.includes(marker)) failures.push(`cognee_memory.py missing ${marker}`);
}

const tabsRouter = read('backend/routers/tabs.py');
for (const marker of ['case_type: str | None = Query', 'case_type_secondary: str | None = Query', 'case_type=case_type', 'case_type_secondary=case_type_secondary']) {
  if (!tabsRouter.includes(marker)) failures.push(`tabs.py missing ${marker}`);
}

const evolutionService = read('backend/services/ontology_evolution.py');
for (const marker of ['ONTOLOGY_EVOLUTION_EVENT', 'detect_ontology_gap', 'OntologyGapProposal', 'mutates_ontology']) {
  if (!evolutionService.includes(marker)) failures.push(`ontology_evolution.py missing ${marker}`);
}

const evolutionSubgraph = read('backend/services/workspace_orchestrator/subgraphs/detect_ontology_gap.py');
for (const marker of ['target_chapter', 'surface_key', 'ONTOLOGY_EVOLUTION_SURFACE', 'confidence']) {
  if (!evolutionSubgraph.includes(marker)) failures.push(`detect_ontology_gap.py missing ${marker}`);
}

const goldenRoot = path.join(root, 'backend/tests/data/ontology_golden');
for (const slug of ['active-conflict', 'negotiation-mediation', 'counter-terrorism', 'humanitarian-crisis', 'political-transition']) {
  const caseRoot = path.join(goldenRoot, slug);
  const expected = path.join(caseRoot, 'expected.json');
  const documents = path.join(caseRoot, 'documents');
  if (!existsSync(expected)) failures.push(`${slug} ontology golden expected.json missing`);
  if (!existsSync(documents)) {
    failures.push(`${slug} ontology golden documents missing`);
    continue;
  }
  const documentCount = readdirSync(documents).filter((entry) => entry.endsWith('.txt')).length;
  if (documentCount < 5) failures.push(`${slug} ontology golden set has fewer than 5 documents`);
  if (existsSync(expected)) {
    const expectedText = readFileSync(expected, 'utf8');
    const labelCount = (expectedText.match(/"source_quote"/g) ?? []).length;
    if (labelCount < 30) failures.push(`${slug} ontology golden set has fewer than 30 labels`);
  }
}

const newOntologyText = [
  baseOwl,
  ...readdirSync(specializationDir)
    .filter((entry) => entry.endsWith('.owl'))
    .map((entry) => readFileSync(path.join(specializationDir, entry), 'utf8')),
].join('\n');
for (const banned of ['UN Political Affairs', 'Security Council']) {
  if (newOntologyText.includes(banned)) failures.push(`new ontology files include banned positioning: ${banned}`);
}

if (failures.length) {
  console.error('[audit:ontology-system] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[audit:ontology-system] ok - ${caseTypes.length} case types`);
