/**
 * MAW (Mitchell-Agle-Wood) stakeholder salience engine.
 *
 * Scores each Actor node on three attributes: Power, Legitimacy, Urgency.
 * Each attribute is normalised to [0, 1] via graph-edge heuristics. The
 * resulting triple maps to one of 8 salience quadrants as per MAW 1997.
 *
 * Source: Mitchell, Agle & Wood (1997), "Toward a Theory of Stakeholder
 * Identification and Salience."
 */
import type { GraphNode, GraphEdge } from '@/lib/firebase/graph-service';

export type SalienceQuadrant =
  | 'definitive' // power + legitimacy + urgency
  | 'dominant'   // power + legitimacy
  | 'dangerous'  // power + urgency
  | 'dependent'  // legitimacy + urgency
  | 'dormant'    // power only
  | 'discretionary' // legitimacy only
  | 'demanding'     // urgency only
  | 'non-stakeholder';

export interface Salience {
  actorId: string;
  actorLabel: string;
  power: number;
  legitimacy: number;
  urgency: number;
  quadrant: SalienceQuadrant;
}

const POWER_EDGES = new Set(['has_leverage', 'controls_resource', 'commands', 'funds']);
const LEGITIMACY_EDGES = new Set(['recognised_by', 'member_of', 'mandated_by', 'allied_with']);
const URGENCY_EDGES = new Set(['claims_urgency', 'escalates', 'triggered_by', 'violates_norm']);

function classifyQuadrant(p: number, l: number, u: number): SalienceQuadrant {
  const P = p >= 0.5;
  const L = l >= 0.5;
  const U = u >= 0.5;
  if (P && L && U) return 'definitive';
  if (P && L) return 'dominant';
  if (P && U) return 'dangerous';
  if (L && U) return 'dependent';
  if (P) return 'dormant';
  if (L) return 'discretionary';
  if (U) return 'demanding';
  return 'non-stakeholder';
}

export function scoreSalience(nodes: GraphNode[], edges: GraphEdge[]): Salience[] {
  const actors = nodes.filter((n) => n.type === 'Actor');
  return actors.map((a) => {
    let powerCount = 0;
    let legitCount = 0;
    let urgencyCount = 0;
    for (const e of edges) {
      const involvesActor = e.source === a.id || e.target === a.id;
      if (!involvesActor) continue;
      if (POWER_EDGES.has(e.type) && e.source === a.id) powerCount++;
      if (LEGITIMACY_EDGES.has(e.type) && e.target === a.id) legitCount++;
      if (URGENCY_EDGES.has(e.type) && e.source === a.id) urgencyCount++;
    }
    const power = Math.min(1, powerCount / 5);
    const legitimacy = Math.min(1, legitCount / 5);
    const urgency = Math.min(1, urgencyCount / 5);
    return {
      actorId: a.id,
      actorLabel: a.label,
      power,
      legitimacy,
      urgency,
      quadrant: classifyQuadrant(power, legitimacy, urgency),
    };
  });
}
