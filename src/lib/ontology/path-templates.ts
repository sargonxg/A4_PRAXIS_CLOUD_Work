import type { OntologyId, OntologyPathTemplate } from '@/lib/ontology/types';

export const ONTOLOGY_PATH_TEMPLATES: OntologyPathTemplate[] = [
  {
    id: 'conflict.actor-leverage-actor',
    label: 'Actor -> Leverage -> Actor',
    ontologyIds: ['conflict', 'security'],
    description: 'Trace how one actor applies or controls leverage that pressures another actor.',
    steps: [
      { from: ['Actor'], edgeTypeId: 'controls', to: ['Leverage'] },
      { from: ['Leverage'], edgeTypeId: 'pressures', to: ['Actor'] },
    ],
  },
  {
    id: 'conflict.event-violates-commitment',
    label: 'Event -> violates -> Commitment',
    ontologyIds: ['conflict', 'security'],
    description: 'Connect a dated event to a commitment it appears to breach.',
    steps: [
      { from: ['Event'], edgeTypeId: 'violates', to: ['Commitment'] },
    ],
  },
  {
    id: 'conflict.claim-or-event-escalates-event',
    label: 'Claim/Event -> escalates -> Event',
    ontologyIds: ['conflict', 'security'],
    description: 'Represent a source-backed escalation path from a claim or event to a later event.',
    steps: [
      { from: ['Claim', 'Event'], edgeTypeId: 'escalates', to: ['Event'] },
    ],
  },
  {
    id: 'mediation.position-interest-package',
    label: 'Actor -> holds_position -> Claim -> reveals_interest -> Interest -> enables_package -> Commitment',
    ontologyIds: ['mediation'],
    description: 'Turn stated positions into underlying interests and monitorable package commitments.',
    steps: [
      { from: ['Actor'], edgeTypeId: 'holds_position', to: ['Claim'] },
      { from: ['Claim'], edgeTypeId: 'reveals_interest', to: ['Interest'] },
      { from: ['Interest'], edgeTypeId: 'enables_package', to: ['Commitment'] },
    ],
  },
  {
    id: 'economic.ownership-instrument-compliance',
    label: 'Actor -> owns_or_controls -> Actor; Event -> triggers_instrument -> Constraint; Constraint -> requires_compliance -> Commitment',
    ontologyIds: ['economic'],
    description: 'Trace ownership/control, triggering events, legal instruments, and compliance commitments.',
    steps: [
      { from: ['Actor'], edgeTypeId: 'owns_or_controls', to: ['Actor'] },
      { from: ['Event'], edgeTypeId: 'triggers_instrument', to: ['Constraint'] },
      { from: ['Constraint'], edgeTypeId: 'requires_compliance', to: ['Commitment'] },
    ],
  },
  {
    id: 'narrative.amplification-contestation-audience',
    label: 'Actor/Leverage -> amplifies -> Narrative/Claim; Claim -> contests -> Claim; Narrative -> targets_audience -> Interest',
    ontologyIds: ['narrative'],
    description: 'Trace amplification, claim contestation, and audience targeting in an information environment.',
    steps: [
      { from: ['Actor', 'Leverage'], edgeTypeId: 'amplifies', to: ['Narrative', 'Claim'] },
      { from: ['Claim'], edgeTypeId: 'contests', to: ['Claim'] },
      { from: ['Narrative'], edgeTypeId: 'targets_audience', to: ['Interest'] },
    ],
  },
];

export function getPathTemplatesForOntology(ontologyId: OntologyId): OntologyPathTemplate[] {
  return ONTOLOGY_PATH_TEMPLATES.filter((template) => template.ontologyIds.includes(ontologyId));
}
