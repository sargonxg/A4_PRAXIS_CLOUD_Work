import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const MEDIATION_ONTOLOGY: CaseOntologyDefinition = {
  id: 'mediation',
  label: 'Mediation Ontology',
  description: 'Positions, interests, constraints, commitments, and bargaining-zone evidence for mediation preparation.',
  domains: ['mediation', 'peace-process', 'workplace', 'community', 'legal'],
  nodeTypes: [
    { id: 'party', label: 'Party', primitive: 'Actor', description: 'Participant with a stake in the process.' },
    { id: 'stated_position', label: 'Stated Position', primitive: 'Claim', description: 'Public or negotiating demand.' },
    { id: 'underlying_interest', label: 'Underlying Interest', primitive: 'Interest', description: 'Need or objective behind a position.' },
    { id: 'red_line', label: 'Red Line', primitive: 'Constraint', description: 'Declared or inferred limit on concessions.' },
    { id: 'bargaining_leverage', label: 'Bargaining Leverage', primitive: 'Leverage', description: 'Source of bargaining power.' },
    { id: 'implementation_commitment', label: 'Implementation Commitment', primitive: 'Commitment', description: 'Action that can be monitored after agreement.' },
    { id: 'process_event', label: 'Process Event', primitive: 'Event', description: 'Meeting, breach, proposal, or deadline.' },
    { id: 'face_saving_frame', label: 'Face-Saving Frame', primitive: 'Narrative', description: 'Narrative that makes compromise politically possible.' },
  ],
  edgeTypes: [
    { id: 'holds_position', label: 'holds position', from: ['Actor'], to: ['Claim'], description: 'Party advances a demand or position.' },
    { id: 'reveals_interest', label: 'reveals interest', from: ['Claim'], to: ['Interest'], description: 'Position points to a deeper interest.' },
    { id: 'constrains_offer', label: 'constrains offer', from: ['Constraint'], to: ['Commitment'], description: 'Red line limits a potential commitment.' },
    { id: 'enables_package', label: 'enables package', from: ['Interest', 'Leverage'], to: ['Commitment'], description: 'Interest or leverage supports a possible package.' },
  ],
  validators: [
    { id: 'mediation.party-interest', label: 'Party and interest present', severity: 'warn', description: 'Mediation analysis should connect parties to interests.' },
    { id: 'mediation.commitment-check', label: 'Commitment check', severity: 'info', description: 'Draft packages should create monitorable commitments.' },
  ],
  recommendedToolIds: [
    'mediation.position-vs-interest',
    'mediation.zopa-finder',
    'mediation.mediation-brief',
    'cross.context-health-explainer',
  ],
};
