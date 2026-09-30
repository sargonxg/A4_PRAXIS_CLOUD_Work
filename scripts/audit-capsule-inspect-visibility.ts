import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  type CapsuleStarterDefinition,
} from '@/lib/product/context-capsules';

type Finding = {
  starterId: string;
  issue: string;
};

const findings: Finding[] = [];
const componentSource = readFileSync(join(process.cwd(), 'src', 'components', 'capsules', 'CapsuleLibraryCard.tsx'), 'utf8');
const librarySource = readFileSync(join(process.cwd(), 'src', 'components', 'capsules', 'CapsuleLibrary.tsx'), 'utf8');
const inspectionSource = readFileSync(join(process.cwd(), 'src', 'components', 'capsules', 'CapsuleInspectionExperience.tsx'), 'utf8');
const advancedSource = readFileSync(join(process.cwd(), 'src', 'components', 'capsules', 'workbench', 'CapsuleAdvancedDrawer.tsx'), 'utf8');
const researchSectionSource = readFileSync(join(process.cwd(), 'src', 'components', 'capsules', 'workbench', 'CapsuleResearchSection.tsx'), 'utf8');

for (const expected of [
  'data-testid="capsule-research-signals"',
  'sourceSpineCount',
  'evidenceGapCount',
  'refreshStatus',
  'graphNodeCount',
  'unsupportedClaimCount',
]) {
  if (!componentSource.includes(expected) && !librarySource.includes(expected)) {
    add('ui-contract', `library card path does not expose ${expected}`);
  }
}

for (const expected of [
  'capsule-research-dossier',
  'capsule-source-receipts',
  'capsule-claim-ledger-summary',
  'capsule-reasoning-graph-summary',
  'capsule-ontology-stack-summary',
  'capsule-evidence-gaps',
  'capsule-agent-workflow-summary',
  'capsule-review-gates-summary',
]) {
  if (!researchSectionSource.includes(expected)) add('ui-contract', `inspect research section missing ${expected}`);
}

if (!inspectionSource.includes('<CapsuleAdvancedDrawer model={model}')
  || !advancedSource.includes('<CapsuleResearchSection research={model.research} />')) {
  add('ui-contract', 'shared inspection does not expose the research model through its progressive detail view');
}

for (const starter of CAPSULE_STARTER_DEFINITIONS) {
  const model = buildCapsuleWorkbenchViewModel({ capsule: starterToCapsuleInput(starter) });
  const cardSignals = {
    sourceSpineCount: starter.researchDossier.sourceSpine.length,
    evidenceGapCount: starter.researchDossier.knownEvidenceGaps.length,
    refreshStatus: starter.sourceRefreshDocket.status,
    graphNodeCount: starter.graphLiteProjection.nodeCount,
    graphEdgeCount: starter.graphLiteProjection.edgeCount,
    unsupportedClaimCount: starter.claimLedgerSeeds.missing.length + starter.claimLedgerSeeds.stale.length,
  };

  if (model.research.sourceSpineCount !== cardSignals.sourceSpineCount) {
    add(starter.starterId, 'inspect source spine count does not match starter dossier');
  }
  if (model.research.evidenceGapCount < cardSignals.evidenceGapCount) {
    add(starter.starterId, 'inspect evidence gap count drops starter dossier gaps');
  }
  if (model.research.refresh.status !== cardSignals.refreshStatus) {
    add(starter.starterId, 'inspect refresh status does not match starter refresh docket');
  }
  if (model.research.graphProjection.nodeCount !== cardSignals.graphNodeCount) {
    add(starter.starterId, 'inspect graph node count does not match GraphLite projection');
  }
  if (model.research.graphProjection.edgeCount !== cardSignals.graphEdgeCount) {
    add(starter.starterId, 'inspect graph edge count does not match GraphLite projection');
  }
  if (model.research.unsupportedClaimCount < 1 && cardSignals.unsupportedClaimCount < 1) {
    add(starter.starterId, 'starter has no visible unsupported/missing/stale claim signal');
  }
  if (!model.research.reviewGates.some((gate) => /human|review|canonical|source/i.test(gate))) {
    add(starter.starterId, 'inspect research display has no explicit review gate');
  }
  if (!model.ontology.active.length && !model.research.ontologyCoverage.activeOntologyIds.length) {
    add(starter.starterId, 'inspect ontology coverage is empty');
  }
}

const report = {
  catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
  starterCount: CAPSULE_STARTER_DEFINITIONS.length,
  inspectedFields: [
    'research dossier',
    'source receipts',
    'claim ledger',
    'reasoning graph',
    'ontology stack',
    'evidence gaps',
    'agent workflow',
    'review gates',
    'library card research signals',
  ],
  findings,
};

const outDir = join(process.cwd(), 'docs', 'audits');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'LATEST-capsule-inspect-visibility-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(join(outDir, 'LATEST-capsule-inspect-visibility-audit.md'), renderMarkdown(report), 'utf8');

if (findings.length) {
  console.error(`audit:capsule-inspect-visibility FAIL (${findings.length} findings)`);
  for (const finding of findings.slice(0, 30)) console.error(`- ${finding.starterId}: ${finding.issue}`);
  process.exit(1);
}

console.log('audit:capsule-inspect-visibility OK');
console.log(`Starters: ${CAPSULE_STARTER_DEFINITIONS.length}`);
console.log(`Inspected fields: ${report.inspectedFields.length}`);

function starterToCapsuleInput(starter: CapsuleStarterDefinition) {
  return {
    capsuleId: starter.starterId,
    label: starter.label,
    scope: starter.category,
    version: 1,
    summary: starter.summary,
    coreRefs: starter.coreRefs,
    sourceRefs: starter.sourcePack.map((source) => ({
      sourceId: source.id,
      label: source.label,
      url: source.url,
      publisher: source.publisher,
      date: source.date,
      reliabilityTier: source.reliabilityTier,
    })),
    claimLedger: [
      ...starter.claimLedgerSeeds.supported,
      ...starter.claimLedgerSeeds.weak,
      ...starter.claimLedgerSeeds.missing,
      ...starter.claimLedgerSeeds.stale,
    ].map((claim) => ({
      claimId: claim.claimId,
      text: claim.claim,
      support: claim.status,
      sourceRefIds: claim.sourceIds,
      provenance: 'starter inspect visibility audit',
    })),
    ontologyBinding: {
      domainId: starter.domain,
      ontologyIds: starter.contextCaptureProfile.ontologyBinding.ontologyIds,
      acoPrimitives: starter.contextCaptureProfile.embeddedGraph.allowedAcoPrimitives,
      bindingRationale: 'Starter audit binding.',
    },
    embeddedGraph: starter.graphLiteProjection,
    graphLiteProjection: starter.graphLiteProjection,
    starterSnapshot: {
      ...starter,
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    },
  };
}

function add(starterId: string, issue: string): void {
  findings.push({ starterId, issue });
}

function renderMarkdown(input: typeof report): string {
  return [
    '# Capsule Inspect Visibility Audit',
    '',
    `Catalog version: ${input.catalogVersion}`,
    `Starter count: ${input.starterCount}`,
    `Inspected fields: ${input.inspectedFields.join(', ')}`,
    `Findings: ${input.findings.length}`,
    '',
    input.findings.length
      ? input.findings.map((finding) => `- ${finding.starterId}: ${finding.issue}`).join('\n')
      : 'Every starter projects research, graph, source, ontology, workflow, and review-gate signals into the inspect model and library-card signal contract.',
    '',
  ].join('\n');
}
