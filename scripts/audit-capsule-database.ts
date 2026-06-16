import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  MULTILATERAL_SYRIA_FLAGSHIP_STARTER_IDS,
  type CapsuleStarterCategory,
  type CapsuleStarterDefinition,
  type CapsuleStarterDomain,
} from '../src/lib/product/context-capsules';

type CountRow = {
  id: string;
  count: number;
};

type Finding = {
  starterId: string;
  issue: string;
};

type GraphStats = {
  min: number;
  max: number;
  average: number;
  uniqueCounts: number;
  sameNodeEdgeRecords: number;
  distribution: CountRow[];
};

const root = process.cwd();
const findings: Finding[] = [];
const starters = CAPSULE_STARTER_DEFINITIONS;

const recordsByCategory = countBy(starters, (starter) => starter.category);
const recordsByDomain = countBy(starters, (starter) => starter.domain);
const recordsByReadinessStars = countBy(starters, (starter) => `${starter.readinessStars}`);
const recordsBySourceTier = countSourceTiers(starters);
const recordsByOutputProduct = countArrayValues(starters.flatMap((starter) => starter.outputProductIds));
const recordsByTool = countArrayValues(starters.flatMap((starter) => starter.recommendedToolIds));
const recordsByGraphDensityBand = countBy(starters, graphDensityBand);

const graphNodeCounts = starters.map((starter) => starter.ontologyOverlay?.graphSeed.nodeTemplates.length ?? 0);
const graphEdgeCounts = starters.map((starter) => starter.ontologyOverlay?.graphSeed.edgeTemplates.length ?? 0);
const graphStats = {
  nodes: computeGraphStats(graphNodeCounts, graphEdgeCounts),
  edges: computeGraphStats(graphEdgeCounts, graphNodeCounts),
};
const sourceStats = computeSourceStats(starters);

for (const starter of starters) {
  const graphSeed = starter.ontologyOverlay?.graphSeed;
  const projection = starter.graphLiteProjection;
  if (!graphSeed) {
    add(starter.starterId, 'missing ontology graph seed');
    continue;
  }
  if (graphSeed.nodeTemplates.length < 84) add(starter.starterId, 'graph seed has fewer than 84 node templates');
  if (graphSeed.edgeTemplates.length < 84) add(starter.starterId, 'graph seed has fewer than 84 edge templates');
  if (new Set(graphSeed.nodeTemplates).size !== graphSeed.nodeTemplates.length) add(starter.starterId, 'duplicate graph node templates');
  if (new Set(graphSeed.edgeTemplates).size !== graphSeed.edgeTemplates.length) add(starter.starterId, 'duplicate graph edge templates');
  if (projection.nodeCount !== graphSeed.nodeTemplates.length) add(starter.starterId, 'GraphLite node count does not match graph seed');
  if (projection.edgeCount !== graphSeed.edgeTemplates.length) add(starter.starterId, 'GraphLite edge count does not match graph seed');
  const nodeText = graphSeed.nodeTemplates.join('\n');
  const edgeText = graphSeed.edgeTemplates.join('\n');
  for (const requiredNodeKind of ['ContextFrame', 'KnowledgeBoundary', 'DelimitationRule', 'ConfidencePosture', 'ReviewQuestion']) {
    if (!nodeText.includes(requiredNodeKind)) add(starter.starterId, `graph seed missing ${requiredNodeKind}`);
  }
  for (const requiredEdgeKind of ['DELIMITS', 'STRUCTURES', 'BOUNDS_CONFIDENCE', 'REQUIRES_SOURCE_REFRESH']) {
    if (!edgeText.includes(requiredEdgeKind)) add(starter.starterId, `graph seed missing ${requiredEdgeKind}`);
  }
  if (!starter.ontologyOverlay?.promotionRules.join(' ').match(/source|review|confidence|delimit|boundary/i)) {
    add(starter.starterId, 'promotion rules do not state source/review/boundary policy');
  }
  if (!starter.ontologyOverlay?.forbiddenClaims.join(' ').match(/infer|unsupported|boundary|endorsement|affiliated/i)) {
    add(starter.starterId, 'forbidden claims do not delimit overreach');
  }
}

if (new Set(graphNodeCounts).size < 24) add('catalog', 'graph node counts are not varied enough across the catalog');
if (new Set(graphEdgeCounts).size < 24) add('catalog', 'graph edge counts are not varied enough across the catalog');
if (graphNodeCounts.filter((count, index) => count === graphEdgeCounts[index]).length >= starters.length / 3) {
  add('catalog', 'too many capsules have identical node and edge counts');
}

const report = {
  ok: findings.length === 0,
  generatedAt: new Date().toISOString(),
  catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
  auditedScope: {
    canonicalStore: 'Firestore ContextCapsules',
    auditedRecords: 'local starter catalog definitions and seedable GraphLite advisory projection metadata',
    remoteFirestoreQueried: false,
    remoteFirestoreMutation: false,
    note: 'This audit validates the capsule database shape available to the app without writing to remote stores.',
  },
  totals: {
    capsules: starters.length,
    records: starters.length,
    categories: Object.keys(recordsByCategory).length,
    domains: Object.keys(recordsByDomain).length,
    sourceRecords: starters.reduce((total, starter) => total + starter.sourcePack.length, 0),
    excerptRecords: starters.reduce((total, starter) => total + starter.excerpts.length, 0),
    graphNodeTemplates: graphNodeCounts.reduce((total, count) => total + count, 0),
    graphEdgeTemplates: graphEdgeCounts.reduce((total, count) => total + count, 0),
    namedGraphRecords: new Set(starters.map((starter) => starter.graphLiteProjection.namedGraph)).size,
  },
  recordsByCategory: sortRows(recordsByCategory) as Array<{ id: CapsuleStarterCategory; count: number }>,
  recordsByDomain: sortRows(recordsByDomain) as Array<{ id: CapsuleStarterDomain; count: number }>,
  recordsByReadinessStars: sortRows(recordsByReadinessStars),
  recordsBySourceTier: sortRows(recordsBySourceTier),
  recordsByOutputProduct: sortRows(recordsByOutputProduct).slice(0, 20),
  recordsByTool: sortRows(recordsByTool).slice(0, 20),
  recordsByGraphDensityBand: sortRows(recordsByGraphDensityBand),
  graphStats,
  sourceStats,
  flagshipMultilateralSyriaRecords: MULTILATERAL_SYRIA_FLAGSHIP_STARTER_IDS.map((starterId) => {
    const starter = starters.find((candidate) => candidate.starterId === starterId);
    return {
      starterId,
      found: Boolean(starter),
      category: starter?.category ?? null,
      domain: starter?.domain ?? null,
      nodeTemplates: starter?.ontologyOverlay?.graphSeed.nodeTemplates.length ?? 0,
      edgeTemplates: starter?.ontologyOverlay?.graphSeed.edgeTemplates.length ?? 0,
      sourceRecords: starter?.sourcePack.length ?? 0,
      graphLabel: starter?.ontologyOverlay?.graphSeed.proposalLabel ?? null,
    };
  }),
  findings,
  architectureSuggestions: [
    'Promote graph density, source freshness cadence, and confidence cap into an explicit graphDensityProfile field instead of inferring from templates.',
    'Add a Firestore seed dry-run diff that compares starter definitions with persisted user capsules before any remote write is allowed.',
    'Store source-refresh SLAs per capsule family so stale official reports, media items, and method sources age differently.',
    'Add graph visualization lens filters for structure, evidence, confidence, delimitation, and source-refresh edges.',
    'Create named capsule bundles for flagship policy workflows so starred packs can be installed without hardcoding UI order.',
    'Add per-capsule prompt-budget telemetry so large ontology overlays are summarized before they crowd out user evidence.',
    'Keep GraphLite projections advisory until a review card accepts a node or edge into canonical capsule state.',
  ],
};

const auditDir = join(root, 'docs', 'audits');
mkdirSync(auditDir, { recursive: true });
writeFileSync(join(auditDir, 'LATEST-capsule-database-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(join(auditDir, 'LATEST-capsule-database-audit.md'), renderMarkdown(report), 'utf8');

if (!report.ok) {
  console.error(`audit:capsule-database FAIL (${findings.length} findings)`);
  for (const finding of findings.slice(0, 40)) console.error(`- ${finding.starterId}: ${finding.issue}`);
  process.exit(1);
}

console.log('audit:capsule-database OK');
console.log(`Capsules: ${report.totals.capsules}`);
console.log(`Categories: ${report.recordsByCategory.map((row) => `${row.id} ${row.count}`).join(', ')}`);
console.log(`Domains: ${report.totals.domains}`);
console.log(`Graph nodes: ${report.graphStats.nodes.min}-${report.graphStats.nodes.max}, unique counts ${report.graphStats.nodes.uniqueCounts}`);
console.log(`Graph edges: ${report.graphStats.edges.min}-${report.graphStats.edges.max}, unique counts ${report.graphStats.edges.uniqueCounts}`);

function add(starterId: string, issue: string): void {
  findings.push({ starterId, issue });
}

function countBy<T, K extends string>(items: T[], selector: (item: T) => K): Record<K, number> {
  return items.reduce<Record<K, number>>((acc, item) => {
    const key = selector(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<K, number>);
}

function countArrayValues(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function countSourceTiers(input: CapsuleStarterDefinition[]): Record<string, number> {
  return input.reduce<Record<string, number>>((acc, starter) => {
    for (const source of starter.sourcePack) {
      const key = `tier-${source.reliabilityTier ?? 'unknown'}`;
      acc[key] = (acc[key] ?? 0) + 1;
    }
    return acc;
  }, {});
}

function sortRows<T extends string>(record: Record<T, number>): CountRow[] {
  return Object.entries(record)
    .map(([id, count]) => ({ id, count: Number(count) }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

function computeGraphStats(values: number[], peerValues: number[]): GraphStats {
  const distribution = sortRows(values.reduce<Record<string, number>>((acc, value) => {
    acc[`${value}`] = (acc[`${value}`] ?? 0) + 1;
    return acc;
  }, {}));
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    average: Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2)),
    uniqueCounts: new Set(values).size,
    sameNodeEdgeRecords: values.filter((value, index) => value === peerValues[index]).length,
    distribution,
  };
}

function computeSourceStats(input: CapsuleStarterDefinition[]) {
  const counts = input.map((starter) => starter.sourcePack.length);
  return {
    minPerCapsule: Math.min(...counts),
    maxPerCapsule: Math.max(...counts),
    averagePerCapsule: Number((counts.reduce((total, count) => total + count, 0) / counts.length).toFixed(2)),
    uniqueSourceIds: new Set(input.flatMap((starter) => starter.sourcePack.map((source) => source.id))).size,
    capsulesWithFourOrMoreSources: input.filter((starter) => starter.sourcePack.length >= 4).length,
  };
}

function graphDensityBand(starter: CapsuleStarterDefinition): string {
  const nodes = starter.ontologyOverlay?.graphSeed.nodeTemplates.length ?? 0;
  if (nodes >= 130) return '130-plus';
  if (nodes >= 115) return '115-129';
  if (nodes >= 100) return '100-114';
  return '84-99';
}

function renderMarkdown(input: typeof report): string {
  return [
    '# Capsule Database Audit',
    '',
    `Catalog version: ${input.catalogVersion}`,
    `Generated at: ${input.generatedAt}`,
    `Result: ${input.ok ? 'pass' : 'fail'}`,
    `Canonical store: ${input.auditedScope.canonicalStore}`,
    `Audited scope: ${input.auditedScope.auditedRecords}`,
    `Remote Firestore queried: ${input.auditedScope.remoteFirestoreQueried}`,
    `Remote Firestore mutation: ${input.auditedScope.remoteFirestoreMutation}`,
    '',
    '## Totals',
    '',
    `- Capsules/records: ${input.totals.capsules}`,
    `- Source records: ${input.totals.sourceRecords}`,
    `- Excerpt records: ${input.totals.excerptRecords}`,
    `- Named GraphLite graph records: ${input.totals.namedGraphRecords}`,
    `- Graph node templates: ${input.totals.graphNodeTemplates}`,
    `- Graph edge templates: ${input.totals.graphEdgeTemplates}`,
    '',
    '## Types',
    '',
    ...input.recordsByCategory.map((row) => `- ${row.id}: ${row.count}`),
    '',
    '## Domains',
    '',
    ...input.recordsByDomain.map((row) => `- ${row.id}: ${row.count}`),
    '',
    '## Graph Stats',
    '',
    `- Nodes: min ${input.graphStats.nodes.min}, max ${input.graphStats.nodes.max}, average ${input.graphStats.nodes.average}, unique counts ${input.graphStats.nodes.uniqueCounts}`,
    `- Edges: min ${input.graphStats.edges.min}, max ${input.graphStats.edges.max}, average ${input.graphStats.edges.average}, unique counts ${input.graphStats.edges.uniqueCounts}`,
    `- Same node/edge count records: ${input.graphStats.nodes.sameNodeEdgeRecords}`,
    `- Density bands: ${input.recordsByGraphDensityBand.map((row) => `${row.id} ${row.count}`).join(', ')}`,
    '',
    '## Source Stats',
    '',
    `- Unique source IDs: ${input.sourceStats.uniqueSourceIds}`,
    `- Sources per capsule: min ${input.sourceStats.minPerCapsule}, max ${input.sourceStats.maxPerCapsule}, average ${input.sourceStats.averagePerCapsule}`,
    `- Capsules with four or more sources: ${input.sourceStats.capsulesWithFourOrMoreSources}`,
    `- Source tier records: ${input.recordsBySourceTier.map((row) => `${row.id} ${row.count}`).join(', ')}`,
    '',
    '## Multilateral Syria Flagship Records',
    '',
    ...input.flagshipMultilateralSyriaRecords.map((record) =>
      `- ${record.starterId}: ${record.found ? 'found' : 'missing'}, ${record.category ?? 'n/a'}, ${record.domain ?? 'n/a'}, nodes ${record.nodeTemplates}, edges ${record.edgeTemplates}, sources ${record.sourceRecords}`,
    ),
    '',
    '## Findings',
    '',
    ...(input.findings.length ? input.findings.map((finding) => `- ${finding.starterId}: ${finding.issue}`) : ['- None']),
    '',
    '## Architecture Suggestions',
    '',
    ...input.architectureSuggestions.map((suggestion) => `- ${suggestion}`),
    '',
  ].join('\n');
}
