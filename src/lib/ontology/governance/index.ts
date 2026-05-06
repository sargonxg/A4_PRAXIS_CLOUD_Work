import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const GOVERNANCE_ONTOLOGY: CaseOntologyDefinition = {
  id: 'governance',
  version: '1.0.0',
  label: 'Governance Ontology',
  description: 'Mandates, veto points, coalitions, public claims, institutional constraints, and implementation commitments.',
  domains: ['governance', 'political', 'trade', 'international', 'legal'],
  nodeTypes: [
    { id: 'institution', label: 'Institution', primitive: 'Actor', description: 'Formal body, agency, coalition, or sponsor.' },
    { id: 'mandate_claim', label: 'Mandate Claim', primitive: 'Claim', description: 'Claim about authority, authorization, or obligation.' },
    { id: 'policy_interest', label: 'Policy Interest', primitive: 'Interest', description: 'Substantive policy objective.' },
    { id: 'veto_constraint', label: 'Veto Constraint', primitive: 'Constraint', description: 'Procedural or political barrier.' },
    { id: 'coalition_leverage', label: 'Coalition Leverage', primitive: 'Leverage', description: 'Influence derived from votes, blocs, funding, or legitimacy.' },
    { id: 'implementation_action', label: 'Implementation Action', primitive: 'Commitment', description: 'Operational step that follows a mandate.' },
    { id: 'decision_event', label: 'Decision Event', primitive: 'Event', description: 'Vote, ruling, deadline, or agenda event.' },
    { id: 'public_mandate_frame', label: 'Public Mandate Frame', primitive: 'Narrative', description: 'Frame used to justify authority or compliance.' },
  ],
  edgeTypes: [
    { id: 'has_mandate', label: 'has mandate', from: ['Actor'], to: ['Commitment', 'Claim'], description: 'Actor has or claims authority for an action.' },
    { id: 'can_veto', label: 'can veto', from: ['Actor', 'Constraint'], to: ['Commitment'], description: 'Actor or rule can block implementation.' },
    { id: 'joins_coalition', label: 'joins coalition', from: ['Actor'], to: ['Actor'], description: 'Actor aligns with another actor or bloc.' },
    { id: 'creates_authority', label: 'creates authority', from: ['Event'], to: ['Commitment'], description: 'Decision event authorizes a future action.' },
  ],
  validators: [
    { id: 'governance.veto-surface', label: 'Veto surface present', severity: 'info', description: 'Governance products are stronger when veto points are explicit.' },
    { id: 'governance.mandate-link', label: 'Mandate link present', severity: 'warn', description: 'Mandates should connect actors, claims, and commitments.' },
  ],
  recommendedToolIds: [
    'governance.veto-probability',
    'governance.mandate-traceback',
    'governance.coalition-map',
    'cross.brief-exporter',
  ],
};
