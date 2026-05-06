import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const NARRATIVE_ONTOLOGY: CaseOntologyDefinition = {
  id: 'narrative',
  version: '1.0.0',
  label: 'Narrative Ontology',
  description: 'Frames, claims, counter-claims, messengers, audiences, and provenance for information-environment analysis.',
  domains: ['narrative', 'information', 'media', 'public-diplomacy'],
  nodeTypes: [
    { id: 'messenger', label: 'Messenger', primitive: 'Actor', description: 'Speaker, outlet, influencer, or organization carrying a frame.' },
    { id: 'message_claim', label: 'Message Claim', primitive: 'Claim', description: 'Verifiable or contestable assertion in the information environment.' },
    { id: 'audience_interest', label: 'Audience Interest', primitive: 'Interest', description: 'Audience need or concern activated by the frame.' },
    { id: 'credibility_constraint', label: 'Credibility Constraint', primitive: 'Constraint', description: 'Limit on reach, trust, or acceptability.' },
    { id: 'distribution_leverage', label: 'Distribution Leverage', primitive: 'Leverage', description: 'Channel, amplifier, or institutional advantage.' },
    { id: 'message_commitment', label: 'Message Commitment', primitive: 'Commitment', description: 'Public promise or position that can later be checked.' },
    { id: 'media_event', label: 'Media Event', primitive: 'Event', description: 'Publication, statement, rumor burst, or debunking event.' },
    { id: 'frame', label: 'Frame', primitive: 'Narrative', description: 'Interpretive structure that makes claims meaningful to an audience.' },
  ],
  edgeTypes: [
    { id: 'amplifies', label: 'amplifies', from: ['Actor', 'Leverage'], to: ['Narrative', 'Claim'], description: 'Actor or channel increases reach.' },
    { id: 'contests', label: 'contests', from: ['Claim', 'Narrative'], to: ['Claim', 'Narrative'], description: 'Claim or frame disputes another.' },
    { id: 'targets_audience', label: 'targets audience', from: ['Narrative'], to: ['Interest'], description: 'Frame appeals to an audience interest.' },
    { id: 'fact_checks', label: 'fact checks', from: ['Event', 'Claim'], to: ['Claim'], description: 'Evidence-bearing item verifies or challenges a claim.' },
  ],
  validators: [
    { id: 'narrative.frame-claim', label: 'Frame and claim present', severity: 'warn', description: 'Narrative analysis needs frames and checkable claims.' },
    { id: 'narrative.source-path', label: 'Source path present', severity: 'info', description: 'Trace messengers or channels when available.' },
  ],
  recommendedToolIds: [
    'narrative.frame-cascade',
    'narrative.counter-narrative-finder',
    'narrative.fact-check-traceback',
    'cross.contradiction-finder',
  ],
};
