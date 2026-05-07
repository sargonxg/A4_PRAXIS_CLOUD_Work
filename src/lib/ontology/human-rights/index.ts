import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const HUMAN_RIGHTS_ONTOLOGY: CaseOntologyDefinition = {
  id: 'human-rights',
  version: '1.0.0',
  label: 'Human Rights Ontology',
  description: 'Violations, rights-holders, duty-bearers, legal obligations, remedies, and pattern evidence for human-rights monitoring and treaty-body work.',
  domains: ['human-rights', 'human_rights', 'protection', 'upr', 'treaty-body', 'special-procedures'],
  nodeTypes: [
    { id: 'rights_holder', label: 'Rights Holder', primitive: 'Actor', description: 'Individual or group whose rights are at stake.' },
    { id: 'duty_bearer', label: 'Duty Bearer', primitive: 'Actor', description: 'State, non-state actor, or institution responsible for fulfilling rights obligations.' },
    { id: 'violation_claim', label: 'Violation Claim', primitive: 'Claim', description: 'Asserted breach of an enumerated right, with evidence and attribution.' },
    { id: 'protected_interest', label: 'Protected Interest', primitive: 'Interest', description: 'Interest protected by a right, such as life, dignity, due process, or participation.' },
    { id: 'legal_obligation', label: 'Legal Obligation', primitive: 'Constraint', description: 'Treaty article, customary norm, or domestic rule constraining a duty bearer.' },
    { id: 'accountability_lever', label: 'Accountability Lever', primitive: 'Leverage', description: 'Mechanism for inducing compliance: UPR, treaty body, special procedure, sanctions, or prosecution.' },
    { id: 'remedial_measure', label: 'Remedial Measure', primitive: 'Commitment', description: 'Reparation, guarantee of non-repetition, institutional reform, or other remedy.' },
    { id: 'incident_event', label: 'Incident Event', primitive: 'Event', description: 'Documented incident such as arbitrary detention, torture, killing, or restriction on expression.' },
    { id: 'pattern_narrative', label: 'Pattern Narrative', primitive: 'Narrative', description: 'Frame connecting incidents into a pattern such as systematic, widespread, or targeted conduct.' },
  ],
  edgeTypes: [
    { id: 'violates', label: 'violates', from: ['Actor'], to: ['Constraint'], description: 'Duty bearer violates or is alleged to violate a legal obligation.' },
    { id: 'protects', label: 'protects', from: ['Constraint'], to: ['Interest'], description: 'Legal obligation protects a specific interest.' },
    { id: 'evidences_pattern', label: 'evidences pattern', from: ['Event'], to: ['Narrative'], description: 'Documented incident contributes to a pattern narrative.' },
    { id: 'targets', label: 'targets', from: ['Actor'], to: ['Actor'], description: 'Duty bearer or non-state actor targets a rights holder.' },
    { id: 'requires_remedy', label: 'requires remedy', from: ['Claim'], to: ['Commitment'], description: 'Violation claim requires a specific remedial measure.' },
    { id: 'engages_lever', label: 'engages lever', from: ['Actor'], to: ['Leverage'], description: 'Monitoring body engages an accountability lever.' },
  ],
  validators: [
    { id: 'human-rights.has-rights-holder', label: 'Rights holder identified', severity: 'warn', description: 'Human-rights cases should include at least one rights holder.' },
    { id: 'human-rights.has-duty-bearer', label: 'Duty bearer identified', severity: 'warn', description: 'Violation claims should identify a duty bearer.' },
    { id: 'human-rights.violation-cites-obligation', label: 'Violation cites legal basis', severity: 'warn', description: 'Violation claims should cite the legal obligation at issue.' },
    { id: 'human-rights.pattern-evidenced', label: 'Pattern narrative evidenced', severity: 'info', description: 'Pattern narratives should be supported by multiple incident events.' },
  ],
  recommendedToolIds: [
    'human-rights.violation-tracker',
    'human-rights.upr-cycle-mapper',
    'human-rights.treaty-body-engagement',
    'human-rights.pattern-detector',
    'cross.contradiction-finder',
    'cross.brief-exporter',
    'cross.scenario-projector',
  ],
};
