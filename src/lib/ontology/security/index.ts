import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const SECURITY_ONTOLOGY: CaseOntologyDefinition = {
  id: 'security',
  version: '1.0.0',
  label: 'Security / Defense Ontology',
  description: 'Capabilities, force posture, threat vectors, doctrines, engagement rules, deterrence levers, and operational events for civil-military and defense planning.',
  domains: ['security', 'defense', 'defence', 'military', 'nato', 'force-posture', 'civil-military'],
  nodeTypes: [
    { id: 'military_actor', label: 'Military Actor', primitive: 'Actor', description: 'State force, alliance, command, unit, militia, or security institution.' },
    { id: 'threat_assessment', label: 'Threat Assessment', primitive: 'Claim', description: 'Claim about adversary intent, capability, vulnerability, or escalation risk.' },
    { id: 'security_interest', label: 'Security Interest', primitive: 'Interest', description: 'Territorial defense, deterrence, civilian protection, access, resilience, or alliance assurance objective.' },
    { id: 'engagement_rule', label: 'Engagement Rule', primitive: 'Constraint', description: 'ROE, mandate limit, treaty obligation, escalation threshold, or political caveat.' },
    { id: 'deterrence_lever', label: 'Deterrence Lever', primitive: 'Leverage', description: 'Posture, signaling, capability deployment, sanction, exercise, or assurance measure that alters incentives.' },
    { id: 'posture_commitment', label: 'Posture Commitment', primitive: 'Commitment', description: 'Deployment pledge, readiness commitment, deconfliction measure, or security guarantee.' },
    { id: 'operational_event', label: 'Operational Event', primitive: 'Event', description: 'Deployment, exercise, incursion, strike, mobilization, cyber event, or posture change.' },
    { id: 'doctrine_narrative', label: 'Doctrine Narrative', primitive: 'Narrative', description: 'Strategic doctrine, threat frame, deterrence story, or escalation narrative.' },
    { id: 'capability', label: 'Capability', primitive: 'Leverage', description: 'Military, cyber, intelligence, logistics, or resilience capability that creates operational leverage.' },
  ],
  edgeTypes: [
    { id: 'deploys_capability', label: 'deploys capability', from: ['Actor'], to: ['Leverage'], description: 'Actor deploys, controls, or signals a capability.' },
    { id: 'threatens_interest', label: 'threatens interest', from: ['Claim', 'Event'], to: ['Interest'], description: 'Assessment or event threatens a security interest.' },
    { id: 'constrained_by_rule', label: 'constrained by rule', from: ['Actor', 'Commitment'], to: ['Constraint'], description: 'Actor or commitment is constrained by an engagement rule or mandate.' },
    { id: 'signals_posture', label: 'signals posture', from: ['Event'], to: ['Commitment', 'Narrative'], description: 'Operational event signals posture or doctrine.' },
    { id: 'deters_actor', label: 'deters actor', from: ['Leverage'], to: ['Actor'], description: 'Deterrence lever changes incentives for an actor.' },
    { id: 'supports_doctrine', label: 'supports doctrine', from: ['Claim', 'Event'], to: ['Narrative'], description: 'Evidence supports a doctrine or threat narrative.' },
  ],
  validators: [
    { id: 'security.actor-identified', label: 'Security actor identified', severity: 'warn', description: 'Security analysis should identify relevant actors or commands.' },
    { id: 'security.constraint-visible', label: 'Constraint visible', severity: 'warn', description: 'Recommendations should account for ROE, mandate, caveats, and treaty limits.' },
    { id: 'security.event-dated', label: 'Operational event dated', severity: 'info', description: 'Operational events should carry valid-time metadata.' },
    { id: 'security.capability-sourced', label: 'Capability sourced', severity: 'info', description: 'Capability claims should cite observable evidence or authoritative sources.' },
  ],
  recommendedToolIds: [
    'security.posture-tracker',
    'security.capability-assessor',
    'security.escalation-modeler',
    'security.alliance-cohesion-map',
    'cross.scenario-projector',
    'cross.brief-exporter',
  ],
};
