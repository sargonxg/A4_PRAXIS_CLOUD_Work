import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const ECONOMIC_ONTOLOGY: CaseOntologyDefinition = {
  id: 'economic',
  version: '1.0.0',
  label: 'Economic / Sanctions Ontology',
  description: 'Designated entities, sanctions instruments, ownership networks, payment channels, leverage, and compliance commitments for sanctions and economic-statecraft analysis.',
  domains: ['economic', 'economic-sanctions', 'sanctions', 'financial-intelligence', 'export-control', 'trade'],
  nodeTypes: [
    { id: 'designated_entity', label: 'Designated Entity', primitive: 'Actor', description: 'Individual, organization, vessel, or network subject to or at risk of designation.' },
    { id: 'beneficial_owner', label: 'Beneficial Owner', primitive: 'Actor', description: 'Person or entity exercising ownership or control through direct or indirect holdings.' },
    { id: 'designation_claim', label: 'Designation Claim', primitive: 'Claim', description: 'Claim that conduct satisfies a sanctions or export-control criterion.' },
    { id: 'economic_interest', label: 'Economic Interest', primitive: 'Interest', description: 'Revenue, market access, assets, or financial objective an actor seeks to preserve.' },
    { id: 'sanction_instrument', label: 'Sanction Instrument', primitive: 'Constraint', description: 'Legal regime, license condition, asset freeze, embargo, or export-control rule.' },
    { id: 'economic_leverage', label: 'Economic Leverage', primitive: 'Leverage', description: 'Asset freeze, market denial, licensing pressure, secondary sanctions, or procurement restriction.' },
    { id: 'compliance_commitment', label: 'Compliance Commitment', primitive: 'Commitment', description: 'Due-diligence, reporting, delisting, remediation, or licensing undertaking.' },
    { id: 'transaction_event', label: 'Transaction Event', primitive: 'Event', description: 'Payment, shipment, corporate transfer, procurement event, or designation update.' },
    { id: 'evasion_narrative', label: 'Evasion Narrative', primitive: 'Narrative', description: 'Pattern explaining ownership opacity, front companies, routing, or sanctions evasion.' },
  ],
  edgeTypes: [
    { id: 'owns_or_controls', label: 'owns or controls', from: ['Actor'], to: ['Actor'], description: 'Actor directly or indirectly owns, controls, or fronts for another actor.' },
    { id: 'triggers_instrument', label: 'triggers instrument', from: ['Claim', 'Event'], to: ['Constraint'], description: 'Claim or event activates a sanctions instrument or control.' },
    { id: 'routes_payment', label: 'routes payment', from: ['Event'], to: ['Actor'], description: 'Transaction routes value through an actor, channel, or intermediary.' },
    { id: 'pressures_entity', label: 'pressures entity', from: ['Leverage'], to: ['Actor'], description: 'Economic leverage changes incentives for a target entity.' },
    { id: 'requires_compliance', label: 'requires compliance', from: ['Constraint'], to: ['Commitment'], description: 'Instrument requires a compliance or remediation commitment.' },
    { id: 'supports_evasion_pattern', label: 'supports evasion pattern', from: ['Event', 'Claim'], to: ['Narrative'], description: 'Evidence supports a sanctions-evasion narrative.' },
  ],
  validators: [
    { id: 'economic.designated-entity-identified', label: 'Designated entity identified', severity: 'warn', description: 'Sanctions analysis should identify the entity or network at issue.' },
    { id: 'economic.instrument-cited', label: 'Instrument cited', severity: 'warn', description: 'Designation or compliance claims should cite the relevant legal instrument.' },
    { id: 'economic.ownership-evidence', label: 'Ownership evidence present', severity: 'info', description: 'Ownership/control edges should cite source evidence.' },
    { id: 'economic.transaction-dated', label: 'Transaction dated', severity: 'info', description: 'Transaction events should carry dates where possible.' },
  ],
  recommendedToolIds: [
    'economic.designation-tracer',
    'economic.beneficial-ownership-map',
    'economic.sanctions-impact-model',
    'economic.evasion-pattern-detector',
    'cross.contradiction-finder',
    'cross.brief-exporter',
  ],
};
