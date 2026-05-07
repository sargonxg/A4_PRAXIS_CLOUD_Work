import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const HUMANITARIAN_ONTOLOGY: CaseOntologyDefinition = {
  id: 'humanitarian',
  version: '1.0.0',
  label: 'Humanitarian Ontology',
  description: 'Affected populations, needs assessments, access constraints, responders, assistance commitments, and humanitarian narratives for OCHA/ICRC-style coordination.',
  domains: ['humanitarian', 'ocha', 'icrc', 'protection-cluster', 'needs-assessment', 'access'],
  nodeTypes: [
    { id: 'affected_population', label: 'Affected Population', primitive: 'Actor', description: 'Population group affected by crisis, displacement, protection risk, or service disruption.' },
    { id: 'responding_actor', label: 'Responding Actor', primitive: 'Actor', description: 'UN agency, NGO, Red Cross/Red Crescent actor, authority, or community responder.' },
    { id: 'needs_assessment', label: 'Needs Assessment', primitive: 'Claim', description: 'Structured claim about needs, severity, gaps, or affected population estimates.' },
    { id: 'humanitarian_interest', label: 'Humanitarian Interest', primitive: 'Interest', description: 'Protected humanitarian objective such as access, impartial assistance, health, food security, or shelter.' },
    { id: 'access_constraint', label: 'Access Constraint', primitive: 'Constraint', description: 'Physical, administrative, security, legal, or logistical barrier to assistance.' },
    { id: 'access_lever', label: 'Access Lever', primitive: 'Leverage', description: 'Negotiation, coordination, funding, deconfliction, or diplomatic pressure that can improve access.' },
    { id: 'response_commitment', label: 'Response Commitment', primitive: 'Commitment', description: 'Pledge, convoy plan, service restoration, funding allocation, or operational agreement.' },
    { id: 'shock_event', label: 'Shock Event', primitive: 'Event', description: 'Displacement, attack, disease outbreak, flood, corridor closure, or other humanitarian shock.' },
    { id: 'humanitarian_narrative', label: 'Humanitarian Narrative', primitive: 'Narrative', description: 'Frame shaping response priorities, neutrality claims, access arguments, or donor attention.' },
  ],
  edgeTypes: [
    { id: 'affects_population', label: 'affects population', from: ['Event'], to: ['Actor'], description: 'Shock event affects a population group.' },
    { id: 'documents_need', label: 'documents need', from: ['Claim'], to: ['Interest'], description: 'Needs assessment documents a humanitarian interest.' },
    { id: 'blocks_access', label: 'blocks access', from: ['Constraint'], to: ['Interest'], description: 'Constraint blocks access to a protected humanitarian interest.' },
    { id: 'improves_access', label: 'improves access', from: ['Leverage', 'Commitment'], to: ['Interest'], description: 'Leverage or commitment improves access or response feasibility.' },
    { id: 'responds_to', label: 'responds to', from: ['Actor'], to: ['Event', 'Claim'], description: 'Responder acts in response to a shock or assessed need.' },
    { id: 'frames_response', label: 'frames response', from: ['Narrative'], to: ['Commitment', 'Leverage'], description: 'Narrative shapes the operational or diplomatic response.' },
  ],
  validators: [
    { id: 'humanitarian.population-identified', label: 'Affected population identified', severity: 'warn', description: 'Humanitarian cases should identify affected populations.' },
    { id: 'humanitarian.needs-evidenced', label: 'Needs evidenced', severity: 'warn', description: 'Needs assessments should cite source evidence or methodology.' },
    { id: 'humanitarian.access-constraint-visible', label: 'Access constraint visible', severity: 'info', description: 'Access constraints make response recommendations operational.' },
    { id: 'humanitarian.response-monitorable', label: 'Response monitorable', severity: 'info', description: 'Response commitments should be monitorable.' },
  ],
  recommendedToolIds: [
    'humanitarian.needs-assessment-synthesizer',
    'humanitarian.access-constraint-map',
    'humanitarian.response-gap-brief',
    'humanitarian.cluster-priority-setter',
    'cross.brief-exporter',
    'cross.context-health-explainer',
  ],
};
