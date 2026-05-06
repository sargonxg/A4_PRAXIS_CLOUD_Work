import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const CONFLICT_ONTOLOGY: CaseOntologyDefinition = {
  id: 'conflict',
  label: 'Conflict Ontology',
  description: 'Actors, claims, leverage, commitments, escalation events, and narrative frames for political violence and crisis analysis.',
  domains: ['conflict-prevention', 'international-dispute', 'civil', 'political', 'custom'],
  nodeTypes: [
    { id: 'armed_actor', label: 'Armed Actor', primitive: 'Actor', description: 'State, non-state, or aligned force with operational agency.' },
    { id: 'civilian_claim', label: 'Civilian Claim', primitive: 'Claim', description: 'Claim about civilian impact, access, control, or harm.' },
    { id: 'strategic_interest', label: 'Strategic Interest', primitive: 'Interest', description: 'Objective an actor is trying to preserve or expand.' },
    { id: 'access_constraint', label: 'Access Constraint', primitive: 'Constraint', description: 'Physical, political, legal, or logistical restriction.' },
    { id: 'pressure_leverage', label: 'Pressure Leverage', primitive: 'Leverage', description: 'Instrument that can alter actor behavior.' },
    { id: 'ceasefire_commitment', label: 'Ceasefire Commitment', primitive: 'Commitment', description: 'Public or private undertaking to change conduct.' },
    { id: 'escalation_event', label: 'Escalation Event', primitive: 'Event', description: 'Observed event that changes risk or bargaining space.' },
    { id: 'legitimacy_narrative', label: 'Legitimacy Narrative', primitive: 'Narrative', description: 'Frame used to justify action, restraint, or escalation.' },
  ],
  edgeTypes: [
    { id: 'controls', label: 'controls', from: ['Actor'], to: ['Constraint', 'Leverage'], description: 'Actor controls a channel, constraint, or coercive instrument.' },
    { id: 'pressures', label: 'pressures', from: ['Leverage'], to: ['Actor'], description: 'Leverage changes incentives or costs for an actor.' },
    { id: 'violates', label: 'violates', from: ['Event'], to: ['Commitment'], description: 'Observed event appears inconsistent with a commitment.' },
    { id: 'supports_claim', label: 'supports claim', from: ['Event', 'Claim'], to: ['Claim'], description: 'Evidence-bearing item strengthens a claim.' },
  ],
  validators: [
    { id: 'conflict.has-actor', label: 'Actor present', severity: 'warn', description: 'Conflict graphs should include at least one actor node.' },
    { id: 'conflict.has-event-or-claim', label: 'Event or claim present', severity: 'warn', description: 'A conflict graph needs observed events or claims before analysis.' },
    { id: 'conflict.has-leverage-or-constraint', label: 'Leverage surface present', severity: 'info', description: 'Leverage or constraints make recommendations actionable.' },
  ],
  recommendedToolIds: [
    'conflict.leverage-trace',
    'conflict.escalation-timeline',
    'cross.contradiction-finder',
    'cross.scenario-projector',
  ],
};
