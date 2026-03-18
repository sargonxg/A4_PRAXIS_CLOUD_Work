import { NextRequest, NextResponse } from 'next/server';
import { getConflict } from '@/lib/services/conflict-service';
import { ENTITY_COLORS } from '@/lib/constants/entity-colors';
import { ensureNordaliaData } from '@/lib/services/nordalia-initializer';

// Map conflict-grammar lowercase types to display EntityType keys
const TYPE_DISPLAY_MAP: Record<string, string> = {
  actor: 'Actor',
  claim: 'Claim',
  interest: 'Interest',
  constraint: 'Constraint',
  leverage: 'Leverage',
  commitment: 'Commitment',
  event: 'Event',
  narrative: 'Narrative',
};

function getColor(type: string): string {
  const displayType = TYPE_DISPLAY_MAP[type] ?? type;
  return ENTITY_COLORS[displayType as keyof typeof ENTITY_COLORS] ?? '#475569';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const conflictId: string = body.conflictId ?? 'nordalia-crisis';
    const entityTypes: string[] | undefined = body.entityTypes;
    const actorId: string | undefined = body.actorId;

    // Ensure the conflict exists, populating from demo data if needed
    ensureNordaliaData(conflictId);

    const conflict = getConflict(conflictId);
    if (!conflict) {
      return NextResponse.json({ error: 'Conflict not found' }, { status: 404 });
    }

    // Build nodes from all entity types
    interface GraphNode {
      id: string;
      label: string;
      type: string;
      color: string;
      size: number;
      description?: string;
      importance: number;
      x: number;
      y: number;
      date?: string;
    }

    interface GraphEdge {
      source: string;
      target: string;
      type: string;
      label: string;
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Helper to check if a type is included
    const includeType = (type: string) => !entityTypes || entityTypes.length === 0 || entityTypes.includes(type);

    // Pre-compute positions using a simple layout based on type
    // Actors get central positions, others are positioned around them
    const LAYOUT_CENTERS: Record<string, { cx: number; cy: number }> = {
      actor: { cx: 400, cy: 220 },
      claim: { cx: 300, cy: 140 },
      interest: { cx: 550, cy: 170 },
      constraint: { cx: 150, cy: 160 },
      leverage: { cx: 600, cy: 300 },
      commitment: { cx: 450, cy: 380 },
      event: { cx: 400, cy: 460 },
      narrative: { cx: 200, cy: 350 },
    };

    // ── Actors ──────────────────────────────────────────────────
    if (includeType('actor')) {
      conflict.actors.forEach((actor, i) => {
        const center = LAYOUT_CENTERS.actor;
        const angle = (2 * Math.PI * i) / Math.max(conflict.actors.length, 1);
        const radius = 120 + (i % 2) * 40;
        nodes.push({
          id: actor.id,
          label: actor.shortName ?? actor.name,
          type: 'actor',
          color: getColor('actor'),
          size: Math.round(8 + 22 * (actor.relationships?.length ? 0.5 + actor.relationships.length * 0.05 : 0.7)),
          description: actor.description,
          importance: Math.min(1, 0.5 + (actor.relationships?.length ?? 0) * 0.05),
          x: Math.round(center.cx + Math.cos(angle) * radius),
          y: Math.round(center.cy + Math.sin(angle) * radius),
        });

        // Actor-to-actor relationship edges
        actor.relationships?.forEach((rel) => {
          edges.push({
            source: actor.id,
            target: rel.targetActorId,
            type: rel.type,
            label: rel.description ?? rel.type,
          });
        });
      });
    }

    // ── Claims ──────────────────────────────────────────────────
    if (includeType('claim')) {
      conflict.claims.forEach((claim, i) => {
        const center = LAYOUT_CENTERS.claim;
        const angle = (2 * Math.PI * i) / Math.max(conflict.claims.length, 1) - Math.PI / 4;
        const radius = 60 + (i % 2) * 30;
        nodes.push({
          id: claim.id,
          label: claim.title,
          type: 'claim',
          color: getColor('claim'),
          size: 16,
          description: claim.description,
          importance: claim.legitimacyScore ?? 0.5,
          x: Math.round(center.cx + Math.cos(angle) * radius),
          y: Math.round(center.cy + Math.sin(angle) * radius),
        });

        // Actor → Claim edge
        if (claim.actorId) {
          edges.push({
            source: claim.actorId,
            target: claim.id,
            type: 'supports',
            label: 'Asserts',
          });
        }

        // Competing claims
        claim.competingClaimIds?.forEach((competingId) => {
          // Only add one direction to avoid duplicates
          if (claim.id < competingId) {
            edges.push({
              source: claim.id,
              target: competingId,
              type: 'adversary',
              label: 'Competes',
            });
          }
        });
      });
    }

    // ── Interests ───────────────────────────────────────────────
    if (includeType('interest')) {
      conflict.interests.forEach((interest, i) => {
        const center = LAYOUT_CENTERS.interest;
        const angle = (2 * Math.PI * i) / Math.max(conflict.interests.length, 1);
        const radius = 50 + (i % 3) * 25;
        nodes.push({
          id: interest.id,
          label: interest.title,
          type: 'interest',
          color: getColor('interest'),
          size: 14,
          description: interest.description,
          importance: interest.priority === 'vital' ? 0.8 : interest.priority === 'important' ? 0.6 : 0.4,
          x: Math.round(center.cx + Math.cos(angle) * radius),
          y: Math.round(center.cy + Math.sin(angle) * radius),
        });

        // Actor → Interest edge
        if (interest.actorId) {
          edges.push({
            source: interest.actorId,
            target: interest.id,
            type: 'supports',
            label: 'Pursues',
          });
        }
      });
    }

    // ── Constraints ─────────────────────────────────────────────
    if (includeType('constraint')) {
      conflict.constraints.forEach((constraint, i) => {
        const center = LAYOUT_CENTERS.constraint;
        const angle = (2 * Math.PI * i) / Math.max(conflict.constraints.length, 1);
        const radius = 50 + (i % 3) * 25;
        nodes.push({
          id: constraint.id,
          label: constraint.title,
          type: 'constraint',
          color: getColor('constraint'),
          size: 14,
          description: constraint.description,
          importance: constraint.severity === 'binding' ? 0.8 : constraint.severity === 'significant' ? 0.6 : 0.4,
          x: Math.round(center.cx + Math.cos(angle) * radius),
          y: Math.round(center.cy + Math.sin(angle) * radius),
        });

        // Constraint → Actor edge
        if (constraint.actorId) {
          edges.push({
            source: constraint.id,
            target: constraint.actorId,
            type: 'threatens',
            label: 'Constrains',
          });
        }
      });
    }

    // ── Leverage ────────────────────────────────────────────────
    if (includeType('leverage')) {
      conflict.leverage.forEach((lev, i) => {
        const center = LAYOUT_CENTERS.leverage;
        const angle = (2 * Math.PI * i) / Math.max(conflict.leverage.length, 1);
        const radius = 50 + (i % 3) * 25;
        nodes.push({
          id: lev.id,
          label: lev.title,
          type: 'leverage',
          color: getColor('leverage'),
          size: 14,
          description: lev.description,
          importance: lev.effectiveness,
          x: Math.round(center.cx + Math.cos(angle) * radius),
          y: Math.round(center.cy + Math.sin(angle) * radius),
        });

        // Actor → Leverage edge
        if (lev.actorId) {
          edges.push({
            source: lev.actorId,
            target: lev.id,
            type: 'supports',
            label: 'Holds',
          });
        }
        // Leverage → Target actor edge
        if (lev.targetActorId) {
          edges.push({
            source: lev.id,
            target: lev.targetActorId,
            type: 'threatens',
            label: 'Leverages',
          });
        }
      });
    }

    // ── Commitments ─────────────────────────────────────────────
    if (includeType('commitment')) {
      conflict.commitments.forEach((com, i) => {
        const center = LAYOUT_CENTERS.commitment;
        const angle = (2 * Math.PI * i) / Math.max(conflict.commitments.length, 1);
        const radius = 60 + (i % 2) * 30;
        nodes.push({
          id: com.id,
          label: com.title,
          type: 'commitment',
          color: getColor('commitment'),
          size: 16,
          description: com.description,
          importance: com.status === 'active' ? 0.7 : com.status === 'suspended' ? 0.5 : 0.4,
          x: Math.round(center.cx + Math.cos(angle) * radius),
          y: Math.round(center.cy + Math.sin(angle) * radius),
          date: com.dateCommitted,
        });

        // Actor → Commitment edge
        if (com.actorId) {
          edges.push({
            source: com.actorId,
            target: com.id,
            type: 'supports',
            label: 'Party to',
          });
        }
        // Counterparties → Commitment edges
        com.counterpartyIds?.forEach((cpId) => {
          edges.push({
            source: cpId,
            target: com.id,
            type: 'supports',
            label: 'Party to',
          });
        });
      });
    }

    // ── Events ──────────────────────────────────────────────────
    if (includeType('event')) {
      conflict.events.forEach((evt, i) => {
        const center = LAYOUT_CENTERS.event;
        // Spread events horizontally along the bottom
        const totalEvents = conflict.events.length;
        const xSpread = 680;
        const x = Math.round(60 + (i / Math.max(totalEvents - 1, 1)) * xSpread);
        nodes.push({
          id: evt.id,
          label: evt.title,
          type: 'event',
          color: getColor('event'),
          size: evt.impact === 'critical' ? 18 : evt.impact === 'major' ? 16 : 14,
          description: evt.description,
          importance: evt.impact === 'critical' ? 0.85 : evt.impact === 'major' ? 0.7 : evt.impact === 'moderate' ? 0.55 : 0.4,
          x,
          y: center.cy + (i % 2) * 25,
          date: evt.date,
        });

        // Event → Actor edges
        evt.actorIds.forEach((actorId) => {
          edges.push({
            source: evt.id,
            target: actorId,
            type: 'supports',
            label: 'Involves',
          });
        });
      });
    }

    // ── Narratives ──────────────────────────────────────────────
    if (includeType('narrative')) {
      conflict.narratives.forEach((nar, i) => {
        const center = LAYOUT_CENTERS.narrative;
        const angle = (2 * Math.PI * i) / Math.max(conflict.narratives.length, 1);
        const radius = 50 + (i % 3) * 25;
        nodes.push({
          id: nar.id,
          label: nar.title,
          type: 'narrative',
          color: getColor('narrative'),
          size: 14,
          description: nar.description,
          importance: nar.effectiveness ?? 0.5,
          x: Math.round(center.cx + Math.cos(angle) * radius),
          y: Math.round(center.cy + Math.sin(angle) * radius),
        });

        // Actor → Narrative edge
        if (nar.actorId) {
          edges.push({
            source: nar.actorId,
            target: nar.id,
            type: 'supports',
            label: 'Promotes',
          });
        }

        // Counter-narrative edges
        nar.counterNarrativeIds?.forEach((cnId) => {
          edges.push({
            source: nar.id,
            target: cnId,
            type: 'adversary',
            label: 'Counters',
          });
        });
      });
    }

    // Filter by actorId focus if provided
    let filteredNodes = nodes;
    let filteredEdges = edges;

    if (actorId) {
      // Find all nodes connected to this actor
      const connectedNodeIds = new Set<string>([actorId]);
      edges.forEach((e) => {
        if (e.source === actorId) connectedNodeIds.add(e.target);
        if (e.target === actorId) connectedNodeIds.add(e.source);
      });
      filteredNodes = nodes.filter((n) => connectedNodeIds.has(n.id));
      const nodeIdSet = new Set(filteredNodes.map((n) => n.id));
      filteredEdges = edges.filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target));
    }

    // Filter edges to only include edges where both endpoints exist in nodes
    const finalNodeIds = new Set(filteredNodes.map((n) => n.id));
    filteredEdges = filteredEdges.filter((e) => finalNodeIds.has(e.source) && finalNodeIds.has(e.target));

    const results = {
      nodes: filteredNodes,
      edges: filteredEdges,
      totalNodes: filteredNodes.length,
      totalEdges: filteredEdges.length,
    };

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Graph query failed' }, { status: 500 });
  }
}
