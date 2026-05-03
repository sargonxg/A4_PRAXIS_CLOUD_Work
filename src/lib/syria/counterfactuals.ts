export interface SyriaCounterfactual {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  affectedNodes: string[];
  addedEdges: string[];
  pathSearchEffect: string;
}

export const SYRIA_COUNTERFACTUALS: SyriaCounterfactual[] = [
  {
    id: 'sdf_withdraws_from_jan_agreement',
    label: 'SDF withdraws from the January integration agreement',
    shortLabel: 'SDF withdrawal',
    description: 'Treats the 30 January integration commitment as violated and raises downstream security-integration fragility.',
    affectedNodes: ['30 Jan agreement', 'SDF/AANES', 'UN good offices'],
    addedEdges: ['violation -> commitment', 'constraint -> verification mission'],
    pathSearchEffect: 'Moves commitment repair ahead of routine verification.',
  },
  {
    id: 'israel_escalates_southern_incursions',
    label: 'Israel escalates southern incursions',
    shortLabel: 'South escalation',
    description: 'Adds southern flashpoint events and increases regional-spillover constraint severity.',
    affectedNodes: ['Regional spillover', 'Humanitarian access'],
    addedEdges: ['event -> regional spillover', 'event -> humanitarian access'],
    pathSearchEffect: 'Prioritizes deconfliction and Security Council reporting cadence.',
  },
  {
    id: 'humanitarian_funding_collapse',
    label: 'Humanitarian funding collapses',
    shortLabel: 'Funding shock',
    description: 'Turns donor liquidity into a hard constraint affecting returns, services, and access guarantees.',
    affectedNodes: ['Humanitarian access', 'UN good offices'],
    addedEdges: ['funding constraint -> access guarantees'],
    pathSearchEffect: 'Raises contingent access guarantees and donor coordination.',
  },
  {
    id: 'damascus_drops_kurdish_rights_clauses',
    label: 'Damascus drops Kurdish-rights clauses',
    shortLabel: 'Rights clause drop',
    description: 'Marks rights-protection language as contested and increases narrative divergence.',
    affectedNodes: ['Damascus', 'SDF/AANES', '30 Jan agreement'],
    addedEdges: ['claim contest -> narrative divergence'],
    pathSearchEffect: 'Moves rights-verification language into the top action path.',
  },
  {
    id: 'regional_war_escalation',
    label: 'Regional war escalation',
    shortLabel: 'Regional war',
    description: 'Adds spillover events and lowers confidence in routine diplomatic sequencing.',
    affectedNodes: ['Regional spillover', 'UN good offices'],
    addedEdges: ['spillover event -> envoy constraint'],
    pathSearchEffect: 'Prioritizes containment and emergency reporting.',
  },
];

export function counterfactualPenalty(activeIds: string[]): number {
  if (activeIds.length === 0) return 1;
  return Math.max(0.3, Number((0.7 ** activeIds.length).toFixed(3)));
}

export function summarizeCounterfactuals(activeIds: string[]): {
  penalty: number;
  active: SyriaCounterfactual[];
  affectedNodes: string[];
  addedEdges: string[];
} {
  const active = SYRIA_COUNTERFACTUALS.filter((item) => activeIds.includes(item.id));
  return {
    penalty: counterfactualPenalty(activeIds),
    active,
    affectedNodes: [...new Set(active.flatMap((item) => item.affectedNodes))],
    addedEdges: [...new Set(active.flatMap((item) => item.addedEdges))],
  };
}
