import type { GraphData } from '@/lib/firebase/graph-service';
import { normalizeCanonicalGraph } from '@/lib/graph/canonical-graph';

export interface GraphRepairSuggestion {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  kind: 'missing-endpoint' | 'orphan-node' | 'weak-provenance' | 'duplicate-label' | 'stale-temporal';
  summary: string;
  payload: Record<string, unknown>;
}

export function generateGraphRepairSuggestions(graph: GraphData | null | undefined, now = new Date()): GraphRepairSuggestion[] {
  const normalized = normalizeCanonicalGraph(graph);
  const suggestions: GraphRepairSuggestion[] = [];
  const nodeIds = new Set(normalized.nodes.map((node) => node.id));
  const connected = new Set(normalized.edges.flatMap((edge) => [edge.source, edge.target]));
  const labelMap = new Map<string, string[]>();

  for (const node of normalized.nodes) {
    const key = node.label.toLowerCase().replace(/\s+/g, ' ').trim();
    labelMap.set(key, [...(labelMap.get(key) ?? []), node.id]);
    const evidence = node.metadata?.evidence;
    const hasStrongEvidence = Array.isArray(evidence) && evidence.some((item) => {
      if (!item || typeof item !== 'object') return false;
      const record = item as Record<string, unknown>;
      return Boolean(record.sourceReceiptId || record.documentId || record.chunkId || record.url || record.fragment);
    });
    if (!hasStrongEvidence) {
      suggestions.push({
        id: `weak-provenance:${node.id}`,
        severity: 'high',
        kind: 'weak-provenance',
        summary: `${node.label} has no evidence envelope.`,
        payload: { nodeId: node.id, label: node.label },
      });
    }
    const validFrom = typeof node.metadata?.valid_from === 'string' ? node.metadata.valid_from : undefined;
    if (validFrom && !Number.isNaN(Date.parse(validFrom))) {
      const ageDays = Math.floor((now.getTime() - Date.parse(validFrom)) / 86_400_000);
      if (ageDays > 180) {
        suggestions.push({
          id: `stale-temporal:${node.id}`,
          severity: 'medium',
          kind: 'stale-temporal',
          summary: `${node.label} has a temporal anchor older than 180 days; verify whether it still holds.`,
          payload: { nodeId: node.id, validFrom, ageDays },
        });
      }
    }
  }

  for (const edge of normalized.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      suggestions.push({
        id: `missing-endpoint:${edge.id}`,
        severity: 'critical',
        kind: 'missing-endpoint',
        summary: `${edge.label ?? edge.type} references a missing endpoint.`,
        payload: { edgeId: edge.id, source: edge.source, target: edge.target },
      });
    }
  }

  for (const node of normalized.nodes) {
    if (!connected.has(node.id) && normalized.nodes.length > 3) {
      suggestions.push({
        id: `orphan-node:${node.id}`,
        severity: 'medium',
        kind: 'orphan-node',
        summary: `${node.label} is not connected to the graph.`,
        payload: { nodeId: node.id, label: node.label },
      });
    }
  }

  for (const [label, ids] of labelMap.entries()) {
    if (ids.length > 1) {
      suggestions.push({
        id: `duplicate-label:${label}`,
        severity: 'medium',
        kind: 'duplicate-label',
        summary: `${ids.length} nodes share the label "${label}". Consider a canonical-name merge.`,
        payload: { label, nodeIds: ids },
      });
    }
  }

  return suggestions.slice(0, 100);
}
