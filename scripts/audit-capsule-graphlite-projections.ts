import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
} from '@/lib/product/context-capsules';

type Finding = {
  starterId: string;
  issue: string;
};

const findings: Finding[] = [];
const namedGraphs = new Set<string>();

for (const starter of CAPSULE_STARTER_DEFINITIONS) {
  const projection = starter.graphLiteProjection;
  const graphSeed = starter.ontologyOverlay?.graphSeed;

  if (projection.provider !== 'graphlite') add(starter.starterId, 'projection provider is not graphlite');
  if (projection.status !== 'compiled-advisory') add(starter.starterId, `projection status is ${projection.status}`);
  if (projection.storageScope !== 'owner-workspace-named-graph') add(starter.starterId, 'projection is not scoped as owner workspace named graph');
  if (!projection.advisoryOnly) add(starter.starterId, 'projection is not advisory only');
  if (projection.canonicalStore !== 'Firestore ContextCapsules') add(starter.starterId, 'projection does not point back to Firestore canonical store');
  if (projection.compileStatus !== 'gql-ready') add(starter.starterId, 'projection is not GQL ready');
  if (!projection.promotionGate.match(/human|review|canonical/i)) add(starter.starterId, 'projection promotion gate is not explicit');
  if (!projection.namedGraph.match(/^capsule_[a-z0-9_]+$/)) add(starter.starterId, `named graph is not sanitized: ${projection.namedGraph}`);
  if (namedGraphs.has(projection.namedGraph)) add(starter.starterId, `duplicate named graph ${projection.namedGraph}`);
  namedGraphs.add(projection.namedGraph);

  if (projection.nodeCount !== (graphSeed?.nodeTemplates.length ?? 0)) add(starter.starterId, 'node count does not match ontology seed');
  if (projection.edgeCount !== (graphSeed?.edgeTemplates.length ?? 0)) add(starter.starterId, 'edge count does not match ontology seed');
  if (projection.nodeCount < 84) add(starter.starterId, 'GraphLite projection below 84 nodes');
  if (projection.edgeCount < 84) add(starter.starterId, 'GraphLite projection below 84 edges');
  if (!starter.sourcePack.every((source) => projection.sourceIds.includes(source.id))) add(starter.starterId, 'projection does not cover full source pack');
  if (!projection.sourceChecksum.match(/^gql-[a-f0-9]{8}$/)) add(starter.starterId, 'projection source checksum missing or malformed');

  const sampleGql = projection.sampleGql.join('\n');
  if (!sampleGql.includes('CREATE GRAPH IF NOT EXISTS')) add(starter.starterId, 'sample GQL is missing graph creation');
  if (!sampleGql.includes('Firestore ContextCapsules')) add(starter.starterId, 'sample GQL does not preserve Firestore canonical label');
  if (/\b(DROP|DELETE|DETACH)\b/i.test(sampleGql)) add(starter.starterId, 'sample GQL contains destructive verbs');
}

if (!CAPSULE_STARTER_CATALOG_VERSION.match(/graphlite-advisory-projection.*v18/)) {
  add('catalog', `catalog version is not GraphLite v18: ${CAPSULE_STARTER_CATALOG_VERSION}`);
}

const report = {
  catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
  starterCount: CAPSULE_STARTER_DEFINITIONS.length,
  provider: 'graphlite',
  projectionMode: 'advisory',
  canonicalStore: 'Firestore ContextCapsules',
  namedGraphCount: namedGraphs.size,
  findings,
};

const outDir = join(process.cwd(), 'docs', 'audits');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'LATEST-capsule-graphlite-projections-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(join(outDir, 'LATEST-capsule-graphlite-projections-audit.md'), renderMarkdown(report), 'utf8');

if (findings.length) {
  console.error(`audit:capsule-graphlite-projections FAIL (${findings.length} findings)`);
  for (const finding of findings.slice(0, 30)) console.error(`- ${finding.starterId}: ${finding.issue}`);
  process.exit(1);
}

console.log('audit:capsule-graphlite-projections OK');
console.log(`Starters: ${CAPSULE_STARTER_DEFINITIONS.length}`);
console.log(`Named graphs: ${namedGraphs.size}`);

function add(starterId: string, issue: string): void {
  findings.push({ starterId, issue });
}

function renderMarkdown(input: typeof report): string {
  return [
    '# Capsule GraphLite Projections Audit',
    '',
    `Catalog version: ${input.catalogVersion}`,
    `Starter count: ${input.starterCount}`,
    `Provider: ${input.provider}`,
    `Projection mode: ${input.projectionMode}`,
    `Canonical store: ${input.canonicalStore}`,
    `Named graphs: ${input.namedGraphCount}`,
    `Findings: ${input.findings.length}`,
    '',
    input.findings.length
      ? input.findings.map((finding) => `- ${finding.starterId}: ${finding.issue}`).join('\n')
      : 'All starter capsules compile to GraphLite-ready advisory projection metadata with Firestore canonical posture preserved.',
    '',
  ].join('\n');
}
