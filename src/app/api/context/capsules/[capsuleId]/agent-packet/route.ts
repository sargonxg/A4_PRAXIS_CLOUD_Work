import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getCapsule } from '@/lib/context/capsule-service';
import {
  buildAgentContextPacket,
  type AgentContextGroundingMap,
} from '@/lib/context/agent-context-packet';
import type {
  AgentContextBudgetTier,
  NormalizedGraphEdge,
  NormalizedGraphNode,
  NormalizedSourceReceipt,
  OmittedContextItem,
  SelectedAgentContext,
} from '@/lib/context/agent-context-salience';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };
type RiskSeverity = 'critical' | 'warning' | 'notice';
type RiskKind = 'stale_source' | 'advisory_row' | 'inferred_edge' | 'conflict' | 'missing_primitive';

interface AgentPacketRiskFlag {
  id: string;
  kind: RiskKind;
  severity: RiskSeverity;
  label: string;
  detail: string;
}

interface GroundingDisplayRef {
  id: string;
  originalId: string;
  label?: string;
  title?: string;
  url?: string | null;
}

interface AgentPacketGroundingClaim {
  id: string;
  originalId: string;
  text: string;
  nodes: GroundingDisplayRef[];
  edges: GroundingDisplayRef[];
  sources: GroundingDisplayRef[];
  contradicts: GroundingDisplayRef[];
}

const BUDGET_TIERS = new Set<AgentContextBudgetTier>(['tiny', 'standard', 'expanded']);

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });

    const url = new URL(request.url);
    const tierParam = url.searchParams.get('tier');
    if (tierParam && !BUDGET_TIERS.has(tierParam as AgentContextBudgetTier)) {
      return NextResponse.json({ error: 'Invalid packet tier' }, { status: 400 });
    }

    const capsule = await getCapsule(user.uid, capsuleId);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });

    const packet = buildAgentContextPacket({
      capsule,
      userQuery: normalizeQuery(url.searchParams.get('q')),
      budgetTier: (tierParam as AgentContextBudgetTier | null) ?? 'standard',
      requestTime: new Date().toISOString(),
      turnId: null,
    });

    return NextResponse.json({
      packetText: packet.packetText,
      selectedCounts: selectedCounts(packet.selected),
      omitted: packet.omitted,
      temporalTimeline: packet.temporalTimeline,
      groundingMap: buildUiGroundingMap(packet.groundingMap, packet.selected),
      riskFlags: deriveRiskFlags(packet.selected),
    });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/agent-packet');
  }
});

function normalizeQuery(value: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned || null;
}

function selectedCounts(selected: SelectedAgentContext): Record<keyof SelectedAgentContext, number> {
  return {
    nodes: selected.nodes.length,
    edges: selected.edges.length,
    claims: selected.claims.length,
    sources: selected.sources.length,
    paths: selected.paths.length,
    timeline: selected.timeline.length,
    causalLinks: selected.causalLinks.length,
  };
}

function buildUiGroundingMap(map: AgentContextGroundingMap, selected: SelectedAgentContext): {
  display: AgentContextGroundingMap;
  claims: AgentPacketGroundingClaim[];
} {
  const nodesById = new Map(selected.nodes.map((node) => [node.id, node]));
  const edgesById = new Map(selected.edges.map((edge) => [edge.id, edge]));
  const sourcesById = new Map(selected.sources.map((source) => [source.id, source]));

  return {
    display: map,
    claims: selected.claims.map((claim) => ({
      id: displayId(map.claims, claim.id),
      originalId: claim.id,
      text: claim.text,
      nodes: claim.linkedNodeIds.map((id) => nodeRef(map.nodes, id, nodesById.get(id))),
      edges: claim.linkedEdgeIds.map((id) => edgeRef(map.edges, id, edgesById.get(id))),
      sources: claim.sourceReceiptIds.map((id) => sourceRef(map.sources, id, sourcesById.get(id))),
      contradicts: claim.contradicts.map((id) => sourceRef(map.sources, id, sourcesById.get(id))),
    })),
  };
}

function displayId(map: Record<string, string>, originalId: string): string {
  const found = Object.entries(map).find(([, original]) => original === originalId);
  return found?.[0] ?? originalId;
}

function nodeRef(map: Record<string, string>, id: string, node: NormalizedGraphNode | undefined): GroundingDisplayRef {
  return {
    id: displayId(map, id),
    originalId: id,
    label: node?.label ?? id,
  };
}

function edgeRef(map: Record<string, string>, id: string, edge: NormalizedGraphEdge | undefined): GroundingDisplayRef {
  return {
    id: displayId(map, id),
    originalId: id,
    label: edge?.relationshipType ?? edge?.label ?? id,
  };
}

function sourceRef(map: Record<string, string>, id: string, source: NormalizedSourceReceipt | undefined): GroundingDisplayRef {
  return {
    id: displayId(map, id),
    originalId: id,
    title: source?.title ?? id,
    url: source?.url,
  };
}

function deriveRiskFlags(selected: SelectedAgentContext): AgentPacketRiskFlag[] {
  return dedupeRiskFlags([
    ...selected.sources.filter((source) => source.stale).map((source) => riskFlag({
      id: source.id,
      kind: 'stale_source',
      severity: 'warning',
      label: 'Stale source',
      detail: `${source.title} may need refresh before use.`,
    })),
    ...advisoryRows(selected).map((row) => riskFlag({
      id: row.id,
      kind: 'advisory_row',
      severity: 'notice',
      label: 'Advisory row',
      detail: `${row.label} is advisory or proposed and requires review before promotion.`,
    })),
    ...selected.edges.filter((edge) => edge.confidenceKind === 'INFERRED').map((edge) => riskFlag({
      id: edge.id,
      kind: 'inferred_edge',
      severity: 'notice',
      label: 'Inferred edge',
      detail: `${edge.relationshipType} is inferred rather than directly source-stated.`,
    })),
    ...selected.claims.filter((claim) => claim.contradicts.length || claim.support === 'disputed').map((claim) => riskFlag({
      id: claim.id,
      kind: 'conflict',
      severity: 'warning',
      label: 'Conflicting evidence',
      detail: `${claim.text} has contradictory receipts or disputed support.`,
    })),
    ...missingRows(selected).map((row) => riskFlag({
      id: row.id,
      kind: 'missing_primitive',
      severity: 'warning',
      label: 'Missing primitive',
      detail: `${row.label} marks an evidence or ontology gap.`,
    })),
  ]);
}

function advisoryRows(selected: SelectedAgentContext): Array<{ id: string; label: string }> {
  const nodeRows = selected.nodes
    .filter((node) => node.reviewState === 'advisory' || node.reviewState === 'proposed')
    .map((node) => ({ id: node.id, label: node.label }));
  const edgeRows = selected.edges
    .filter((edge) => edge.reviewState === 'advisory' || edge.reviewState === 'proposed')
    .map((edge) => ({ id: edge.id, label: edge.relationshipType }));
  const claimRows = selected.claims
    .filter((claim) => claim.status === 'advisory' || claim.status === 'proposed')
    .map((claim) => ({ id: claim.id, label: claim.text }));
  return [...nodeRows, ...edgeRows, ...claimRows];
}

function missingRows(selected: SelectedAgentContext): Array<{ id: string; label: string }> {
  const nodeRows = selected.nodes
    .filter((node) => node.reviewState === 'missing' || node.entityType === 'EvidenceGap' || node.entityType === 'Assumption')
    .map((node) => ({ id: node.id, label: node.label }));
  const claimRows = selected.claims
    .filter((claim) => claim.status === 'missing' || claim.type === 'EvidenceGap' || claim.type === 'Assumption')
    .map((claim) => ({ id: claim.id, label: claim.text }));
  return [...nodeRows, ...claimRows];
}

function riskFlag(flag: AgentPacketRiskFlag): AgentPacketRiskFlag {
  return flag;
}

function dedupeRiskFlags(flags: AgentPacketRiskFlag[]): AgentPacketRiskFlag[] {
  const seen = new Set<string>();
  const result: AgentPacketRiskFlag[] = [];
  for (const flag of flags) {
    const key = flag.kind;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(flag);
  }
  return result;
}

export type { AgentPacketRiskFlag, AgentPacketGroundingClaim, OmittedContextItem };
