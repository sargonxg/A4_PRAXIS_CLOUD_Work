import type { CaseModule } from '@/types/case-module';

export interface WorkbenchGraphNode {
  id: string;
  label: string;
  type: 'case' | 'actor' | 'source' | 'claim' | 'evidence' | 'verdict';
  description: string;
  provenanceCount: number;
  confidence: number;
  occurredAt?: string;
  timelineLabel?: string;
  geo?: {
    latitude: number;
    longitude: number;
    label: string;
    derived: boolean;
  };
  metrics?: {
    centrality?: {
      betweenness?: number;
      eigenvector?: number;
      pagerank?: number;
      closeness?: number;
    };
    community?: number;
    core_number?: number;
  };
  metadata?: {
    sanctions?: WorkbenchGraphSanctionsMatch[];
    [key: string]: unknown;
  };
}

export interface WorkbenchGraphSanctionsMatch {
  entity_id?: string;
  entityId?: string;
  score?: number;
  datasets?: string[];
  opensanctions_url?: string;
  url?: string;
}

export interface WorkbenchGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'contains' | 'supports' | 'checks' | 'informs';
}

export interface WorkbenchGraph {
  nodes: WorkbenchGraphNode[];
  edges: WorkbenchGraphEdge[];
  provenanceCoverage: number;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

const REGION_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  'user case': { latitude: 35.05, longitude: 38.55 },
  levant: { latitude: 34.8, longitude: 38.7 },
  africa: { latitude: 12.8, longitude: -1.8 },
  sahel: { latitude: 14.6, longitude: -1.9 },
  'west africa': { latitude: 8.2, longitude: -1.3 },
  'united states': { latitude: 39.5, longitude: -98.35 },
  organizational: { latitude: 40.73, longitude: -73.93 },
};

function regionCenter(region: string) {
  const normalized = region.toLowerCase();
  const match = Object.entries(REGION_CENTERS).find(([key]) => normalized.includes(key));
  return match?.[1] ?? { latitude: 20, longitude: 0 };
}

function graphDate(...candidates: Array<string | null | undefined>) {
  return candidates.find((candidate) => Boolean(candidate)) ?? new Date('2026-01-01T00:00:00.000Z').toISOString();
}

function derivedGeo(region: string, index: number, total: number, label: string) {
  const center = regionCenter(region);
  const angle = (Math.PI * 2 * index) / Math.max(1, total);
  const radius = 0.75 + (index % 3) * 0.28;
  return {
    latitude: Number((center.latitude + Math.sin(angle) * radius).toFixed(5)),
    longitude: Number((center.longitude + Math.cos(angle) * radius).toFixed(5)),
    label,
    derived: true,
  };
}

export function buildWorkbenchCaseGraph(caseModule: CaseModule): WorkbenchGraph {
  const situation = caseModule.situation;
  const sourceReceipts = caseModule.sources.slice(0, 6);
  const actors = situation.actors.slice(0, 6);
  const nodes: WorkbenchGraphNode[] = [
    {
      id: 'case',
      label: caseModule.manifest.name,
      type: 'case',
      description: caseModule.manifest.summary,
      provenanceCount: caseModule.sources.length,
      confidence: 0.8,
      occurredAt: graphDate(situation.latestEventDate, situation.updatedAt, situation.createdAt),
      timelineLabel: 'Case frame',
      geo: derivedGeo(situation.region, 0, 1, situation.region),
    },
    {
      id: 'claim-layer',
      label: 'Claim layer',
      type: 'claim',
      description: `${caseModule.truthLayers.claim.nodeCount} claim nodes with ${Math.round(caseModule.truthLayers.claim.provenanceCoverage * 100)}% provenance coverage.`,
      provenanceCount: caseModule.truthLayers.claim.nodeCount,
      confidence: clampConfidence(caseModule.truthLayers.claim.confidenceMax || caseModule.truthLayers.claim.provenanceCoverage),
      occurredAt: graphDate(caseModule.truthLayers.claim.lastUpdated, situation.updatedAt),
      timelineLabel: 'Claim layer updated',
      geo: derivedGeo(situation.region, 1, 4, 'Claim layer'),
    },
    {
      id: 'evidence-layer',
      label: 'Evidence layer',
      type: 'evidence',
      description: `${caseModule.truthLayers.evidence.nodeCount} evidence nodes tracked for receipts and extraction lineage.`,
      provenanceCount: caseModule.truthLayers.evidence.nodeCount,
      confidence: clampConfidence(caseModule.truthLayers.evidence.confidenceMax || caseModule.truthLayers.evidence.provenanceCoverage),
      occurredAt: graphDate(caseModule.truthLayers.evidence.lastUpdated, situation.updatedAt),
      timelineLabel: 'Evidence layer updated',
      geo: derivedGeo(situation.region, 2, 4, 'Evidence layer'),
    },
    {
      id: 'verdict-layer',
      label: 'Verdict layer',
      type: 'verdict',
      description: `${caseModule.truthLayers.verdict.nodeCount} verdict nodes available for decision products.`,
      provenanceCount: caseModule.truthLayers.verdict.nodeCount,
      confidence: clampConfidence(caseModule.truthLayers.verdict.confidenceMax || caseModule.truthLayers.verdict.provenanceCoverage),
      occurredAt: graphDate(caseModule.truthLayers.verdict.lastUpdated, situation.updatedAt),
      timelineLabel: 'Verdict layer updated',
      geo: derivedGeo(situation.region, 3, 4, 'Verdict layer'),
    },
  ];

  for (const [index, actor] of actors.entries()) {
    nodes.push({
      id: `actor-${actor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label: actor,
      type: 'actor',
      description: 'Actor from the active case frame.',
      provenanceCount: 1,
      confidence: 0.68,
      occurredAt: graphDate(situation.keyDates?.[index % Math.max(1, situation.keyDates.length)]?.date, situation.updatedAt),
      timelineLabel: 'Actor in scope',
      geo: derivedGeo(situation.region, index + 4, actors.length + 4, actor),
    });
  }

  for (const [index, source] of sourceReceipts.entries()) {
    nodes.push({
      id: `source-${source.receiptId}`,
      label: source.title ?? source.name ?? source.source,
      type: 'source',
      description: source.provider ?? source.source ?? 'Source receipt',
      provenanceCount: 1,
      confidence: clampConfidence(source.reliabilityScore ?? 0.7),
      occurredAt: graphDate(source.timestamp, situation.updatedAt),
      timelineLabel: 'Source receipt',
      geo: derivedGeo(situation.region, index + actors.length + 4, sourceReceipts.length + actors.length + 4, source.title ?? source.name ?? 'Source'),
    });
  }

  const edges: WorkbenchGraphEdge[] = [
    { id: 'case-claims', source: 'case', target: 'claim-layer', label: 'contains', type: 'contains' },
    { id: 'case-evidence', source: 'case', target: 'evidence-layer', label: 'contains', type: 'contains' },
    { id: 'case-verdicts', source: 'case', target: 'verdict-layer', label: 'contains', type: 'contains' },
    { id: 'evidence-claims', source: 'evidence-layer', target: 'claim-layer', label: 'supports', type: 'supports' },
    { id: 'claims-verdicts', source: 'claim-layer', target: 'verdict-layer', label: 'checks', type: 'checks' },
  ];

  for (const node of nodes.filter((item) => item.type === 'actor')) {
    edges.push({ id: `case-${node.id}`, source: 'case', target: node.id, label: 'frames', type: 'contains' });
  }
  for (const node of nodes.filter((item) => item.type === 'source')) {
    edges.push({ id: `${node.id}-evidence`, source: node.id, target: 'evidence-layer', label: 'informs', type: 'informs' });
  }

  const provenanceCoverage =
    (caseModule.truthLayers.source.provenanceCoverage +
      caseModule.truthLayers.claim.provenanceCoverage +
      caseModule.truthLayers.evidence.provenanceCoverage +
      caseModule.truthLayers.verdict.provenanceCoverage) / 4;

  return { nodes, edges, provenanceCoverage: clampConfidence(provenanceCoverage) };
}
