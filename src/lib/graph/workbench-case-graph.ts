import type { CaseModule } from '@/types/case-module';

export interface WorkbenchGraphNode {
  id: string;
  label: string;
  type: 'case' | 'actor' | 'source' | 'claim' | 'evidence' | 'verdict';
  description: string;
  provenanceCount: number;
  confidence: number;
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
    },
    {
      id: 'claim-layer',
      label: 'Claim layer',
      type: 'claim',
      description: `${caseModule.truthLayers.claim.nodeCount} claim nodes with ${Math.round(caseModule.truthLayers.claim.provenanceCoverage * 100)}% provenance coverage.`,
      provenanceCount: caseModule.truthLayers.claim.nodeCount,
      confidence: clampConfidence(caseModule.truthLayers.claim.confidenceMax || caseModule.truthLayers.claim.provenanceCoverage),
    },
    {
      id: 'evidence-layer',
      label: 'Evidence layer',
      type: 'evidence',
      description: `${caseModule.truthLayers.evidence.nodeCount} evidence nodes tracked for receipts and extraction lineage.`,
      provenanceCount: caseModule.truthLayers.evidence.nodeCount,
      confidence: clampConfidence(caseModule.truthLayers.evidence.confidenceMax || caseModule.truthLayers.evidence.provenanceCoverage),
    },
    {
      id: 'verdict-layer',
      label: 'Verdict layer',
      type: 'verdict',
      description: `${caseModule.truthLayers.verdict.nodeCount} verdict nodes available for decision products.`,
      provenanceCount: caseModule.truthLayers.verdict.nodeCount,
      confidence: clampConfidence(caseModule.truthLayers.verdict.confidenceMax || caseModule.truthLayers.verdict.provenanceCoverage),
    },
  ];

  for (const actor of actors) {
    nodes.push({
      id: `actor-${actor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label: actor,
      type: 'actor',
      description: 'Actor from the active case frame.',
      provenanceCount: 1,
      confidence: 0.68,
    });
  }

  for (const source of sourceReceipts) {
    nodes.push({
      id: `source-${source.receiptId}`,
      label: source.title ?? source.name ?? source.source,
      type: 'source',
      description: source.provider ?? source.source ?? 'Source receipt',
      provenanceCount: 1,
      confidence: clampConfidence(source.reliabilityScore ?? 0.7),
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
